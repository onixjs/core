import {
  ReflectionKeys,
  IApp,
  IAppConfig,
  IModuleConfig,
  IComponent,
  OperationType,
  Constructor,
  AppConstructor,
  IComponentConfig,
  RouterTypes,
} from '../interfaces';
import {Injector} from '../core';
import {getObjectMethods, promiseSeries, AsyncWalk} from '../utils';
import {AppNotifier, IMiddleware} from '..';
import * as Router from 'router';
import * as fs from 'fs';
import * as path from 'path';
import {Utils} from '@onixjs/sdk/dist/utils';
import {promisify} from 'util';
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
    const result = await promiseSeries(
      this.config.modules.map((Module: Constructor) => async () => {
        //this.config.modules.forEach(async (Module: Constructor) => {
        console.log('Module Name: ', Module.name);
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
    if (process.send)
      process.send({
        type: OperationType.APP_CREATE_RESPONSE,
        message: this.schema(),
      });

    return result;
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
        console.log('Component Name: ', Component.name);
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
   * @description
   *   Keep routin' routin' routin' routin' (what?)
   *   Keep routin' routin' routin' routin' (come on)
   *   Keep routin' routin' routin' routin' (yeah)
   *   Keep routin' routin' routin' routin'
   *   Now I know why'all be lovin' this shit right here
   *   O.N.I.X Onix is right here
   *   People in the house put them hands in the air
   *   'Cause if you don't care, then we don't care
   *   --------------------------------------------------
   *   /W Love: Jon
   */
  routing(instance, router: Router): void {
    // Iterate over component methods
    getObjectMethods(instance).forEach((method: string) => {
      // Try to get middleware config now
      const config: IMiddleware = Reflect.getMetadata(
        ReflectionKeys.MIDDLEWARE,
        instance,
        method,
      );
      // Verify we actually got a middleware config
      if (config) {
        switch (config.type) {
          case RouterTypes.HTTP:
          case RouterTypes.USE:
          case RouterTypes.ALL:
            if (config.endpoint) {
              this.router[config.method.toLowerCase()](
                config.endpoint,
                async (req, res, next) =>
                  await this.routeWrapper(instance, method, req, res, next),
              );
            } else {
              this.router[config.method.toLowerCase()](
                async (req, res, next) =>
                  await this.routeWrapper(instance, method, req, res, next),
              );
            }
            break;
          case RouterTypes.PARAM:
            this.router.param(
              config.param!.name,
              async (req, res, next, param) => {
                req[config.param!.as] = await instance[method](req, param);
                next();
              },
            );
            break;
          case RouterTypes.STATIC:
            this.router.use(async (req, res, next) => {
              const pathname: string = path.join(
                this.config.cwd || process.cwd(),
                config.endpoint || '/',
              );
              const AsyncLStat = promisify(fs.lstat);
              const stats: fs.Stats = await AsyncLStat(pathname);
              let match: string | undefined;
              if (stats.isDirectory()) {
                const files: string[] = <string[]>await AsyncWalk(pathname);
                match = files
                  .filter((file: string) =>
                    file.match(new RegExp('\\b' + req.url + '\\b', 'g')),
                  )
                  .pop();
              }
              await this.view(
                instance,
                method,
                config,
                match || pathname,
                req,
                res,
                next,
              );
            });
            break;
          case RouterTypes.VIEW:
            this.router[config.method.toLowerCase()](
              config.endpoint || config.file,
              async (req, res, next) =>
                await this.view(
                  instance,
                  method,
                  config,
                  path.join(
                    this.config.cwd || process.cwd(),
                    config.file || '',
                  ),
                  req,
                  res,
                  next,
                ),
            );
            break;
        }
      }
    });
  }
  /**
   * @method routeWrapper
   * @param instance
   * @param method
   * @param err
   * @param req
   * @param res
   * @param next
   * @description This handler will provide shared functionality
   * when registering different type of route features.
   */
  async routeWrapper(instance, method, req, res, next) {
    // Potentially register LifeCycles in here.
    const result = await instance[method](req, res);
    // If the method returned a value, otherwise they might response their selves
    if (result) {
      // Send result to the requester
      res.end(Utils.IsJsonString(result) ? JSON.stringify(result) : result);
    } else {
      next();
    }
  }
  /**
   * @method view
   * @param ctx
   * @param req
   * @param res
   * Will server view files
   */
  private async view(instance, method, config, pathname, req, res, next) {
    if (req.url && req.method) {
      // Try to get a file extension
      const ext = path.parse(pathname).ext;
      // maps file extention to MIME typere
      const map = {
        '.ico': 'image/x-icon',
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.wav': 'audio/wav',
        '.mp3': 'audio/mpeg',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
      };
      // Promisify exists and readfile
      const AsyncExists = promisify(fs.exists);
      const AsyncReadFile = promisify(fs.readFile);
      // Verify the pathname exists
      const exist: boolean = await AsyncExists(pathname);
      // If not, return 404 code
      if (!exist) {
        // if the file is not found, return 404
        res.statusCode = 404;
        console.log(
          `ONIXJS Error: The configured pathfile "${pathname}" does not exist`,
        );
        return res.end(
          JSON.stringify({
            code: res.statusCode,
            message: `Oops!!! something went wrong.`,
          }),
        );
      }
      try {
        // read file from file system
        const data = await AsyncReadFile(pathname);
        // Potentially get cookies and headers
        const result = await instance[method](req, data);
        // Set response headers
        res.setHeader('Content-type', map[ext] || 'text/plain');
        res.end(Utils.IsJsonString(result) ? JSON.stringify(result) : result);
      } catch (e) {
        next();
      }
    }
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
