import {fork, ChildProcess} from 'child_process';
import {
  IAppDirectory,
  IAppConfig,
  OperationType,
  IAppOperation,
  OnixMessage,
  IRequest,
  OnixConfig,
} from './interfaces';
import {SchemaProvider} from './core/schema.provider';
// Export all core modules & interfaces
export * from './core';
export * from './utils';
export * from './decorators';
export * from './interfaces';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as Router from 'router';
import * as finalhandler from 'finalhandler';
import {Utils} from '@onixjs/sdk/dist/utils';
import {HostBroker} from './core/host.broker';
/**
 * @class OnixJS
 * @author Jonathan Casarrubias <gh: mean-expert-official>
 * @license MIT
 * @description This class provides core functionality.
 *
 * It loads applications as micro-services, which means each
 * of the applications are executed as a separated process.
 *
 * This class also is the communication manager between the
 * applications cluster.
 */
export class OnixJS {
  /**
   * @property version
   * @description Current Onix Version.
   */
  get version(): string {
    return '1.0.0-alpha.20.1';
  }
  /**
   * @property router
   * @description System level router, will provider
   * middleware implementation for cross-compatibility.
   */
  public router: Router = new Router();
  /**
   * @property server
   * @description http server
   */
  private server: http.Server | https.Server;
  /**
   * @property apps
   */
  private _apps: IAppDirectory = {};
  /**
   * @constructor
   * @param config
   * @author Jonathan Casarrubias
   * @license MIT
   * @description Internally exposes a given configuration.
   * It logs to the terminal the current Onix version.
   */
  constructor(public config: OnixConfig = {cwd: process.cwd(), port: 3000}) {
    this.config = Object.assign({cwd: process.cwd(), port: 3000}, config);
    // Listener for closing process
    process.on('exit', () => this.stop());
    // Log Onix Version
    console.info('Loading Onix Server Version: ', this.version);
  }
  /**
   * @method ping
   * @param name
   * @author Jonathan casarrubias
   * @license MIT
   * @returns Promise<Config>
   * @description This method pings an application by the given name.
   * The application name corresponds the application class name.
   **/
  async ping(name: string): Promise<IAppConfig> {
    return new Promise<IAppConfig>((resolve, reject) => {
      if (!this._apps[name])
        throw new Error(
          `OnixJS Error: Trying to ping unexisting app "${name}".`,
        );
      const operation: IAppOperation = {
        uuid: Utils.uuid(),
        type: OperationType.APP_PING,
        message: {
          rpc: 'ping',
          request: {
            metadata: {},
            payload: {},
          },
        },
      };
      this._apps[name].process.on('message', (response: IAppOperation) => {
        if (
          response.uuid === operation.uuid &&
          response.type === OperationType.APP_PING_RESPONSE
        ) {
          resolve(<IAppConfig>response.message.request.payload);
        }
      });
      this._apps[name].process.send(operation);
    });
  }
  /**
   * @method greet
   * @param name
   * @author Jonathan casarrubias
   * @license MIT
   * @returns Promise<Config>
   * @description This will coordinate applications to say hello
   * each other.
   **/
  async greet(): Promise<boolean[][]> {
    const apps: string[] = Object.keys(this._apps);
    return Promise.all(
      Object.keys(this._apps).map(
        (name: string) =>
          new Promise<boolean[]>((resolve, reject) => {
            const operation: IAppOperation = {
              uuid: Utils.uuid(),
              type: OperationType.APP_GREET,
              message: {
                rpc: '[apps].isAlive', // [apps] will be overriden inside each app
                request: {
                  metadata: {},
                  payload: apps,
                },
              },
            };
            this._apps[name].process.on(
              'message',
              (response: IAppOperation) => {
                if (
                  response.uuid === operation.uuid &&
                  response.type === OperationType.APP_GREET_RESPONSE
                ) {
                  resolve(<boolean[]>response.message.request.payload);
                }
              },
            );
            // Send Greet Operation
            this._apps[name].process.send(operation);
          }),
      ),
    );
  }
  /**
   * @method load
   * @param namespace
   * @author Jonathan Casarrubias
   * @license MIT
   * @returns Promise<ChildProcess>
   * @description This method will load a new process for the given
   * application namespace.
   *
   * A namespace is composed by class name at app.name.
   *
   * Example:
   *
   * directory -> my.app
   * class name -> MyApp
   *
   * namespace = MyApp@my.app
   **/
  async load(namespace: string): Promise<ChildProcess | Error> {
    return new Promise<ChildProcess | Error>((resolve, reject) => {
      const parts: string[] = namespace.split('@');
      const name: string = parts.shift() || '';
      let directory: string = parts.shift() || '';
      let port: number = 0;
      let disableNetwork;
      if (directory.match(/:[\d]{2,5}/)) {
        const p = directory.split(':');
        directory = p.shift() || '';
        port = parseInt(p.shift() || '') || port;
      }
      if (directory.match(/:disabled/)) {
        const p = directory.split(':');
        directory = p.shift() || '';
        disableNetwork = true;
      }
      // Verify for duplicated applications
      if (this._apps[name]) {
        reject(new Error('OnixJS Error: Trying to add duplicated application'));
      } else {
        // Create Application Operation Object
        const operation: IAppOperation = <IAppOperation>{
          // Set UUID
          uuid: Utils.uuid(),
          // Set App Create Operation
          type: OperationType.APP_CREATE,
          // Send host level parameters here
          message: {
            request: {
              payload: {
                port,
                network: {disabled: disableNetwork},
              },
            },
          },
        };
        // Create a child process for this new app
        this._apps[name] = {process: fork(`${this.config.cwd}/${directory}`)};
        // Create listener for application messages
        this._apps[name].process.on('message', (response: IAppOperation) => {
          if (
            response.type === OperationType.APP_CREATE_RESPONSE &&
            operation.uuid === response.uuid
          ) {
            // store app config for client management
            this._apps[name].config = response.message.request.payload;
            // resolve process
            resolve();
          }
        });
        // Create Application Instance (Signal)
        // Must Follow App Operation
        this._apps[name].process.send(operation);
      }
    });
  }
  /**
   * @method coordinate
   * @param rpc
   * @param request
   * @author Jonathan Casarrubias
   * @license MIT
   * @returns Promise<IAppOperation>
   * @description This method will coordinate a call
   * using the given rpc namespace and request data.
   *
   * Example of usage:
   *
   * onix.coordinate('MyModel.Module.Component.Method')
   */
  coordinate(rpc: string, request: IRequest) {
    return new Promise<IAppOperation>((resolve, reject) => {
      const operation: IAppOperation = {
        uuid: Utils.uuid(),
        type: OperationType.ONIX_REMOTE_CALL_PROCEDURE,
        message: <OnixMessage>{
          rpc,
          request,
        },
      };
      const callee: string = rpc.split('.').shift() || '';
      if (this._apps[callee]) {
        this._apps[callee].process.on('message', (response: IAppOperation) => {
          if (
            response.type === OperationType.ONIX_REMOTE_CALL_PROCEDURE_RESPONSE
          ) {
            resolve(response);
          }
        });
        this._apps[callee].process.send(operation);
      } else {
        reject(new Error('Unable to find callee application'));
      }
    });
  }
  /**
   * @method start
   * @author Jonathan Casarrubias
   * @license MIT
   * @returns Promise<OperationType.APP_START_RESPONSE[]>
   * @description This method will start the server application and
   * all the loaded child applications.
   */
  async start(): Promise<OperationType.APP_START_RESPONSE[]> {
    return Promise.all(
      // Concatenate an array of promises, starting from Onix Server,
      // Then map each app reference to create promises for start operation.
      Object.keys(this._apps).map(
        (name: string) =>
          new Promise<OperationType.APP_START_RESPONSE>((resolve, reject) => {
            this._apps[name].process.on(
              'message',
              (operation: IAppOperation) => {
                if (operation.type === OperationType.APP_START_RESPONSE) {
                  resolve(OperationType.APP_START_RESPONSE);
                }
              },
            );
            this._apps[name].process.send({type: OperationType.APP_START});
          }),
      ),
    ).then(
      (res: OperationType.APP_START_RESPONSE[]) =>
        new Promise<OperationType.APP_START_RESPONSE[]>(
          async (resolve, reject) => {
            await this.startSystemServer();
            resolve(res);
          },
        ),
    );
  }
  /**
   * @method start
   * @author Jonathan Casarrubias
   * @license MIT
   * @returns Promise<OperationType.APP_STOP_RESPONSE[]>
   * @description This method will start the server application and
   * all the loaded child applications.
   */
  async stop(): Promise<OperationType.APP_STOP_RESPONSE[]> {
    return Promise.all(
      // Concatenate an array of promises, starting from Onix Server,
      // Then map each app reference to create promises for start operation.
      Object.keys(this._apps).map((name: string) => {
        return new Promise<OperationType.APP_STOP_RESPONSE>(
          (resolve, reject) => {
            this._apps[name].process.on(
              'message',
              (operation: IAppOperation) => {
                if (operation.type === OperationType.APP_STOP_RESPONSE) {
                  delete this._apps[name];
                  resolve(OperationType.APP_STOP_RESPONSE);
                }
              },
            );
            this._apps[name].process.send({type: OperationType.APP_STOP});
          },
        );
      }),
    ).then(
      (res: OperationType.APP_STOP_RESPONSE[]) =>
        new Promise<OperationType.APP_STOP_RESPONSE[]>((resolve, reject) => {
          this.server.close(() => resolve(res));
        }),
    );
  }
  /**
   * @method startSystemServer
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This method will start the systemm level server.
   */
  private async startSystemServer() {
    return new Promise(resolve => {
      // Setup server
      this.server = this.createServer();
      // Create schema provider route
      new SchemaProvider(this.router, this._apps);
      // Listen Server Port
      this.server.listen(this.config.port);
      // Create schema provider route
      new HostBroker(this.server, this._apps);
      // Indicate the ONIX SERVER is now listening on the given port
      console.log(`ONIXJS HOST LOADED: Listening on port ${this.config.port}`);
      // Resolve Server
      resolve();
    });
  }

  private createServer() {
    // Return an HTTP Server Instance
    return this.config.port === 443
      ? // Create secure HTTPS Connection
        https.createServer(
          {
            key: fs.readFileSync(
              this.config.network && this.config.network!.ssl
                ? this.config.network!.ssl!.key
                : './ssl/file.key',
            ),
            cert: fs.readFileSync(
              this.config.network && this.config.network!.ssl
                ? this.config.network!.ssl!.cert
                : './ssl/file.cert',
            ),
          },
          (req, res) => this.listener(req, res),
        )
      : // Create insecure HTTP Connection
        http.createServer((req, res) => this.listener(req, res));
  }

  private listener(req: http.IncomingMessage, res: http.ServerResponse) {
    // Here you might need to do something dude...
    this.router(req, res, finalhandler(req, res));
  }

  public apps(): IAppDirectory {
    return this._apps;
  }
}
