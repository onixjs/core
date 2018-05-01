import {AppFactory} from './app.factory';
import {IAppOperation, IComponentConfig} from '../interfaces';
import {LifeCycle} from '.';
import {ReflectionKeys} from '..';
import {GroupMatch} from './acl.group.match';

export class CallStreamer {
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
   * @method register
   * @param operation
   * @description This method will register an incoming call in order
   * to send back an answer.
   */
  async register(operation: IAppOperation, handler) {
    // Get segments from rpc endpoint
    let scope,
      method: Function | null = null,
      mainHook: Function = () => null,
      slaveHook: Function | null = null,
      config: IComponentConfig = {};

    const segments: string[] = operation.message.rpc.split('.');
    // Component level method, RPC Exposed
    if (segments.length !== 4) {
      return handler(
        new Error(
          `OnixJS Error: RPC Call is invalid "${operation.message.rpc}"`,
        ),
      );
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
        : this.lifecycle.onModuleMethodStream;
    }
    // Component level method, RPC Exposed
    if (segments.length === 4) {
      scope = this.factory.app.modules[segments[1]][segments[2]];
      method = this.factory.app.modules[segments[1]][segments[2]][segments[3]];
      if (scope && method) {
        config = Reflect.getMetadata(ReflectionKeys.COMPONENT_CONFIG, scope);
        slaveHook = config.lifecycle
          ? config.lifecycle
          : this.lifecycle.onComponentMethodStream;
      }
    }
    // Hey wait, but if the method doesn't exist?
    if (!method) {
      return handler(
        new Error(
          `OnixJS Error: RPC Call is invalid "${operation.message.rpc}"`,
        ),
      );
    }

    // Verify the call request matches the ACL Rules
    if (await GroupMatch.verify(method.name, operation, config)) {
      // Default handler
      const def = data => data;
      // Execute main hook, might be app/system or module level.
      mainHook(
        (name: string) => this.factory.scopes[segments[1]].get(name),
        operation.message,
        masterSubHandler => {
          masterSubHandler = masterSubHandler || def;
          // If there is a custom component level hook for this call
          // then execute it first.
          if (slaveHook) {
            // Do whatever the developer defined in component config
            slaveHook(
              (name: string) => this.factory.scopes[segments[1]].get(name),
              operation.message,
              slaveSubHandler => {
                // No slave subhandler?
                slaveSubHandler = slaveSubHandler || def;
                // Ok cool, let me finish. lol (freaking genius)
                method
                  ? method.call(
                      scope,
                      data => handler(slaveSubHandler(masterSubHandler(data))),
                      operation.message.request.payload,
                    )
                  : null;
              },
            );
          } else {
            // Else just call the requested method now.
            method
              ? method.call(
                  scope,
                  data => handler(masterSubHandler(data)),
                  operation.message.request.payload,
                )
              : null;
          }
        },
      );
    } else {
      // No access for this method
      handler({
        code: 401,
        message: "You don't have access to execute this method",
      });
    }
  }
}
