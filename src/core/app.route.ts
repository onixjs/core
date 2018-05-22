import * as Router from 'router';
import {IMiddleware, IComponent} from '..';
import {promisify} from 'util';
import * as fs from 'fs';
import {AsyncWalk} from '../utils';
import * as path from 'path';
import {Utils} from '@onixjs/sdk/dist/utils';
/**
 * @namespace AppRoute
 * @author Jonathan Casarrubias
 * @description Provides a set of classes that will configure
 * specific app routes.
 */
export namespace AppRoute {
  /**
   * @class Default
   * @author Jonathan Casarrubias
   * @description This class will configure most of the middlewares,
   * basically creating a route using the endpoint -if provided- and
   * the provided HTTP Method.
   *
   * Once these routes are executed it will load the component method
   * associated with the current request.
   *
   * Developers are provided with 2 options to terminate a middleware
   * process.
   *
   * 1.- (Recommended) just return the result within the component method.
   * 2.- (Advanced) sometimes a middleware based component requires to end
   *     a request, then a req and res objects are provided within the route.
   *     A module or developer ending a middleware process, will execute
   *     the req.end() method and no other middlewares will be executd.
   */
  export class Default {
    constructor(
      component: IComponent,
      method: string,
      router: Router,
      config: IMiddleware,
    ) {
      if (config.endpoint) {
        router[config.method.toLowerCase()](
          config.endpoint,
          async (req, res, next) =>
            await this.wrapper(component, method, req, res, next),
        );
      } else {
        router[config.method.toLowerCase()](
          async (req, res, next) =>
            await this.wrapper(component, method, req, res, next),
        );
      }
    }
    /**
     * @method wrapper
     * @param instance
     * @param method
     * @param req
     * @param res
     * @param next
     * @description This handler will provide shared functionality
     * when registering different type of route features.
     */
    async wrapper(instance, method, req, res, next) {
      // Potentially register LifeCycles in here.
      const result = await instance[method](req, res, next);
      // If the method returned a value, otherwise they might response their selves
      if (result) {
        // Send result to the requester
        res.end(typeof result === 'object' ? JSON.stringify(result) : result);
      }
    }
  }
  /**
   * @class Static
   * @author Jonathan Casarrubias
   * @description this class will register a new static
   * route, it will verify if the provided pathname is
   * a static file otherwise if a directory it will verify
   * the req url to see if the file exist in the path directory.
   *
   * Objectives:
   *
   *  1.- It can register a static file like index.html
   *  2.- It can register a directory, if a request includes a
   *      file contained within that registered directory, then
   *      this class will dynamically load that file.
   *      e.g. /assets directory
   */
  export class Static {
    constructor(
      component: IComponent,
      method: string,
      pathname: string,
      router: Router,
      config: IMiddleware,
    ) {
      router.use(async function(req, res, next) {
        // Ok just make sure we got a filename
        try {
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
          // Load file and method for this route.
          await AppRoute.Load.file(
            component,
            method,
            config,
            match || pathname,
            req,
            res,
            next,
          );
        } catch (e) {
          next();
        }
      });
    }
  }
  /**
   * @class View
   * @author Jonathan Casarrubias
   * @description This class will register a view endpoint.
   * Similar to registering using AppRoute.Static class, it
   * can also load a static file, being the AppRoute.View
   * a little more advance since it also allows to register
   * an alias path.
   *
   * Objectives:
   *
   * 1.- Register static files e.g. /my/awesome/file.html
   * 2.- Register static files with endpoint associated
   *     e.g. endpoint: /cool/path, file: /my/hidden/path/file.html
   *
   * Usage:
   *
   * It has to be used through the @Router.View decorator.
   *
   * Examples:
   *
   * - 1.- @Router.View({ file: '/my/awesome/file.html' })
   * - 2.- @Router.View({
   *         endpoint: '/cool/path',
   *         file: '/my/hidden/path/file.html'
   *       })
   */
  export class View {
    constructor(
      component: IComponent,
      method: string,
      pathname: string,
      router: Router,
      config: IMiddleware,
    ) {
      router[config.method.toLowerCase()](
        config.endpoint || config.file,
        async (req, res, next) =>
          await AppRoute.Load.file(
            component,
            method,
            config,
            pathname,
            req,
            res,
            next,
          ),
      );
    }
  }
  /**
   * @class Load
   * @author Jonathan Casarrubias
   * @description This class will load static files from the provided
   * configuration, then it will execute the component method that
   * registered this middleware, in order to be used and/or modified.
   */
  export class Load {
    static async file(instance, method, config, pathname, req, res, next) {
      // Get configured filename from the config.file path.
      const file: string =
        typeof config.file === 'string' ? config.file.split('/').pop() : null;
      // Verify if this static middleware should treat
      // this request, otherwise just call the next one
      if (!pathname.includes(file) && !pathname.includes(req.url)) {
        return next();
      }
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
        try {
          // Verify the pathname exists
          const exist: boolean = await AsyncExists(pathname);
          // If not, return 404 code
          if (!exist) {
            // if the file is not found, return 404
            res.statusCode = 404;
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
            res.end(
              Utils.IsJsonString(result) ? JSON.stringify(result) : result,
            );
          } catch (e) {
            next();
          }
        } catch (e) {
          next();
        }
      }
    }
  }
}
