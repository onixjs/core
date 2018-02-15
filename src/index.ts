import {fork /*, ChildProcess*/, ChildProcess} from 'child_process';
import {
  IAppDirectory,
  IConfig,
  OperationType,
  IAppOperation,
  ICall,
} from './index';
// Export all core modules & interfaces
export * from './core';
export * from './utils';
export * from './decorators';
export * from './interfaces';
export interface OnixConfig {
  cwd: string;
}
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
    return '1.0.0-alpha.3';
  }
  /**
   * @property apps
   */
  private apps: IAppDirectory = {};
  /**
   * @property list
   */
  private list: {[name: string]: IConfig} = {};
  /**
   * @constructor
   * @param config
   * @author Jonathan Casarrubias
   * @license MIT
   * @description Internally exposes a given configuration.
   * It logs to the terminal the current Onix version.
   */
  constructor(private config: OnixConfig = {cwd: process.cwd()}) {
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
  async ping(name: string): Promise<IConfig> {
    return new Promise<IConfig>((resolve, reject) => {
      const to = setTimeout(
        () => reject(new Error('Application Ping timeout after 5000 ms')),
        5000,
      );
      this.apps[name].on('message', (operation: IAppOperation) => {
        if (operation.type === OperationType.APP_PING_RESPONSE) {
          clearTimeout(to);
          resolve(<IConfig>operation.message);
        }
      });
      this.apps[name].send({type: OperationType.APP_PING});
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
    const apps: string[] = Object.keys(this.apps);
    return Promise.all(
      Object.keys(this.apps).map(
        (name: string) =>
          new Promise<boolean[]>((resolve, reject) => {
            this.apps[name].on('message', (operation: IAppOperation) => {
              if (operation.type === OperationType.APP_GREET_RESPONSE) {
                resolve(<boolean[]>operation.message);
              }
            });
            this.apps[name].send({
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
      if (this.apps[name]) {
        reject(new Error('Trying to add duplicated application'));
      } else {
        // Create a child process for this new app
        this.apps[name] = fork(`${this.config.cwd}/${directory}`);
        // Create listener for application messages
        this.apps[name].on('message', async (operation: IAppOperation) => {
          switch (operation.type) {
            case OperationType.APP_CREATE_RESPONSE:
              this.list[name] = await this.ping(name);
              resolve(this.apps[name]);
              break;
            case OperationType.ONIX_REMOTE_CALL_PROCEDURE:
              this.apps[name].send(
                await this.call(
                  (<ICall>operation.message).rpc,
                  (<ICall>operation.message).request,
                ).as(name),
              );
              break;
          }
        });
        // Create Application Instance (Signal)
        // Must Follow App Operation
        this.apps[name].send(<IAppOperation>{
          type: OperationType.APP_CREATE,
        });
      }
    });
  }
  /**
   * @method call.as
   * @param rpc
   * @param request
   * @author Jonathan Casarrubias
   * @license MIT
   * @returns Promise<IAppOperation>
   * @description This method will call a remote method
   * using the given rpc namespace and request data.
   *
   * Example of usage:
   *
   * onix.call('MyModel.Module.Component.Method')
   */
  call(rpc: string, request?: any) {
    return {
      as: async (caller: string): Promise<IAppOperation> =>
        new Promise<IAppOperation>((resolve, reject) => {
          console.log('Onix server got remote call procedure');
          const operation: IAppOperation = {
            type: OperationType.ONIX_REMOTE_CALL_PROCEDURE,
            message: {
              rpc,
              request,
            },
          };
          const callee: string = rpc.split('.').shift() || '';
          console.log('Onix server caller: ', caller);
          console.log('Onix server callee: ', callee);
          if (this.apps[callee]) {
            this.apps[callee].on('message', (response: IAppOperation) => {
              if (
                response.type ===
                OperationType.ONIX_REMOTE_CALL_PROCEDURE_RESPONSE
              ) {
                console.log(
                  `Onix server response from callee (${callee}): `,
                  response.message,
                );
                resolve(response);
              }
            });
            this.apps[callee].send(operation);
          } else {
            reject(new Error('Unable to find callee application'));
          }
        }),
    };
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
      [this.startServer()].concat(
        Object.keys(this.apps).map((name: string) => {
          return new Promise<OperationType.APP_START_RESPONSE>(
            (resolve, reject) => {
              this.apps[name].on('message', (operation: IAppOperation) => {
                if (operation.type === OperationType.APP_START_RESPONSE) {
                  resolve(OperationType.APP_START_RESPONSE);
                }
              });
              this.apps[name].send({type: OperationType.APP_START});
            },
          );
        }),
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
      Object.keys(this.apps).map((name: string) => {
        return new Promise<OperationType.APP_STOP_RESPONSE>(
          (resolve, reject) => {
            this.apps[name].on('message', (operation: IAppOperation) => {
              if (operation.type === OperationType.APP_STOP_RESPONSE) {
                resolve(OperationType.APP_STOP_RESPONSE);
              }
            });
            this.apps[name].send({type: OperationType.APP_STOP});
          },
        );
      }),
    );
  }
  /**
   * @method startServer
   * @author Jonathan Casarrubias
   * @license MIT
   * @returns Promise<OperationType.APP_START_RESPONSE[]>
   * @description This method will start the server application.
   */
  private async startServer(): Promise<OperationType.APP_START_RESPONSE> {
    return new Promise<OperationType.APP_START_RESPONSE>((resolve, reject) => {
      resolve(OperationType.APP_START_RESPONSE);
    });
  }
}
