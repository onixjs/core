import * as http from 'http';
import * as https from 'https';
import {
  IAppOperation,
  IAppDirectory,
  WebSocketAdapter,
  OperationType,
} from '../interfaces';
import {ChildProcess} from 'child_process';
import {Utils} from '@onixjs/sdk/dist/utils';
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
    // Listen for WebSocket Requests
    this.websocket.WebSocket(this.server).on('connection', ws => {
      ws.on('message', (data: string) => {
        this.wsHandler(ws, Utils.IsJsonString(data) ? JSON.parse(data) : data);
      });
    });
    // Listen for IO STD Streams from any app
    Object.keys(this.apps).forEach((app: string) => {
      this.apps[app].process.on('message', (operation: IAppOperation) => {
        // Verify the operation is some sort of communication (RPC or Stream)
        if (
          operation.type === OperationType.ONIX_REMOTE_CALL_PROCEDURE ||
          operation.type === OperationType.ONIX_REMOTE_CALL_STREAM
        ) {
          this.ioHandler(this.apps[app].process, operation);
        }
      });
    });
  }
  /**
   * @method wsHandler
   * @param message
   * @description This method will handle web socket requests sending
   * a valid AppOperation.
   */
  wsHandler(ws: WebSocket, operation: IAppOperation) {
    // Route Message to the right application
    const callee: string = operation.message.rpc.split('.').shift() || '';
    if (this.apps[callee]) {
      this.apps[callee].process.on('message', (response: IAppOperation) => {
        if (operation.uuid === response.uuid) {
          // Send application response to websocket client
          ws.send(JSON.stringify(response));
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
    // Route Message to the right application
    const callee: string = operation.message.rpc.split('.').shift() || '';
    if (this.apps[callee]) {
      this.apps[callee].process.on('message', (response: IAppOperation) => {
        if (operation.uuid === response.uuid) {
          // Send application response to websocket client
          process.send(response);
        }
      });
      // Route incoming message to the right application
      // through std io stream
      this.apps[callee].process.send(operation);
    } else {
      throw new Error('Unable to find callee application');
    }
  }
}
