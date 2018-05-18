import {
  ReflectionKeys,
  IApp,
  IAppConfig,
  IModuleConfig,
  IComponent,
  Constructor,
  AppConstructor,
  IComponentConfig,
  RouterTypes,
} from '../interfaces';
import {Injector} from '../core';
import {getObjectMethods, promiseSeries} from '../utils';
import {AppNotifier} from '..';
import * as Router from 'router';
import * as path from 'path';
import {AppRoute} from './app.route';
/**
 * @class AppFactory
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This class will construct a given application class into a fully working
 * and operative tree of references.
 *
 * This class will mainly iterate over modules and components, read their metadata and
 * configure according.
 */
export class AppFactory {
  private _config: IAppConfig;
  private _notifier: AppNotifier;
  private _router: Router;
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
   * @property config
   * @description A setter and getter for configurations
   * in this application factory.
   */
  public set config(config: IAppConfig) {
    this._config = config;
  }
  public get config(): IAppConfig {
    return this._config;
  }
  /**
   * @property router
   * @description A setter and getter for HTTP Middleware Routing.
   */
  public set router(router: Router) {
    this._router = router;
  }
  public get router(): Router {
    return this._router;
  }
  /**
   * @property notifier
   * @description A setter and getter for App Level Notifier (EventEmitter).
   */
  public set notifier(notifier: AppNotifier) {
    this._notifier = notifier;
  }
  public get notifier(): AppNotifier {
    return this._notifier;
  }
  /**
   * @constructor
   * @param Class
   * @param config
   * @param notifier
   * @param http
   * @description this construcvtor will call for setupApp and setupModules method.
   * once these processes finish it will emit an event to the parent process to
   * inform this application has been created.
   */
  constructor(private Class: AppConstructor) {
    // First of all create a new class instance
    if (!this.app) this.app = new this.Class();
    // Once finished send the schema back
    // TODO: Potentially register to a provider in here
    // Like registering to a Gateway
  }
  /**
   * @method setup
   * @description This method will iterate over a list of defined modules for this
   * application. It will internally call for methods to setup models, services and
   * components.
   */
  public async setup() {
    // Iterate list of module classes
    await promiseSeries(
      this.config.modules.map((Module: Constructor) => async () => {
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
          await this.setupComponents(
            config,
            this.app.modules[Module.name],
            Module,
          );
      }),
    );
    // Return Application Schema
    return this.schema();
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
  async setupComponents(
    config: IModuleConfig,
    moduleInstance,
    Module: Constructor,
  ) {
    // Series of Promises
    await promiseSeries(
      config.components.map((Component: new () => IComponent) => async () => {
        // If component does not exist
        if (!moduleInstance[Component.name]) {
          // Create a new component instance
          moduleInstance[Component.name] = new Component();
          // Get Component Metadata
          const componentConfig: IComponentConfig = Reflect.getMetadata(
            ReflectionKeys.COMPONENT_CONFIG,
            moduleInstance[Component.name],
          );
          // Now recursively inject models and services within this component
          await this.scopes[Module.name].inject(
            Component,
            moduleInstance[Component.name],
            Object.assign(config, {notifier: this.notifier}),
          );
          // Finally configure component http routing (If network enabled)
          if (
            !this.config.network ||
            (this.config.network && !this.config.network!.disabled)
          ) {
            // Get the right route base path
            const componentRouter: Router =
              componentConfig && componentConfig.route
                ? this.router.route(componentConfig.route)
                : this.router;
            // Keep routin'
            this.routing(moduleInstance[Component.name], componentRouter);
          }
        }
      }),
    );
  }
  /**
   * @method routing
   * @param instance
   * @description This method will configure every decorated
   * method using any of the provided @Router decorators.
   * Those having decorated configs, will load the associated
   * class Route class.
   */
  routing(component, router: Router): void {
    // Iterate over component methods
    getObjectMethods(component).forEach((method: string) => {
      // Try to get middleware config now
      const config = Reflect.getMetadata(
        ReflectionKeys.MIDDLEWARE,
        component,
        method,
      );
      // Verify we actually got a middleware config
      if (config) {
        switch (config.type) {
          case RouterTypes.HTTP:
          case RouterTypes.USE:
          case RouterTypes.ALL:
            new AppRoute.Default(component, method, this.router, config);
            break;
          case RouterTypes.PARAM:
            this.router.param(
              config.param!.name,
              async (req, res, next, param) => {
                req[config.param!.as] = await component[method](req, param);
                next();
              },
            );
            break;
          case RouterTypes.STATIC:
            new AppRoute.Static(
              component,
              method,
              path.join(
                this.config.cwd || process.cwd(),
                config.endpoint || '/',
              ),
              this.router,
              config,
            );
            break;
          case RouterTypes.VIEW:
            new AppRoute.View(
              component,
              method,
              path.join(this.config.cwd || process.cwd(), config.file || ''),
              this.router,
              config,
            );
            break;
        }
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
