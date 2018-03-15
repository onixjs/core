import {
  Constructor,
  IModuleConfig,
  getObjectProperties,
  ReflectionKeys,
  IDataSource,
  IPropertyConfig,
  IModelConfig,
} from '..';
/**
 * @class Injector
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This class is a directory collection
 * of injectable instances.
 */
export class Injector {
  /**
   * @property directory
   * @description Object that contains instances of
   * injectable classes.
   */
  private directory: {[key: string]: any} = {};
  /**
   * @method has
   * @description Verifies if the given key already exists
   * on the directory.
   */
  public has(key: string): boolean {
    return this.directory[key] ? true : false;
  }
  /**
   * @method set
   * @description Sets a new value for the given key name
   * within the directory
   */
  public set(key: string, value: any): void {
    this.directory[key] = value;
  }
  /**
   * @method get
   * @description Returns a value from the directory
   * using given key.
   */
  public get<T>(key: string): T {
    return this.directory[key];
  }
  /**
   * @method inject
   * @param Class
   * @param instance
   * @param config
   * @author Jonathan Casarrubias
   * @description This method will inject into the given
   * object instance any requested service or model.
   * It will be iterating recursively creating instances
   * for the required model or service.
   *
   * If a model or service is neved injected, then the system
   * won't create an instance, eventhough the class is installed
   * within the module configuration.
   */
  public inject(Class: Constructor, instance, config: IModuleConfig) {
    // Get a list of properties from this object.
    getObjectProperties(instance).forEach(prop => {
      // Verify the property has injectable config
      const injectable: {
        type: string;
        Class: Constructor;
      } = Reflect.getMetadata(ReflectionKeys.INJECT_REQUEST, instance, prop);
      // Validate now
      if (!injectable) return; // No injectable requestify that injectable class is installed within this module
      if (
        config.models.map(s => s.name).indexOf(injectable.Class.name) < 0 &&
        config.services.map(s => s.name).indexOf(injectable.Class.name) < 0
      ) {
        throw new Error(
          `ONIXJS CORE: Unable to inject an unregisted class "${
            injectable.Class.name
          }", please install it within the @Module "${
            Class.name
          }" configuration`,
        );
      }
      // Verify if injectable request is a model and is requested
      switch (injectable.type) {
        case 'model':
          if (
            Reflect.hasMetadata(
              ReflectionKeys.INJECTABLE_MODEL,
              injectable.Class,
            )
          )
            Object.defineProperty(instance, prop, {
              value: this.injectModel(injectable.Class, config),
              writable: false,
            });
          break;
        case 'service':
          if (
            Reflect.hasMetadata(
              ReflectionKeys.INJECTABLE_SERVICE,
              injectable.Class,
            )
          )
            Object.defineProperty(instance, prop, {
              value: this.injectService(injectable.Class, config),
              writable: false,
            });
          break;
        default:
          throw new Error(
            `ONIXJS Error: injectable type is not valid, ${injectable.type}`,
          );
      }
    });
  }
  /**
   * @method injectModel
   * @param Model
   * @param config
   * This method will recursively setup every service, it will also
   */
  private injectModel(Model: Constructor, config: IModuleConfig) {
    // Singleton model, no need for more instances :)
    if (this.has(Model.name)) {
      return this.get(Model.name);
    }
    // Get model configuration
    const modelConfig: IModelConfig = Reflect.getMetadata(
      ReflectionKeys.INJECTABLE_MODEL,
      Model,
    );
    // If there is no config this is an invalid model
    if (!modelConfig)
      throw new Error(
        'ONIXJS: Unable to inject corrupted model, decorated configuration is missing',
      );
    // Set datasource reference
    let datasource: IDataSource;
    if (this.has(modelConfig.datasource.name)) {
      datasource = this.get(modelConfig.datasource.name);
    } else {
      datasource = new modelConfig.datasource();
      datasource.connect();
      this.set(modelConfig.datasource.name, datasource);
    }
    // Model schema reference, will be parsed from instance decoration
    const schema = {};
    // Model instance
    const model = new Model();
    // Iterate over decorated properties
    getObjectProperties(model).forEach((prop: string) => {
      const propConfig: IPropertyConfig = Reflect.getMetadata(
        ReflectionKeys.MODEL_PROPERTY,
        model,
        prop,
      );
      // Verify if this property is decorated
      if (propConfig) {
        schema[propConfig.name] = propConfig.type;
      }
    });
    // Set orm model instance reference
    const instance = datasource.register(Model.name, model, schema);
    // Persist reference
    this.set(Model.name, instance);
    return instance;
  }
  /**
   * @method injectService
   * @param Service
   * @param config
   * This method will recursively setup every service, it will also
   */
  private injectService(Service: Constructor, config: IModuleConfig) {
    // Singleton model, no need for more instances :)
    if (this.has(Service.name)) {
      return this.get(Service.name);
    }
    // Create new service instance
    const instance: Constructor = new Service();
    // Inject whatever this service has requested to be injected (Wingardium Levioza!)
    this.inject(Service, instance, config);
    // Persist on Injector (We won't process this service again)
    this.set(Service.name, instance);
    // Return Service instance
    return instance;
  }
}
