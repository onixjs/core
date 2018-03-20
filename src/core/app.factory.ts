import {
  ReflectionKeys,
  IApp,
  IAppConfig,
  IModuleConfig,
  IComponent,
  OperationType,
  Constructor,
  AppConstructor,
} from '../interfaces';
import {Injector} from '../core';
import {getObjectMethods} from '../utils';
/**
 * @class AppFactory
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This class will construct a given application class into a fully working
 * and operative tree of references.
 */
export class AppFactory {
  /**
   * @property app
   * @description The application reference
   */
  public app: IApp;
  /**
   * @property scopes
   * @description Module level scoped dependency injection
   * directory.
   */
  public scopes: {[key: string]: Injector} = {};
  /**
   * @constructor
   * @param Class
   * @param config
   * @description this construcvtor will call for setupApp and setupModules method.
   * once these processes finish it will emit an event to the parent process to
   * inform this application has been created.
   */
  constructor(private Class: AppConstructor, private config: IAppConfig) {
    // First of all create a new class instance
    if (!this.app) this.app = new this.Class();
    // Now setup its modules
    this.setupModules();
    // Once finished send the schema back
    // TODO: Potentially register to a provider in here
    if (process.send)
      process.send({
        type: OperationType.APP_CREATE_RESPONSE,
        message: this.schema(),
      });
  }
  /**
   * @method setupModules
   * @description This method will iterate over a list of defined modules for this
   * application. It will internally call for methods to setup models, services and
   * components.
   */
  private setupModules() {
    // Iterate list of module classes
    this.config.modules.forEach((Module: Constructor) => {
      // Verify this is not a duplicated module
      if (this.app.modules[Module.name]) return;
      // Create a injection scope for this module
      this.scopes[Module.name] = new Injector();
      // Then create a module instance
      this.app.modules[Module.name] = new Module();
      // Get the module config from the metadata
      const config: IModuleConfig = Reflect.getMetadata(
        ReflectionKeys.MODULE_CONFIG,
        this.app.modules[Module.name],
      );
      // No config... Bad module then
      if (!config) {
        throw new Error(
          `OnixJS: Invalid Module "${
            Module.name
          }", it must provide a module config ({ models: [], services: [], components: [] })`,
        );
      }
      // Setup module components
      if (config && config.components)
        this.setupComponents(config, this.app.modules[Module.name], Module);
    });
  }
  /**
   * @method setupComponents
   * @param config
   * @description This method will setup components for a given module
   * Component methods will be exposed via RPC if these are public.
   *
   * Injected models and services will be recursivelly instantiated.
   * These will be singleton instances, so once instantiated, the same
   * instance will be injected for each component.
   */
  setupComponents(config: IModuleConfig, moduleInstance, Module: Constructor) {
    // Create Components instances
    config.components.forEach((Component: new () => IComponent) => {
      // If component does not exist
      if (!moduleInstance[Component.name]) {
        // Create a new component instance
        moduleInstance[Component.name] = new Component();
        // Then recursively inject models and services within this module
        this.scopes[Module.name].inject(
          Component,
          moduleInstance[Component.name],
          config,
        );
      }
    });
  }
  /**
   * @method schema
   * @description This method will build an app schema that will be exposed
   * and published in a rest endpoint in order to provide enough information
   * for client sdk to connect with this application.
   */
  public schema(): any {
    const copy = JSON.parse(JSON.stringify(this.config));
    // Directory must be an object and not an array, this will
    // allow SDK clients to perform much better.
    copy.modules = {};
    // Iterate modules
    this.config.modules.forEach((Module: Constructor) => {
      // Set reference
      copy.modules[Module.name] = {};
      // Get module metadata
      const config: IModuleConfig = Reflect.getMetadata(
        ReflectionKeys.MODULE_CONFIG,
        this.app.modules[Module.name],
      );
      // Iterate over components to get the RPC references
      config.components.forEach((Component: Constructor) => {
        // Create reference for component methods
        copy.modules[Module.name][Component.name] = {};
        // Create crash-safe component reference
        const component = this.app.modules[Module.name][Component.name] || {};
        // Iterate Methods and verify which ones are RPC enabled
        getObjectMethods(component).forEach((method: string) => {
          const rpcEnabled: IModuleConfig = Reflect.getMetadata(
            ReflectionKeys.RPC_METHOD,
            component,
            method,
          );
          const streamEnabled: IModuleConfig = Reflect.getMetadata(
            ReflectionKeys.STREAM_METHOD,
            component,
            method,
          );
          if (rpcEnabled || streamEnabled)
            copy.modules[Module.name][Component.name][method] = rpcEnabled
              ? 'rpc'
              : 'stream';
        });
      });
    });
    return copy;
  }
}
