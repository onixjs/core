import {IAppOperation, IApp, OperationType, IRequest} from '../index';
/**
 * @class OnixRPC
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This class provides RPC features for calling
 * remote procedures for the given topic.
 */
export class OnixRPC {
  /**
   * @property _topic
   * @description A concatenated string containing information
   * about the Application, Module, Component and Method to
   * execute.
   */
  private _topic: string;
  /**
   * @constructor
   * @param Class
   * @description Receives a constructable class that returns
   * a valid IApp object.
   */
  constructor(private Class: new (rpc: OnixRPC) => IApp) {}
  /**
   * @method topic
   * @param topic
   * @returns OnixRPC
   * @description This method is a setter for the next topic call.
   */
  topic(topic: string): OnixRPC {
    this._topic = topic;
    return this;
  }
  /**
   * @method call
   * @param request
   * @returns Promise
   * @description It executes a RPC Call, it can be either through
   * native OS IO events or through gRPC for remote calls.
   */
  async call(request: IRequest = {}): Promise<any> {
    console.log(
      `Onix app ${this.Class.name} making call on topic: ${this._topic}`,
    );
    return new Promise((resolve, reject) => {
      process.on('message', (operation: IAppOperation) => {
        if (
          operation.type === OperationType.ONIX_REMOTE_CALL_PROCEDURE_RESPONSE
        ) {
          console.log(
            `Onix app ${this.Class.name} got call response from server`,
          );
          resolve(operation.message);
        }
      });
      if (process.send) {
        process.send({
          type: OperationType.ONIX_REMOTE_CALL_PROCEDURE,
          message: {
            rpc: this._topic,
            request,
          },
        });
      }
    });
  }
}
