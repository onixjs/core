import {fork, ChildProcess} from 'child_process';
import {IAppDirectory, IAppConfig, OnixConfig} from './interfaces';
import {SchemaProvider} from './core/schema.provider';
export * from './core';
export * from './utils';
export * from './decorators';
export * from './interfaces';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import * as Router from 'router';
import * as finalhandler from 'finalhandler';
import {Utils} from '@onixjs/sdk/dist/utils';
import {HostBroker} from './core/host.broker';
import {promisify} from 'util';
import {WSAdapter} from './adapters/ws.adapter';
import {IAppOperation, OperationType, IRequest, OnixMessage} from '@onixjs/sdk';
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
    return '1.0.0-beta.3.3';
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
  constructor(
    public config: OnixConfig = {
      cwd: process.cwd(),
      port: 3000,
      adapters: {websocket: WSAdapter},
    },
  ) {
    this.config = Object.assign({cwd: process.cwd(), port: 3000}, config);
    // Log Onix Version
    console.info('Loading Onix Server Version: ', this.version);
    // Kill Childs On Exit
    process.on('exit', () =>
      Object.keys(this._apps).forEach((key: string) => {
        this._apps[key].process.kill();
      }),
    );
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
      const uuid: string = Utils.uuid();
      const operation: IAppOperation = {
        uuid,
        type: OperationType.APP_PING,
        message: {
          rpc: 'ping',
          request: {
            metadata: {
              stream: false,
              subscription: uuid,
            },
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
            const uuid: string = Utils.uuid();
            const operation: IAppOperation = {
              uuid,
              type: OperationType.APP_GREET,
              message: {
                rpc: '[apps].isAlive', // [apps] will be overriden inside each app
                request: {
                  metadata: {
                    stream: false,
                    subscription: uuid,
                  },
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
      const uuid: string = Utils.uuid();
      const operation: IAppOperation = {
        uuid,
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
    const result = await Promise.all(
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
    );
    await this.startSystemServer();
    return result;
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
    const result = await Promise.all(
      // Concatenate an array of promises, starting from Onix Server,
      // Then map each app reference to create promises for start operation.
      Object.keys(this._apps).map((name: string) => {
        return new Promise<OperationType.APP_STOP_RESPONSE>(
          (resolve, reject) => {
            this._apps[name].process.on(
              'message',
              (operation: IAppOperation) => {
                if (operation.type === OperationType.APP_STOP_RESPONSE) {
                  this._apps[name].process.kill();
                  delete this._apps[name];
                  resolve(OperationType.APP_STOP_RESPONSE);
                }
              },
            );
            this._apps[name].process.send({type: OperationType.APP_STOP});
          },
        );
      }),
    );
    // Close the server
    this.server.close();
    return result;
  }
  /**
   * @method startSystemServer
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This method will start the systemm level server.
   */
  private async startSystemServer() {
    return new Promise((resolve, reject) => {
      // Setup server
      this.server = this.createServer();
      // Verify if there is an SSL Activation File
      // To active the a HOST SSL Domain
      if (
        this.config &&
        this.config.network! &&
        this.config.network!.ssl! &&
        this.config.network!.ssl!.activation &&
        this.config.network!.ssl!.activation!.path &&
        this.config.network!.ssl!.activation!.endpoint
      ) {
        console.log('SERVING ACTIVATION FILE');
        this.serveActivationFile();
      }
      // Create schema provider route
      new SchemaProvider(this.router, this._apps);
      // Listen Server Port
      this.server.listen(this.config.port);
      // Create WebSocket Adapter Instance
      const adapter = new this.config.adapters.websocket();
      // Create Onix Host Instance
      new HostBroker(this.server, adapter, this._apps);
      // Indicate the ONIX SERVER is now listening on the given port
      console.log(`ONIXJS HOST LOADED: Listening on port ${this.config.port}`);
      // Resolve Server
      resolve();
    });
  }
  /**
   * @method serveActivationFile
   * @description This method is a helper in order to serve activation ssl files.
   * Since a SOA Project will always require a specific domain for the OnixJS Host.
   * Sometimes activation require to publish .well-known/activationfile.txt this
   * method will help developers to activate their SSL Certificates.
   *
   * Note: SOA Services Domains must be activated within their own router. In other words
   * you need to create a component and use the @Router.get('.well-known/activationfile.txt')
   * decorator to provide your own activation files when deciding to expose a service over network.
   **/
  serveActivationFile() {
    this.router.get(
      this.config.network!.ssl!.activation!.endpoint,
      async (req, res) => {
        const pathname: string = path.join(
          this.config.cwd || process.cwd(),
          this.config.network!.ssl!.activation!.path || '/',
        );
        // Promisify exists and readfile
        const AsyncExists = promisify(fs.exists);
        const AsyncReadFile = promisify(fs.readFile);
        // Verify the pathname exists
        const exist: boolean = await AsyncExists(pathname);
        // If not, return 404 code
        if (!exist) {
          // if the file is not found, return 404
          res.statusCode = 404;
          return res.end(
            JSON.stringify({
              code: res.statusCode,
              message: `Activation file not found.`,
            }),
          );
        }
        // read file from file system
        const data = await AsyncReadFile(pathname);
        // Set response headers
        res.setHeader('Content-type', 'text/plain');
        res.end(data.toString());
      },
    );
  }
  /**
   * @method createServer
   * @description This method simply creates an HTTP(S) Server that will be used as
   * the OnixJS HTTP Server. It must not be confused with each SOA Service Domain.
   * Since SOA Services might use their own domain -or not- will require different
   * activation files and ssl certificates.
   **/
  private createServer() {
    // Return an HTTP Server Instance
    return this.config.port === 443
      ? // Create secure HTTPS Connection
        https.createServer(
          {
            key: fs.readFileSync(
              this.config.network &&
              this.config.network!.ssl &&
              this.config.network!.ssl!.key
                ? this.config.network!.ssl!.key || ''
                : './ssl/file.key',
            ),
            cert: fs.readFileSync(
              this.config.network &&
              this.config.network!.ssl &&
              this.config.network!.ssl!.cert
                ? this.config.network!.ssl!.cert || ''
                : './ssl/file.cert',
            ),
          },
          (req, res) => this.listener(req, res),
        )
      : // Create insecure HTTP Connection
        http.createServer((req, res) => this.listener(req, res));
  }
  /**
   * @method listener
   * @param req
   * @param res
   * @description This method will define the final middleware when an HTTP
   * request is called to the OnixJS Host.
   */
  private listener(req: http.IncomingMessage, res: http.ServerResponse) {
    // Here you might need to do something dude...
    this.router(req, res, finalhandler(req, res));
  }
  /**
   * @method apps
   * @description This method will return the configure application processes and
   * configurations.
   */
  public apps(): IAppDirectory {
    return this._apps;
  }
}
