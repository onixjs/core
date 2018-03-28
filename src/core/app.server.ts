import 'reflect-metadata';
import {
  OperationType,
  IAppOperation,
  IAppConfig,
  AppConstructor,
  OnixMessage,
} from '../index';
import {AppFactory} from './app.factory';
import {CallResponser} from './call.responser';
import {ClientConnection} from './index';
import {CallStreamer} from './call.streamer';
import {HTTPServer} from './http.server';
import * as WebSocket from 'uws';
import {AppNotifier} from './app.notifier';
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
   * @property websocket
   * @description ws websocket
   */
  private websocket: WebSocket.Server;
  /**
   * @property http
   * @description ws http
   */
  private http: HTTPServer;
  /**
   * @property factory
   * @description Current process factory reference
   */
  private factory: AppFactory;
  /**
   * @property notifier
   * @description The notifier is an event emmiter
   * that will notify events accross an app scope.
   */
  public notifier: AppNotifier = new AppNotifier();
  /**
   * @property streamer
   * @description Current process call streamer reference
   */
  private streamer: CallStreamer;
  /**
   * @property responser
   * @description Current process call responser reference
   */
  private responser: CallResponser;
  /**
   * @constructor
   * @param AppClass
   * @param config
   * @description Gateway constructor, it will listen for
   * parent process events.
   */
  constructor(private AppClass: AppConstructor, private config: IAppConfig) {
    // Setup Node Process
    if (process.on)
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
  public async operation(operation: IAppOperation) {
    // Verify we got a valid operation
    if (process.send && (typeof operation !== 'object' || !operation.type))
      process.send('Onix app: unable to get child operation type');
    // Switch case valid operations
    switch (operation.type) {
      // Event sent from broker when loading a project
      case OperationType.APP_CREATE:
        // Use Host Level configurations, like custom ports
        Object.assign(this.config, operation.message);
        // Create HTTP If enabled
        if (!this.config.disableNetwork) {
          this.http = new HTTPServer(this.config);
        }
        // Setup factory, responser and streamer
        this.factory = new AppFactory(
          this.AppClass,
          this.config,
          this.notifier,
          this.http,
        );
        this.responser = new CallResponser(this.factory, this.AppClass);
        this.streamer = new CallStreamer(this.factory, this.AppClass);
        break;
      // Event sent from the broker when starting a project
      case OperationType.APP_START:
        // Start WebSocket Server
        await Promise.all([
          new Promise((resolve, reject) => {
            // Start up Micra WebSocket Server
            if (!this.config.disableNetwork) {
              // Requires to be started before creating websocket.
              this.http.start();
              // Ok now we can start the websocket
              this.websocket = new WebSocket.Server({
                server: this.http.getNative(),
              });
              // Wait for client connections
              this.websocket.on('connection', (ws: WebSocket) => {
                ws.send(<IAppOperation>{
                  type: OperationType.APP_PING_RESPONSE,
                });
                new ClientConnection(ws, this.responser, this.streamer);
                // Todo will need to register all the UUIDs
                // And pass it to clean listeners.
                this.notifier.emit('notify:new-ws-connection', ws);
                ws.onclose = () => {
                  this.notifier.emit('notify:closed-ws-connection', ws);
                };
              });
            }
            resolve();
          }),
          // Start up application
          this.factory.app.start(),
        ]);
        if (process.send)
          process.send({type: OperationType.APP_START_RESPONSE});
        break;
      // Event sent from the broker when stoping a project
      case OperationType.APP_STOP:
        // If network enabled, turn off the server
        if (!this.config.disableNetwork) {
          this.websocket.close();
        }
        await this.factory.app.stop();
        if (process.send) process.send({type: OperationType.APP_STOP_RESPONSE});
        break;
      // Event sent from caller -> broker -> currentApp
      // These events are done through internal processes.
      // External remote calls will be executed inside the OnixConnection
      case OperationType.ONIX_REMOTE_CALL_PROCEDURE:
        const result = await this.responser.process(
          <OnixMessage>operation.message,
        );
        // Send result back to broker
        if (process.send)
          process.send({
            type: OperationType.ONIX_REMOTE_CALL_PROCEDURE_RESPONSE,
            message: result,
          });
        break;
      // System level event to coordinate every application in the
      // cluster, in order to automatOnixMessagey call between each others
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
            const result: boolean = await this.responser.process(<OnixMessage>{
              uuid: '1',
              rpc: `${name}.isAlive`,
              request: {metadata: {}, payload: {}},
            });
            resolve(result);
          }),
      ),
    );
  }
}
