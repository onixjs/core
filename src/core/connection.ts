import * as WebSocket from 'uws';
import {CallResponser} from './call.responser';
import {ICall, OperationType} from '../index';
import {CallStreamer} from './call.streamer';
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
  constructor(
    private ws: WebSocket,
    private response: CallResponser,
    private stream: CallStreamer,
  ) {
    this.ws.on('message', (data: string) => this.handle(JSON.parse(data)));
  }
  /**
   * @method handle
   * @param data
   * @description This method will handle
   */
  async handle(data: ICall) {
    //  Remote Procedure Stream
    if (data.request.metadata.stream) {
      this.stream.register(data, chunk =>
        this.ws.send(
          JSON.stringify({
            uuid: data.uuid,
            type: OperationType.ONIX_REMOTE_CALL_STREAM,
            message: chunk,
          }),
        ),
      );
    } else {
      // Remote Procedure Call
      const result = await this.response.process(data);
      this.ws.send(
        JSON.stringify({
          uuid: data.uuid,
          type: OperationType.ONIX_REMOTE_CALL_PROCEDURE_RESPONSE,
          message: result,
        }),
      );
    }
  }
}
