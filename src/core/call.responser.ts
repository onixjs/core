import {ReflectionKeys, IAppOperation, IComponentConfig} from '../interfaces';
import {AppFactory, LifeCycle} from '../core';
import {GroupMatch} from './acl.group.match';
//import { RoleMatch } from './roles';
/**
 * @class CallResponse
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This class coordinates rpc calls between the broker
 * and the current application in order to send an answer back.
 */
export class CallResponser {
  /**
   * @property lifecycle
   * @description Default lifecycle, this can be override at
   * app level, module level or even at component level.
   */
  private lifecycle: LifeCycle = new LifeCycle();
  /**
   * @constructor
   * @param factory
   * @param AppClass
   */
  constructor(private factory: AppFactory) {}
  /**
   * @method process
   * @param operation
   * @description This method will process an incoming call in order
   * to send back an answer.
   */
  async process(operation: IAppOperation): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      // Get segments from rpc endpoint
      const segments: string[] = operation.message.rpc.split('.');
      // If segments are less than 2 or more than 4,
      // then this is an invalid call
      if (segments.length < 2 || segments.length > 4) {
        reject(
          new Error(
            `OnixJS Error: RPC Call is invalid "${operation.message.rpc}"`,
          ),
        );
        return;
      }
      // Declare executable endpoint method and hooks references
      let scope,
        systemcall: boolean = false,
        method: Function | null = null,
        mainHook: Function = () => null,
        slaveHook: Function | null = null,
        config: IComponentConfig = {};
      // If segments are exactly 2, then it is an application level call
      // Only god can remotly execute this type of calls.
      if (segments.length === 2) {
        scope = this.factory.app;
        method = this.factory.app[segments[1]];
        mainHook = this.lifecycle.onAppMethodCall;
        systemcall = true;
      }
      // Module level call (System only, not exposed)
      if (segments.length > 2) {
        scope = this.factory.app.modules[segments[1]];
        method = this.factory.app.modules[segments[1]][segments[2]];
        const moduleConfig = Reflect.getMetadata(
          ReflectionKeys.MODULE_CONFIG,
          scope,
        );
        mainHook = moduleConfig.lifecycle
          ? moduleConfig.lifecycle
          : this.lifecycle.onModuleMethodCall;
      }
      // Component level method, RPC Exposed
      if (segments.length === 4) {
        scope = this.factory.app.modules[segments[1]][segments[2]];
        method = this.factory.app.modules[segments[1]][segments[2]][
          segments[3]
        ];
        if (scope && method) {
          config = Reflect.getMetadata(ReflectionKeys.COMPONENT_CONFIG, scope);
          slaveHook = config.lifecycle
            ? config.lifecycle
            : this.lifecycle.onComponentMethodCall;
        }
      }
      // Hey wait, but if the method doesn't exist?
      if (!method) {
        reject(
          new Error(
            `OnixJS Error: RPC Call is invalid "${operation.message.rpc}"`,
          ),
        );
        return;
      }
      // Verify the call request matches the ACL Rules
      if (
        (await GroupMatch.verify(method.name, operation, config)) ||
        systemcall
      ) {
        // Execute main hook, might be app/system or module level.
        const result = await mainHook(
          (name: string) => this.factory.scopes[segments[1]].get(name),
          operation.message,
          async (): Promise<any> => {
            // If there is a custom component level hook for this call
            // then execute it first.
            if (slaveHook) {
              // Do whatever the developer defined in component config
              return await slaveHook(
                (name: string) => this.factory.scopes[segments[1]].get(name),
                operation.message,
                async (): Promise<any> => {
                  // Ok cool, let me finish. lol (freaking genius)
                  return method
                    ? await method.call(
                        scope,
                        operation.message.request.payload,
                      )
                    : null;
                },
              );
            } else {
              // Else just call the requested method now.
              return method
                ? await method.call(scope, operation.message.request.payload)
                : null;
            }
          },
        );
        // Resolve promise
        resolve(result);
      } else {
        // No access for this method
        resolve({
          code: 401,
          message: "You don't have access to execute this method",
        });
      }
    });
  }
}
