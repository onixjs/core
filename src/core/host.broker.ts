import * as http from 'http';
import * as https from 'https';
import {IAppDirectory, WebSocketAdapter} from '../interfaces';
import {ChildProcess} from 'child_process';
import {Utils} from '@onixjs/sdk/dist/utils';
import {ListenerCollection, IAppOperation, OperationType} from '@onixjs/sdk';
/**
 * @class HostBroker
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This class will provide websocket functionality to
 * clients directly connecting to the HOST instead of each Service.
 * This will work as a gateway, so clients are able to connect to 1
 * server instead of multiple servers.
 */
export class HostBroker {
  private uuid: string = Utils.uuid();

  private subscriptions: {
    [key: string]: ListenerCollection;
  } = {
    [this.uuid]: new ListenerCollection(),
  };
  /**
   * @prop listeners
   * @description Instance of ListenerCollection which provides
   * features to easily handle event listeners.
   */
  //private listeners: ListenerCollection = new ListenerCollection();
  /**
   * @constructor
   * @author Jonathan Casarrubias
   * @param server
   * @param apps
   * @description The constructor will create a new websocket server from the
   * incoming http server created within the OnixJS Host.
   */
  constructor(
    private server: http.Server | https.Server,
    private websocket: WebSocketAdapter,
    private apps: IAppDirectory,
  ) {
    // Create WebSocket Server
    const wss = this.websocket.WebSocket(this.server);
    // Listen for WebSocket Requests
    wss.on('connection', ws => {
      // Register a message event listener
      ws.on('message', (data: string) =>
        this.wsHandler(ws, Utils.IsJsonString(data) ? JSON.parse(data) : data),
      );
      // Add On Close Listener
      ws.onclose = async () => await this.close(ws);
      // Add On Error Listener
      ws.onerror = async () => await this.close(ws);
      // Add Pong Listener
      ws.on('pong', () => (ws.isAlive = true));
    });
    // Listen for IO STD Streams from any app
    Object.keys(this.apps).forEach((app: string) => {
      if (this.apps[app]) {
        // Add Coordination Listener
        this.subscriptions[this.uuid]
          .namespace(app)
          .add((operation: IAppOperation) => {
            // Verify the operation is some sort of communication (RPC or Stream)
            if (
              operation.type === OperationType.ONIX_REMOTE_CALL_PROCEDURE ||
              operation.type === OperationType.ONIX_REMOTE_CALL_STREAM ||
              operation.type ===
                OperationType.ONIX_REMOTE_CALL_STREAM_UNSUBSCRIBE
            ) {
              this.ioHandler(this.apps[app].process, operation);
            }
          });
        // The only event emitter  for this app.
        // Will broadcast to all listeners registered under
        // the same namespace.
        this.apps[app].process.on('message', data =>
          Object.keys(this.subscriptions).forEach(index =>
            this.subscriptions[index].namespace(app).broadcast(data),
          ),
        );
      }
    });
    // Setup Ping Pong Events
    setInterval(() => {
      wss.clients.forEach(ws => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping(() => {});
      });
    }, 3000);
  }
  /**
   * @method wsHandler
   * @param message
   * @description This method will handle web socket requests sending
   * a valid AppOperation.
   */
  wsHandler(ws: WebSocket, operation: IAppOperation) {
    // Add a handler for client registrations
    if (operation.type === OperationType.ONIX_REMOTE_REGISTER_CLIENT) {
      return (ws['onix.uuid'] = this.register(operation, response =>
        ws.send(JSON.stringify(operation)),
      ));
    }
    // Route Message to the right application
    const callee: string = operation.message.rpc.split('.').shift() || '';
    if (this.apps[callee]) {
      const index: number = this.subscriptions[
        operation.message.request.metadata.subscription
      ]
        .namespace(callee)
        .add((response: IAppOperation) => {
          if (operation.uuid === response.uuid) {
            // Send application response to websocket client
            ws.send(JSON.stringify(response));
            // If RPC Call remove the listener
            if (!operation.message.request.metadata.stream) {
              this.subscriptions[
                operation.message.request.metadata.subscription
              ]
                .namespace(callee)
                .remove(index);
            }
          }
        });
      // Route incoming message to the right application
      // through std io stream
      this.apps[callee].process.send(operation);
    } else {
      throw new Error('Unable to find callee application');
    }
  }
  /**
   * @method ioHandler
   * @param message
   * @description This method will handle web socket requests sending
   * a valid AppOperation.
   */
  ioHandler(process: ChildProcess, operation: IAppOperation) {
    // Add a handler for client registrations
    if (operation.type === OperationType.ONIX_REMOTE_REGISTER_CLIENT) {
      return this.register(operation, response => process.send(operation));
    }
    // Route Message to the right application
    const callee: string = operation.message.rpc.split('.').shift() || '';
    if (this.apps[callee]) {
      // If not validating a valid subscription
      if (
        !this.subscriptions[operation.message.request.metadata.subscription]
      ) {
        operation.message.request.payload = {
          code: 404,
          message:
            'Unable to find subscription for this call, try passing incoming metadata.',
        };
        return process.send(operation);
      }
      const index: number = this.subscriptions[
        operation.message.request.metadata.subscription
      ]
        .namespace(callee)
        .add((response: IAppOperation) => {
          if (operation.uuid === response.uuid) {
            // Send application response to websocket client
            process.send(response);
            // If RPC Call remove the listener
            if (!operation.message.request.metadata.stream) {
              this.subscriptions[
                operation.message.request.metadata.subscription
              ]
                .namespace(callee)
                .remove(index);
            }
          }
        });
      // Route incoming message to the right application
      // through std io stream
      this.apps[callee].process.send(operation);
    } else {
      throw new Error('Unable to find callee application');
    }
  }

  private register(
    operation: IAppOperation,
    callback: (response: IAppOperation) => void,
  ): string {
    const uuid: string = operation.uuid;
    this.subscriptions[uuid] = new ListenerCollection();
    operation.type = OperationType.ONIX_REMOTE_REGISTER_CLIENT_RESPONSE;
    callback(operation);
    return uuid;
  }

  private async close(ws: WebSocket) {
    // Notify Components that this client subscription
    // Has been terminated, therefore listeners needs to be removed.
    // Create Unregistration operation to signal apps for cleaning up.
    const operation: IAppOperation = {
      uuid: Utils.uuid(),
      type: OperationType.ONIX_REMOTE_UNREGISTER_CLIENT,
      message: {
        rpc: 'unsubscribe',
        request: {
          metadata: {
            stream: false,
            subscription: ws['onix.uuid'],
          },
          payload: {},
        },
      },
    };
    // Send a client closing signal
    await Promise.all(
      this.subscriptions[ws['onix.uuid']].namespaces().map(
        (app: string) =>
          new Promise((resolve, reject) => {
            const index: number = this.subscriptions[ws['onix.uuid']]
              .namespace(app)
              .add((response: IAppOperation) => {
                if (
                  response.uuid === operation.uuid &&
                  response.type ===
                    OperationType.ONIX_REMOTE_UNREGISTER_CLIENT_RESPONSE
                ) {
                  this.subscriptions[ws['onix.uuid']].remove(index);
                  resolve();
                }
              });
            // Send close signal
            if (this.apps[app] && this.apps[app].process)
              this.apps[app].process.send(operation);
          }),
      ),
    );
    // Everything is cool now, remove any reference
    // For this subscription
    delete this.subscriptions[ws['onix.uuid']];
    console.log('A Client has been disconnected');
  }
}
