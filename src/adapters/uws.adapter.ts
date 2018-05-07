import * as DepWebSocket from 'uws';
import * as http from 'http';
import * as https from 'https';
import {WebSocketAdapter} from '../interfaces';
/**
 * @class UWSAdapter
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This adapter will use the uws dependency
 */
export class UWSAdapter implements WebSocketAdapter {
  WebSocket(server: http.Server | https.Server): DepWebSocket.Server {
    return new DepWebSocket.Server({server});
  }
}
