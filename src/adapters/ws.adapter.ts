import * as DepWebSocket from 'ws';
import * as http from 'http';
import * as https from 'https';
import {WebSocketAdapter} from '../interfaces';
/**
 * @class WSAdapter
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This adapter will use the ws dependency
 */
export class WSAdapter implements WebSocketAdapter {
  WebSocket(server: http.Server | https.Server): DepWebSocket.Server {
    return new DepWebSocket.Server({server});
  }
}
