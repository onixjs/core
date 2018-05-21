import {OnixMethod, ModelProvider} from '../index';
import {OnixMessage} from '@onixjs/sdk';
/**
 * @class LifeCycle
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This class is the default life cycle for each
 * controller method call.
 */
export class LifeCycle {
  /**
   * @method onAppMethodCall
   * @param {Application} app
   * @param method
   * @description This method is executed on each public
   * Application method.
   *
   * Unless a custom LifeCycle class is provided for this
   * Application.
   */
  async onAppMethodCall(
    models: ModelProvider,
    message: OnixMessage,
    method: OnixMethod,
  ): Promise<any> {
    // Before Method Call
    const result: any = await method();
    // After Method Call
    return result;
  }
  /**
   * @method onModuleMethodCall
   * @param {Application} app
   * @param method
   * @description This method is executed on each public
   * Module method.
   *
   * Unless a custom LifeCycle class is provided for this
   * Application.
   */
  async onModuleMethodCall(
    models: ModelProvider,
    message: OnixMessage,
    method: OnixMethod,
  ): Promise<any> {
    // Before Method Call
    const result: any = await method();
    // After Method Call
    return result;
  }
  /**
   * @method onComponentMethodCall
   * @param {Application} app
   * @param method
   * @description This method is executed on each public
   * Module method.
   *
   * Unless a custom LifeCycle class is provided for this
   * Application.
   */
  async onComponentMethodCall(
    models: ModelProvider,
    message: OnixMessage,
    method: OnixMethod,
  ): Promise<any> {
    // Before Method Call
    const result: any = await method();
    // After Method Call
    return result;
  }
  /**
   * @method onModuleMethodStream
   * @param {Application} app
   * @param method
   * @description This method is executed on each public
   * Module method.
   *
   * Unless a custom LifeCycle class is provided for this
   * Application.
   */
  async onModuleMethodStream(
    models: ModelProvider,
    message: OnixMessage,
    stream: (handler: (data) => any) => any,
  ): Promise<any> {
    // Before Method Stream (Do something with request)
    stream(data => {
      // Afet method stream
      return data;
    });
  }
  /**
   * @method onComponentMethodCall
   * @param {Application} app
   * @param method
   * @description This method is executed on each public
   * Module method.
   *
   * Unless a custom LifeCycle class is provided for this
   * Application.
   */
  async onComponentMethodStream(
    models: ModelProvider,
    message: OnixMessage,
    stream: (handler: (data) => any) => any,
  ): Promise<any> {
    // Before Method Stream (Do something with request)
    stream(data => {
      // Afet method stream
      return data;
    });
  }
}
