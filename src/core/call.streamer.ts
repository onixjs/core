import {AppFactory} from './app.factory';
import {AppConstructor, OnixMessage} from '../interfaces';

export class CallStreamer {
  /**
   * @constructor
   * @param factory
   * @param AppClass
   */
  constructor(private factory: AppFactory, private AppClass: AppConstructor) {}
  /**
   * @method register
   * @param operation
   * @description This method will register an incoming call in order
   * to send back an answer.
   */
  register(message: OnixMessage, handler) {
    console.log(
      `Onix callee app ${this.AppClass.name} got remote stream request`,
    );
    console.log(
      `Onix callee app ${this.AppClass.name} registring rpc ${
        message.rpc
      } with call id ${message.uuid}`,
    );
    // Get segments from rpc endpoint
    const segments: string[] = message.rpc.split('.');
    // Component level method, RPC Exposed
    if (segments.length !== 4) {
      return handler(
        new Error(`OnixJS Error: RPC Call is invalid "${message.rpc}"`),
      );
    }
    // Execute main hook, might be app/system or module level.
    this.factory.app.modules[segments[1]][segments[2]][segments[3]](handler);
  }
}
