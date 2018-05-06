import {AppFactory} from './app.factory';
import {IAppOperation, IComponentConfig, IModuleConfig} from '../interfaces';
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
    // Declare executable endpoint method and hooks references
    let // Declare Operation Scope
      scope,
      // Declare Current Module Default Config
      moduleConfig: IModuleConfig = {
        components: [],
        models: [],
        services: [],
        renderers: [],
      },
      // Define reference for the method to be executed
      method: Function | null = null,
      // Define a main hook, it refers to a module level hook
      mainHook: Function = () => null,
      // Define a slave hook, it refers to a component level hook
      slaveHook: Function | null = null,
      // Declare a reference for the executing component config
      componentConfig: IComponentConfig = {};

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
      moduleConfig = Reflect.getMetadata(ReflectionKeys.MODULE_CONFIG, scope);
      mainHook = moduleConfig.lifecycle
        ? moduleConfig.lifecycle
        : this.lifecycle.onModuleMethodStream;
    }
    // Component level method, RPC Exposed
    if (segments.length === 4) {
      scope = this.factory.app.modules[segments[1]][segments[2]];
      method = this.factory.app.modules[segments[1]][segments[2]][segments[3]];
      if (scope && method) {
        componentConfig = Reflect.getMetadata(
          ReflectionKeys.COMPONENT_CONFIG,
          scope,
        );
        slaveHook = componentConfig.lifecycle
          ? componentConfig.lifecycle
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
    if (
      await GroupMatch.verify(
        method.name,
        operation,
        moduleConfig,
        componentConfig,
        this.factory.scopes[segments[1]],
      )
    ) {
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
                      operation.message.request.metadata,
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
                  operation.message.request.metadata,
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
