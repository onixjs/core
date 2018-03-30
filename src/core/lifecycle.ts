import {IApp} from '../index';
import {OnixMessage} from '../interfaces';
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
    app: IApp,
    message: OnixMessage,
    method: () => Promise<any>,
  ): Promise<any> {
    console.log('Before App Method Call');
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
    app: IApp,
    message: OnixMessage,
    method: () => Promise<any>,
  ): Promise<any> {
    console.log('Before Module Method Call');
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
    app: IApp,
    message: OnixMessage,
    method: () => Promise<any>,
  ): Promise<any> {
    console.log('Before Component Method Call');
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
    app: IApp,
    message: OnixMessage,
    stream: (handler: (data) => any) => any,
  ): Promise<any> {
    console.log('Before Module Method Stream');
    // Before Method Stream (Do something with request)
    stream(data => {
      console.log('After Module Method Stream', data);
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
    app: IApp,
    message: OnixMessage,
    stream: (handler: (data) => any) => any,
  ): Promise<any> {
    console.log('Before Component Method Stream');
    // Before Method Stream (Do something with request)
    stream(data => {
      // Afet method stream
      console.log('After Component Method Stream', data);
      return data;
    });
  }
}
