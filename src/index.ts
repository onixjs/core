import {fork, ChildProcess} from 'child_process';
import {
  IAppDirectory,
  IAppConfig,
  OperationType,
  IAppOperation,
  ICall,
  IRequest,
  OnixConfig,
} from './index';
import {OnixServer} from './core/onix.server';
import * as uuid from 'uuid';
// Export all core modules & interfaces
export * from './core';
export * from './utils';
export * from './decorators';
export * from './interfaces';
/**
 * @class Onix
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
export class Onix {
  /**
   * @property version
   * @description Current Onix Version.
   */
  get version(): string {
    return '1.0.0-alpha.4.1';
  }
  /**
   * @property server
   */
  private _server: OnixServer;
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
      const to = setTimeout(
        () => reject(new Error('Application Ping timeout after 5000 ms')),
        5000,
      );
      this._apps[name].process.on('message', (operation: IAppOperation) => {
        if (operation.type === OperationType.APP_PING_RESPONSE) {
          clearTimeout(to);
          resolve(<IAppConfig>operation.message);
        }
      });
      this._apps[name].process.send({type: OperationType.APP_PING});
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
            this._apps[name].process.on(
              'message',
              (operation: IAppOperation) => {
                if (operation.type === OperationType.APP_GREET_RESPONSE) {
                  resolve(<boolean[]>operation.message);
                }
              },
            );
            this._apps[name].process.send({
              type: OperationType.APP_GREET,
              message: apps,
            });
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
  async load(namespace: string): Promise<ChildProcess> {
    return new Promise<ChildProcess>((resolve, reject) => {
      const parts: string[] = namespace.split('@');
      const name: string = parts.shift() || '';
      const directory: string = parts.shift() || '';
      // Verify for duplicated applications
      if (this._apps[name]) {
        reject(new Error('Trying to add duplicated application'));
      } else {
        // Create a child process for this new app
        this._apps[name] = {process: fork(`${this.config.cwd}/${directory}`)};
        // Create listener for application messages
        this._apps[name].process.on(
          'message',
          async (operation: IAppOperation) => {
            switch (operation.type) {
              case OperationType.APP_CREATE_RESPONSE:
                //store app config for client management
                this._apps[name].config = operation.message;
                resolve(this._apps[name].process);
                break;
              case OperationType.ONIX_REMOTE_CALL_PROCEDURE:
                this._apps[name].process.send(
                  await this.coordinate(
                    (<ICall>operation.message).rpc,
                    (<ICall>operation.message).request,
                  ),
                );
                break;
            }
          },
        );
        // Create Application Instance (Signal)
        // Must Follow App Operation
        this._apps[name].process.send(<IAppOperation>{
          type: OperationType.APP_CREATE,
        });
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
      console.log('Onix server got remote call procedure');
      const operation: IAppOperation = {
        uuid: uuid(),
        type: OperationType.ONIX_REMOTE_CALL_PROCEDURE,
        message: <ICall>{
          rpc,
          request,
        },
      };
      const callee: string = rpc.split('.').shift() || '';
      console.log('Onix server caller: ', request.metadata.caller);
      console.log('Onix server callee: ', callee);
      if (this._apps[callee]) {
        this._apps[callee].process.on('message', (response: IAppOperation) => {
          if (
            response.type === OperationType.ONIX_REMOTE_CALL_PROCEDURE_RESPONSE
          ) {
            console.log(
              `Onix server response from callee (${callee}): `,
              response.message,
            );
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
    return (
      Promise.all(
        // Concatenate an array of promises, starting from Onix Server,
        // Then map each app reference to create promises for start operation.
        [this.startAppServer()].concat(
          Object.keys(this._apps).map((name: string) => {
            return new Promise<OperationType.APP_START_RESPONSE>(
              (resolve, reject) => {
                this._apps[name].process.on(
                  'message',
                  (operation: IAppOperation) => {
                    if (operation.type === OperationType.APP_START_RESPONSE) {
                      resolve(OperationType.APP_START_RESPONSE);
                    }
                  },
                );
                this._apps[name].process.send({type: OperationType.APP_START});
              },
            );
          }),
        ),
      )
        // Once every app is loaded, then we start the system server
        .then(
          (res: OperationType.APP_START_RESPONSE[]) =>
            new Promise<OperationType.APP_START_RESPONSE[]>(
              async (resolve, reject) => {
                await this.startSystemServer();
                resolve(res);
              },
            ),
        )
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
          this._server.stop();
          resolve(res);
        }),
    );
  }
  /**
   * @method startSystemServer
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This method will start the systemm level server.
   */
  private async startSystemServer(): Promise<OperationType.APP_START_RESPONSE> {
    return new Promise<OperationType.APP_START_RESPONSE>(
      async (resolve, reject) => {
        this._server = new OnixServer(this);
        this._server.start();
        resolve(OperationType.APP_START_RESPONSE);
      },
    );
  }
  /**
   * @method startAppServer
   * @author Jonathan Casarrubias
   * @license MIT
   * @returns Promise<OperationType.APP_START_RESPONSE[]>
   * @description This method will start the server application.
   */
  private async startAppServer(): Promise<OperationType.APP_START_RESPONSE> {
    return new Promise<OperationType.APP_START_RESPONSE>((resolve, reject) => {
      resolve(OperationType.APP_START_RESPONSE);
    });
  }

  public apps(): IAppDirectory {
    return this._apps;
  }
}
