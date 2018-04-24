import * as http from 'http';
import * as https from 'https';
import * as WebSocket from 'uws';
import {IAppOperation, IAppDirectory} from '../interfaces';
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
  constructor(server: http.Server | https.Server, private apps: IAppDirectory) {
    new WebSocket.Server({server}).on('connection', (ws: WebSocket) => {
      ws.on('message', (data: string) => this.handle(ws, JSON.parse(data)));
    });
  }
  /**
   * @method handle
   * @param message
   * @description This method will handle
   */
  handle(ws: WebSocket, operation: IAppOperation) {
    // Route Message to the right application
    const callee: string = operation.message.rpc.split('.').shift() || '';
    console.log(
      'Onix server caller: ',
      operation.message.request.metadata.caller,
    );
    console.log('Onix server callee: ', callee);
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
}
