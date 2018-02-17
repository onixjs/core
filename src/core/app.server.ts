import 'reflect-metadata';
import {
  OperationType,
  IAppOperation,
  IAppConfig,
  AppConstructor,
  ICall,
} from '../index';
import {AppFactory} from './app.factory';
import {CallAnswerer} from './call.answerer';
import * as WebSocket from 'uws';
import {ClientConnection} from './index';
/**
 * @function AppServer
 * @author Jonathan Casarrubias
 * @param operation
 * @license MIT
 * @description This class handles an application level server.
 * Since each application is considered a micro-service, it will
 * load its own server (HTTP/WS)
 */
export class AppServer {
  /**
   * @property server
   * @description ws server
   */
  private server: WebSocket.Server;
  /**
   * @property factory
   * @description Current process factory reference
   */
  private factory: AppFactory;
  /**
   * @property answerer
   * @description Current process call answerer reference
   */
  private answerer: CallAnswerer;
  /**
   * @constructor
   * @param AppClass
   * @param config
   * @description Gateway constructor, it will listen for
   * parent process events.
   */
  constructor(private AppClass: AppConstructor, private config: IAppConfig) {
    // Setup Node Process
    process.on('message', (operation: IAppOperation) =>
      this.operation(operation),
    );
  }
  /**
   * @method operation
   * @param operation
   * @author Jonathan Casarrubias
   * @license MIT
   * @description Handles operation between processes.
   * Each application boots a gateway instance in order
   * to be coordinated with other onix applications.
   */
  private async operation(operation: IAppOperation) {
    // Verify we got a valid operation
    if (process.send && (typeof operation !== 'object' || !operation.type))
      process.send('Onix app: unable to get child operation type');
    // Switch case valid operations
    switch (operation.type) {
      // Event sent from broker when loading a project
      case OperationType.APP_CREATE:
        this.factory = new AppFactory(this.AppClass, this.config);
        this.answerer = new CallAnswerer(this.factory, this.AppClass);
        break;
      // Event sent from the broker when starting a project
      case OperationType.APP_START:
        // Start WebSocket Server
        await Promise.all([
          // Start up Micra WebSocket Server
          new Promise<WebSocket.Server>(resolve => {
            this.server = new WebSocket.Server(
              {host: this.config.host, port: this.config.port},
              () => resolve(),
            );
          }),
          // Start up application
          this.factory.app.start(),
        ]);
        // Wait for client connections
        this.server.on(
          'connection',
          (ws: WebSocket) => new ClientConnection(ws, this.answerer),
        );
        if (process.send)
          process.send({type: OperationType.APP_START_RESPONSE});
        break;
      // Event sent from the broker when stoping a project
      case OperationType.APP_STOP:
        const close = async () =>
          new Promise((resolve, reject) => this.server.close(resolve));
        await this.factory.app.stop();
        await close();
        if (process.send) process.send({type: OperationType.APP_STOP_RESPONSE});
        break;
      // Event sent from caller -> broker -> currentApp
      // These events are done through internal processes.
      // External remote calls will be executed inside the OnixConnection
      case OperationType.ONIX_REMOTE_CALL_PROCEDURE:
        const result = await this.answerer.process(<ICall>operation.message);
        // Send result back to broker
        if (process.send)
          process.send({
            type: OperationType.ONIX_REMOTE_CALL_PROCEDURE_RESPONSE,
            message: result,
          });
        break;
      // System level event to coordinate every application in the
      // cluster, in order to automatically call between each others
      case OperationType.APP_GREET:
        let apps: string[] = <string[]>operation.message;
        apps = apps.filter((name: string) => this.AppClass.name !== name);
        const results: boolean[] = await this.greet(apps);
        if (process.send)
          process.send({
            type: OperationType.APP_GREET_RESPONSE,
            message: results,
          });
        break;
      // Sytem level event
      case OperationType.APP_PING:
        if (process.send)
          process.send({
            type: OperationType.APP_PING_RESPONSE,
            message: this.config,
          });
        break;
    }
  }
  /**
   * @method greet
   * @param apps
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This method will coordinate every loaded
   * application within this server in order to confirm all
   * off the applications are up and running.
   */
  private async greet(apps: string[]): Promise<boolean[]> {
    return Promise.all(
      apps.map(
        (name: string) =>
          new Promise<boolean>(async (resolve, reject) => {
            const result: boolean = await this.factory.app.rpc
              .topic(`${name}.isAlive`)
              .call();
            resolve(result);
          }),
      ),
    );
  }
}
