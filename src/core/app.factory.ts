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
import {getObjectMethods, walk} from '../utils';
import {AppNotifier, IMiddleware} from '..';
import * as Router from 'router';
import * as fs from 'fs';
import * as path from 'path';
import {Utils} from '@onixjs/sdk/dist/utils';
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
  public setup() {
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
      if (process.send)
        process.send({
          type: OperationType.APP_CREATE_RESPONSE,
          message: this.schema(),
        });
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
        // Get Component Metadata
        const componentConfig: IComponentConfig = Reflect.getMetadata(
          ReflectionKeys.COMPONENT_CONFIG,
          moduleInstance[Component.name],
        );
        // Now recursively inject models and services within this component
        this.scopes[Module.name].inject(
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
    });
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
          case RouterTypes.PARAM:
          case RouterTypes.ALL:
            if (config.endpoint) {
              this.router[config.method.toLowerCase()](
                config.endpoint,
                (req, res, next) =>
                  this.routeWrapper(instance, method, req, res, next),
              );
            } else {
              this.router[config.method.toLowerCase()]((req, res, next) =>
                this.routeWrapper(instance, method, req, res, next),
              );
            }
            break;
          case RouterTypes.STATIC:
            this.router.use((req, res, next) =>
              walk(
                path.join(
                  this.config.cwd || process.cwd(),
                  config.endpoint || '/',
                ),
                (err, files: string[]) => {
                  if (err) return next(err);
                  const match: string | undefined = files
                    .filter((file: string) =>
                      file.match(new RegExp('\\b' + req.url + '\\b', 'g')),
                    )
                    .pop();
                  if (match) {
                    this.view(instance, method, config, match, req, res, next);
                  } else {
                    next();
                  }
                },
              ),
            );
            break;
          case RouterTypes.VIEW:
            this.router[config.method.toLowerCase()](
              config.endpoint || config.file,
              (req, res, next) => {
                this.view(
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
                );
              },
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
  routeWrapper(instance, method, req, res, next) {
    const result = instance[method](req, res);
    if (result instanceof Promise) {
      result.then(r => next(null, r), e => next(e));
    } else {
      next(null, result);
    }
  }
  /**
   * @method view
   * @param ctx
   * @param req
   * @param res
   * Will server view files
   */
  private view(instance, method, config, pathname, req, res, next) {
    if (req.url && req.method) {
      /* We need to form the real pathname, lets figure out how
      let pathname: string = path.join(
        this.config.cwd || process.cwd(),
        config.file,
      );*/
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
      fs.exists(pathname, exist => {
        if (!exist) {
          // if the file is not found, return 404
          res.statusCode = 404;
          return res.end(
            JSON.stringify({
              code: res.statusCode,
              message: `Unable to find ${pathname}`,
            }),
          );
        }
        // if is a directory search for index file matching the extention
        if (fs.statSync(pathname).isDirectory()) pathname += '/index' + ext;
        // read file from file system
        fs.readFile(pathname, (err, data) => {
          if (err) {
            res.statusCode = 500;
            return res.end(
              JSON.stringify({
                code: res.statusCode,
                message: `Error getting the file: ${err}.`,
              }),
            );
          } else {
            res.setHeader('Content-type', map[ext] || 'text/plain');
            // Potentially get cookies and headers
            const result = instance[method](req, data);
            if (result instanceof Promise) {
              result.then(
                r => res.end(Utils.IsJsonString(r) ? JSON.stringify(r) : r),
                e => next(JSON.stringify(e)),
              );
            } else if (!result) {
              res.end(data);
            } else if (result) {
              res.end(
                Utils.IsJsonString(result) ? JSON.stringify(result) : result,
              );
            } else {
              next();
            }
          }
        });
      });
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
