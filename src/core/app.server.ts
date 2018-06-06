import 'reflect-metadata';
import {IAppConfig, AppConstructor} from '../index';
import {AppFactory} from './app.factory';
import {CallResponser} from './call.responser';
import {CallStreamer} from './call.streamer';
import {AppNotifier} from './app.notifier';
import * as Router from 'router';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as finalhandler from 'finalhandler';
import {IAppOperation, OperationType} from '@onixjs/sdk';
import {NotifyEvents} from './notify.events';
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
   * @property http
   * @description ws http
   */
  private http: http.Server | https.Server;
  /**
   * @property router
   * @description Application level router, will provider
   * middleware implementation for cross-compatibility.
   */
  public router: Router = new Router();
  /**
   * @property startedAt
   * @description Will persist in memory the date time
   * when this class was initialized, so we provide that
   * on the built-in status route.
   */
  public startedAt: number = Date.now();
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
    if (process.on) {
      // Listener for parent messages
      process.on('message', (operation: IAppOperation) =>
        this.operation(operation),
      );
      // Listener for closing process
      process.on('exit', () =>
        this.operation(<IAppOperation>{
          uuid: 'root',
          type: OperationType.APP_STOP,
        }),
      );
    }
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
        Object.assign(this.config, operation.message.request.payload);
        // Create HTTP (If enabled)
        if (
          !this.config.network ||
          (this.config.network && !this.config.network!.disabled)
        ) {
          this.http = this.setupHTTP();
        }
        // Setup factory
        this.factory = new AppFactory(this.AppClass);
        this.factory.config = this.config;
        this.factory.router = this.router;
        this.factory.notifier = this.notifier;
        const schema: any = await this.factory.setup();
        // Setup responser and streamer
        this.responser = new CallResponser(this.factory);
        this.streamer = new CallStreamer(this.factory);
        try {
          // Return IO Stream Message
          if (process.send) {
            process.send({
              uuid: operation.uuid,
              type: OperationType.APP_CREATE_RESPONSE,
              message: {
                request: {
                  payload: schema,
                },
              },
            });
          }
        } catch (e) {
          console.log(
            'ONIXJS: HostBroker is not available, this process is going down.',
          );
          process.kill(1);
        }
        break;
      // Event sent from the broker when starting a project
      case OperationType.APP_START:
        // Start WebSocket Server
        if (
          !this.config.network ||
          (this.config.network && !this.config.network!.disabled)
        ) {
          // Requires to be started before creating websocket.
          this.http.listen(this.config.port || 6000);
        }
        // Start up application
        await this.factory.app.start();
        // Send back result
        if (process.send)
          process.send({type: OperationType.APP_START_RESPONSE});
        break;
      // Event sent from the broker when a client has been disconnected
      case OperationType.ONIX_REMOTE_UNREGISTER_CLIENT:
        this.notifier.emit(
          NotifyEvents.CLIENT_CLOSED,
          operation.message.request.metadata.subscription,
        );
        // Send back result
        if (process.send)
          process.send({
            uuid: operation.uuid,
            type: OperationType.ONIX_REMOTE_UNREGISTER_CLIENT_RESPONSE,
          });
        break;
      // Event sent from the broker when a client has been disconnected
      case OperationType.ONIX_REMOTE_CALL_STREAM_UNSUBSCRIBE:
        this.notifier.emit(
          NotifyEvents.CLIENT_UNSUBSCRIBED,
          operation.message.request.payload.uuid,
        );
        // Send back result
        if (process.send)
          process.send({
            uuid: operation.uuid,
            type: OperationType.ONIX_REMOTE_CALL_STREAM_UNSUBSCRIBE_RESPONSE,
          });
        break;
      // Event sent from the broker when stoping a project
      case OperationType.APP_STOP:
        // If network enabled, turn off the server
        if (
          !this.config.network ||
          (this.config.network && !this.config.network!.disabled)
        ) {
          this.http.close();
          //this.websocket.close(); DREPREATED
        }
        await this.factory.app.stop();
        if (process.send) process.send({type: OperationType.APP_STOP_RESPONSE});
        break;
      // Event sent from caller -> broker -> currentApp
      // These events are done through internal processes.
      // Call procedure might directly call an RPC or register a STREAM
      case OperationType.ONIX_REMOTE_CALL_PROCEDURE:
        // Register Stream Request
        if (operation.message.request.metadata.stream) {
          await this.streamer.register(operation, chunk => {
            if (process.send)
              process.send({
                uuid: operation.uuid,
                type: OperationType.ONIX_REMOTE_CALL_STREAM,
                message: {
                  rpc: operation.message.rpc,
                  request: {
                    metadata: operation.message.request.metadata,
                    payload: chunk,
                  },
                },
              });
          });
          // Else just process the request
        } else {
          const result = await this.responser.process(operation);
          // Send result back to broker
          if (process.send)
            process.send(<IAppOperation>{
              uuid: operation.uuid,
              type: OperationType.ONIX_REMOTE_CALL_PROCEDURE_RESPONSE,
              message: {
                rpc: operation.message.rpc,
                request: {
                  metadata: operation.message.request.metadata,
                  payload: result,
                },
              },
            });
        }
        break;
      // System level event to coordinate every application in the
      // cluster, in order to automatOnixMessagey call between each others
      case OperationType.APP_GREET:
        const results: boolean[] = await this.greet(operation);
        if (process.send)
          process.send({
            uuid: operation.uuid,
            type: OperationType.APP_GREET_RESPONSE,
            message: {
              request: {
                payload: results,
              },
            },
          });
        break;
      // Sytem level event
      case OperationType.APP_PING:
        if (process.send)
          process.send({
            uuid: operation.uuid,
            type: OperationType.APP_PING_RESPONSE,
            message: {
              request: {
                payload: this.config,
              },
            },
          });
        break;
    }
  }
  /**
   * @method setupHTTP
   * @description This method will initialize an HTTP Server
   * and assign some built-in routes.
   */
  setupHTTP(): http.Server | https.Server {
    // Define Service Uptime Endpoint
    this.router.get(
      '/.uptime',
      (req: http.IncomingMessage, res: http.ServerResponse) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({uptime: Date.now() - this.startedAt}));
      },
    );
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

  listener(req: http.IncomingMessage, res: http.ServerResponse) {
    // Here you might need to do something dude...
    this.router(req, res, finalhandler(req, res));
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
  private async greet(operation: IAppOperation): Promise<boolean[]> {
    let apps: string[] = operation.message.request.payload;
    apps = apps.filter((name: string) => this.AppClass.name !== name);
    return Promise.all(
      apps.map(
        (name: string) =>
          new Promise<boolean>(async (resolve, reject) => {
            const result: boolean = await this.responser.process(<
              IAppOperation
            >{
              uuid: operation.uuid,
              type: OperationType.APP_GREET_RESPONSE,
              message: {
                rpc: `${name}.isAlive`,
                request: {metadata: {}, payload: {}},
              },
            });
            resolve(result);
          }),
      ),
    );
  }
}
