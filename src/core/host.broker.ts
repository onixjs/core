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
  /**
   * @property uuid
   * @description This uuid will be used as a subscription id since
   * internally this class uses a listener collection for its own
   * events.
   */
  private uuid: string = Utils.uuid();
  /**
   * @property registers
   * @description This directory contains all the references for any
   * subscription coming from clients to the host.
   *
   * Registers will present in most of the cases several listeners
   * for different events.
   *
   * A subscription represents a client subscribed to this onixjs host
   * instance, therefore it will have multiple listeners for different
   * strems. RPC calls immediatly removes its listener
   */
  private registers: {
    [key: string]: ListenerCollection;
  } = {
    [this.uuid]: new ListenerCollection(),
  };
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
      ws.on('message', (data: string) => {
        // Verify if request is a ping timestamp
        if (!isNaN(parseInt(data))) {
          ws.send(data);
          // Else handle as an application operation
        } else {
          this.wsHandler(
            ws,
            Utils.IsJsonString(data) ? JSON.parse(data) : data,
          );
        }
      });
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
        this.registers[this.uuid]
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
          Object.keys(this.registers).forEach(index =>
            this.registers[index].namespace(app).broadcast(data),
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
    if (
      // Verify the calle app actually exists
      this.apps[callee] &&
      // Verify the client is actually registered in this onixjs host
      this.registers[operation.message.request.metadata.register] &&
      // Also make sure this is a RPC or STREAM Unsubscription calls
      (OperationType.ONIX_REMOTE_CALL_PROCEDURE ||
        OperationType.ONIX_REMOTE_CALL_STREAM_UNSUBSCRIBE)
    ) {
      // Add a new listener for this client subscription stream
      const index: number = this.registers[
        operation.message.request.metadata.register
      ]
        .namespace(callee)
        .add((response: IAppOperation) => {
          if (operation.uuid === response.uuid) {
            // Send application response to websocket client
            ws.send(JSON.stringify(response));
            // If this is a RPC or Stream Unsubscription Call
            // Then immediatly remove the listener
            if (!operation.message.request.metadata.stream) {
              this.registers[operation.message.request.metadata.register]
                .namespace(callee)
                .remove(index);
            }
            // If this was a stream unsubscription call, then remove
            // the internal stream subscription listener.
            if (
              operation.type ===
              OperationType.ONIX_REMOTE_CALL_STREAM_UNSUBSCRIBE
            ) {
              // First of all remove the listener
              this.registers[operation.message.request.metadata.register]
                .namespace(callee)
                .remove(operation.message.request.metadata.listener);
            }
          }
        });
      // Route incoming message to the right application
      // through std io stream
      this.apps[callee].process.send(operation);
      // Also notify the client we just successfully subscribed
      // A stream, so they are able to unsubscribe later
      if (operation.message.request.metadata.stream) {
        const response: IAppOperation = {...operation};
        response.type = OperationType.ONIX_REMOTE_CALL_STREAM_SUBSCRIBED;
        response.message.request.metadata.listener = index;
        response.message.request.payload = {};
        ws.send(JSON.stringify(response));
      }
    } else {
      console.log('Warning: Unable to find callee application or subscription');
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
      if (!this.registers[operation.message.request.metadata.register]) {
        operation.message.request.payload = {
          code: 404,
          message:
            'Unable to find subscription for this call, try passing incoming metadata.',
        };
        return process.send(operation);
      }
      const index: number = this.registers[
        operation.message.request.metadata.register
      ]
        .namespace(callee)
        .add((response: IAppOperation) => {
          if (operation.uuid === response.uuid) {
            // Send application response to websocket client
            process.send(response);
            // If RPC Call remove the listener
            if (!operation.message.request.metadata.stream) {
              this.registers[operation.message.request.metadata.register]
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
   * @method register
   * @param operation
   * @param callback
   * @description This method will register a client, it
   * will use the UUID generated for this operation, therefore this initial
   * registration will use the operation.uuid.
   */
  private register(
    operation: IAppOperation,
    callback: (response: IAppOperation) => void,
  ): string {
    const uuid: string = operation.uuid;
    this.registers[uuid] = new ListenerCollection();
    operation.type = OperationType.ONIX_REMOTE_REGISTER_CLIENT_RESPONSE;
    callback(operation);
    return uuid;
  }

  private async close(ws: WebSocket) {
    if (this.registers[ws['onix.uuid']]) {
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
              register: ws['onix.uuid'],
            },
            payload: {},
          },
        },
      };
      // Send a client closing signal
      await Promise.all(
        this.registers[ws['onix.uuid']].namespaces().map(
          (app: string) =>
            new Promise((resolve, reject) => {
              const index: number = this.registers[ws['onix.uuid']]
                .namespace(app)
                .add((response: IAppOperation) => {
                  if (
                    response.uuid === operation.uuid &&
                    response.type ===
                      OperationType.ONIX_REMOTE_UNREGISTER_CLIENT_RESPONSE
                  ) {
                    this.registers[ws['onix.uuid']].remove(index);
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
      delete this.registers[ws['onix.uuid']];
    }
    console.log('A Client has been disconnected');
  }
}
