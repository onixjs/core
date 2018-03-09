import {
  ReflectionKeys,
  IApp,
  IAppConfig,
  IModuleConfig,
  IDataSource,
  IComponent,
  OperationType,
  Constructor,
  AppConstructor,
} from '../interfaces';
import {OnixRPC, Injector} from '../core';
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
   * @constructor
   * @param Class
   * @param config
   * @description this construcvtor will call for setupApp and setupModules method.
   * once these processes finish it will emit an event to the parent process to
   * inform this application has been created.
   */
  constructor(private Class: AppConstructor, private config: IAppConfig) {
    this.setupApp();
    this.setupModules();
    if (process.send)
      process.send({
        type: OperationType.APP_CREATE_RESPONSE,
        message: this.schema(),
      });
  }
  /**
   * @method schema
   * @description This method will build an app schema that will be exposed
   * and published in a rest endpoint in order to provide enough information
   * for client sdk to connect with this application.
   */
  private schema(): any {
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
        this.app[Module.name],
      );
      // Iterate over components to get the RPC references
      config.components.forEach((Component: Constructor) => {
        // Create reference for component methods
        copy.modules[Module.name][Component.name] = {};
        // Iterate Methods and verify which ones are RPC enabled
        Object.getOwnPropertyNames(Component.prototype).forEach(
          (method: string) => {
            const rpcEnabled: IModuleConfig = Reflect.getMetadata(
              ReflectionKeys.RPC_METHOD,
              this.app[Module.name][Component.name],
              method,
            );
            const streamEnabled: IModuleConfig = Reflect.getMetadata(
              ReflectionKeys.STREAM_METHOD,
              this.app[Module.name][Component.name],
              method,
            );
            if (rpcEnabled || streamEnabled)
              copy.modules[Module.name][Component.name][method] = rpcEnabled
                ? 'rpc'
                : 'stream';
          },
        );
      });
    });
    return copy;
  }
  /**
   * @method setupApp
   * @description This method simply creates a new class instance.
   */
  private setupApp(): void {
    if (!this.app) this.app = new this.Class(new OnixRPC(this.Class));
    if (!this.app.start || !this.app.stop)
      throw new Error(
        `OnixJS: Invalid App "${
          this.Class.name
        }", it must extend from Application (import {Application} from '@onixjs/core')`,
      );
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
      if (this.app[Module.name]) return;
      console.log('SETTING UP MODULE', Module.name);
      // Create a module instance
      this.app[Module.name] = new Module();
      // Get module config from metadata
      const config: IModuleConfig = Reflect.getMetadata(
        ReflectionKeys.MODULE_CONFIG,
        this.app[Module.name],
      );
      if (!config)
        throw new Error(
          `OnixJS: Invalid Module "${
            Module.name
          }", it must provide a module config ({ models: [], services: [], components: [] })`,
        );
      // Models are stored within the Injector
      if (config.models)
        this.setupModels(config, this.app[Module.name], Module);
      // Services are stored within the Injector
      if (config.services)
        this.setupServices(config, this.app[Module.name], Module);
      // Components are stored within the Module Metadata
      if (config.components)
        this.setupComponents(config, this.app[Module.name], Module);
    });
  }
  /**
   * @method setupModels
   * @param config
   * @description This method will setup models for a given module
   * Models are specific to modules and won't be directly exposed
   * from other modules.
   */
  setupModels(config: IModuleConfig, moduleInstance, Module: Constructor) {
    // Create Components Instances
    config.models.forEach((Model: Constructor) => {
      //const namespace: string =  `${Module.name}.${Model.name}`;
      const namespace: string = Model.name;
      console.log('Initializing Model: ', namespace);
      const datasource: IDataSource = Injector.get(
        Reflect.getMetadata(ReflectionKeys.DATA_SOURCE, Model),
      );
      const schema: {[key: string]: any} = Reflect.getMetadata(
        ReflectionKeys.MODEL_SCHEMA,
        Model,
      );
      // TODO, Pass datasource reference maybe using injector maybe metadata
      Injector.set(
        namespace,
        datasource.register(Model.name, new Model(), schema),
      );
    });
  }
  /**
   * @method setupServices
   * @param config
   * @description This method will setup services for a given module
   * Services are specific to modules and won't be directly exposed
   * from other modules.
   */
  setupServices(config: IModuleConfig, moduleInstance, Module: Constructor) {
    // Create Components Instances
    config.services.forEach((Service: Constructor) => {
      //const namespace: string =  `${Module.name}.${Service.name}`;
      const namespace: string = Service.name;
      console.log('Initializing Service: ', namespace);
      if (!Injector.get(namespace)) {
        Injector.set(namespace, new Service());
      }
    });
  }
  /**
   * @method setupComponents
   * @param config
   * @description This method will setup components for a given module
   * Component methods will be exposed via RPC if these are public.
   *
   * private or protected methods won't be accessible to any caller.
   */
  setupComponents(config: IModuleConfig, moduleInstance, Module: Constructor) {
    // Create Components instances
    config.components.forEach((Component: new () => IComponent) => {
      // If component does not exist
      if (!moduleInstance[Component.name]) {
        console.log('Initializing Component: ', Component.name);
        moduleInstance[Component.name] = new Component();
        moduleInstance[Component.name].init(); // Might be migrated to other point
      }
    });
  }
}
