import * as WebSocket from 'uws';
import {CallAnswerer} from './call.answerer';
import {ICall, OperationType} from '../index';
/**
 * @class ClientConnection
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This class will handle client connections it will
 * call for RPC methods
 */
export class ClientConnection {
  /**
   * @constructor
   * @description It listen for messages from the current connection
   * client.
   */
  constructor(private ws: WebSocket, private answerer: CallAnswerer) {
    this.ws.on('message', (data: string) => this.handle(JSON.parse(data)));
  }
  /**
   * @method handle
   * @param data
   * @description This method will handle
   */
  async handle(data: ICall): Promise<any> {
    const result = await this.answerer.process(data);
    this.ws.send(
      JSON.stringify({
        uuid: data.uuid,
        type: OperationType.ONIX_REMOTE_CALL_PROCEDURE_RESPONSE,
        message: result,
      }),
    );
    return result;
  }
}
