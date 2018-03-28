import 'reflect-metadata';
import {OnixConfig} from '../index';
import {
  HttpRequestHandler,
  HTTPMethodsDirectory,
  HTTPMethods,
  IView,
  IViewDirectory,
  IViewHandler,
  OnixHTTPRequest,
  ErrorResponse,
} from '../interfaces';
import * as fs from 'fs';
import * as url from 'url';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import * as querystring from 'querystring';
import {Utils} from '@onixjs/sdk/dist/utils';
/**
 * @function HTTPServer
 * @author Jonathan Casarrubias
 * @param operation
 * @license MIT
 * @description This class handles an system level server.
 * It basically will serve http endpoints that will help
 * clients to subscribe to their RPC connections.
 */
export class HTTPServer {
  /**
   * @property server
   * @description http server
   */
  private server: http.Server | https.Server;
  /**
   * @property views
   * @description Will contain a directory of handlers
   * for specific http request calls.
   */
  private views: IViewDirectory = {};
  /**
   * @property endpoints
   * @description Will contain a directory of handlers
   * for specific http request calls.
   */
  private endpoints: HTTPMethodsDirectory = {
    get: {},
    post: {},
    patch: {},
    put: {},
    update: {},
    delete: {},
  };
  /**
   * @constructor
   * @param config
   */
  constructor(
    private config: OnixConfig = {
      cwd: process.cwd(),
      host: '127.0.0.1',
      port: 3000,
    },
  ) {}
  /**
   * @method start
   * @author Jonathan Casarrubias
   * @description This method will configure the OnixJS HTTP Server.
   * depending on the incoming configurations it will load either a
   * HTTP or HTTPS server.
   **/
  start(): void {
    // Verify SSL Settings
    if (
      this.config.port === 443 &&
      (!this.config.ssl || !this.config.ssl.key || this.config.ssl.cert)
    )
      throw new Error(
        'ONIX HTTP SERVER: SSL configuration is invalid, ssl key or cert missing',
      );
    // Setup server
    this.server =
      this.config.port === 443
        ? // Create secure HTTPS Connection
          https
            .createServer(
              {
                key: fs.readFileSync(
                  this.config.ssl ? this.config.ssl.key : './ssl/file.key',
                ),
                cert: fs.readFileSync(
                  this.config.ssl ? this.config.ssl.cert : './ssl/file.cert',
                ),
              },
              (req: OnixHTTPRequest, res: http.ServerResponse) =>
                this.listener(req, res),
            )
            .listen(this.config.port)
        : // Create insecure HTTP Connection
          http
            .createServer(async (req, res) => {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader(
                'Access-Control-Allow-Methods',
                'GET,PUT,POST,DELETE',
              );
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
              await this.listener(<OnixHTTPRequest>req, res);
            })
            .listen(this.config.port);
    // Indicate the ONIX SERVER is now listening on the given port
    console.log(`ONIX SERVER: Listening on port ${this.config.port}`);
  }

  getNative(): http.Server | https.Server {
    return this.server;
  }

  stop(): void {
    this.server.close();
  }
  /**
   * @method listener
   * @param req
   * @param res
   * @description This method wraps endpoints. This provides framework level
   * functionalities to each of the calls.
   *
   * Example, parse POST or Query.
   */
  private async listener(req: OnixHTTPRequest, res: http.ServerResponse) {
    if (req.url && req.method) {
      if (req.method === 'POST') {
        req.post = await this.processPost(req, res);
        req.post = Utils.IsJsonString(req.post)
          ? JSON.parse(<string>req.post)
          : req.post;
      }
      // Get Query String
      req.query = querystring.parse(url.parse(req.url).query || '');
      // Verify This is not a static file
      const parsedUrl = url.parse(req.url);
      // Create request context
      const ctx: {
        pathname: string;
        ext?: string;
      } = {
        pathname: parsedUrl.pathname || '',
      };
      ctx.ext = path.parse(ctx.pathname).ext;
      // Is this a static or logical endpoint
      if (
        // Is there any view registered for this pathname?
        this.views[ctx.pathname] ||
        // Maybe this is an actual filename, verify for an extension.
        (ctx.ext &&
          // If there is an extension
          (ctx.ext !== '' ||
            // Or if there is a directory with this name
            fs
              .statSync(path.join(this.config.cwd || __dirname, ctx.pathname))
              .isDirectory()))
      ) {
        this.static(ctx, req, res);
      } else {
        // Else treat it as an endpoint (Function Handler)
        await this.endpoint(ctx, req, res);
      }
    }
  }
  /**
   * @method static
   * @param ctx
   * @param req
   * @param res
   * Will server static files
   */
  private static(ctx, req: OnixHTTPRequest, res: http.ServerResponse) {
    if (req.url && req.method) {
      // We need to form the real pathname, lets figure out how
      let pathname: string = '';
      // If there are any views registered
      if (this.views[ctx.pathname]) {
        pathname = path.join(
          this.config.cwd || process.cwd(),
          this.views[ctx.pathname].file,
        );
      } else {
        // Then use the actual URL path name
        pathname = path.join(this.config.cwd || process.cwd(), ctx.pathname);
      }
      console.log('LOADING PATHNAME: ', pathname);
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
      };
      fs.exists(pathname, exist => {
        if (!exist) {
          // if the file is not found, return 404
          res.statusCode = 404;
          res.end(
            JSON.stringify(<ErrorResponse>{
              code: res.statusCode,
              message: `Unable to find ${pathname}`,
            }),
          );
          return;
        }
        // if is a directory search for index file matching the extention
        if (fs.statSync(pathname).isDirectory()) pathname += '/index' + ctx.ext;
        // read file from file system
        fs.readFile(pathname, (err, data) => {
          if (err) {
            res.statusCode = 500;
            res.end(`Error getting the file: ${err}.`);
          } else {
            res.setHeader('Content-type', map[ctx.ext] || 'text/plain');
            // Potentially get cookies and headers
            if (this.views[ctx.pathname]) {
              this.views[ctx.pathname]
                .handler(req, data)
                .then(result => res.end(result), e => res.end(e));
            } else {
              // if the file is found, set Content-type and send data
              res.setHeader('Content-type', map[ctx.ext] || 'text/plain');
              res.end(data);
            }
          }
        });
      });
    }
  }
  /**
   * @method endpoint
   * @param ctx
   * @param req
   * @param res
   * @description This method will treat a request as an endpoint request
   * It will handle post or query data and pass it parsed as request.
   */
  private async endpoint(ctx, req: OnixHTTPRequest, res: http.ServerResponse) {
    if (req.url && req.method) {
      // Get directory of endpoints for this method
      const directory = this.endpoints[req.method.toLowerCase()];
      // Verify we actually got a directory
      if (directory) {
        //const query: string | null = url.parse(req.url).query;
        if (ctx.pathname && directory[ctx.pathname]) {
          directory[ctx.pathname](req, res);
        } else if (directory['*']) {
          directory['*'](req, res);
        } else {
          res.end(
            JSON.stringify({
              error: {
                code: 404,
                message: `Unable to process endpoint, missing listener ${
                  ctx.pathname
                }`,
              },
            }),
          );
        }
      }
    }
  }
  /**
   * @method register
   * @param method
   * @param endpoint
   * @param handler
   * @description This method will register middleware endpoints
   * It should be used before the server is started.
   */
  register(
    method:
      | HTTPMethods.GET
      | HTTPMethods.POST
      | HTTPMethods.PUT
      | HTTPMethods.PATCH
      | HTTPMethods.DELETE,
    endpoint: string,
    handler: HttpRequestHandler | IViewHandler,
    file?: string,
  ): void {
    if (file) {
      this.views[endpoint] = <IView>{
        file,
        handler,
      };
    } else {
      switch (method) {
        // Using enum instead of string to make this a strict feature
        case HTTPMethods.GET:
          this.endpoints.get[endpoint] = <HttpRequestHandler>handler;
          break;
        case HTTPMethods.POST:
          this.endpoints.post[endpoint] = <HttpRequestHandler>handler;
          break;
        case HTTPMethods.PUT:
          this.endpoints.put[endpoint] = <HttpRequestHandler>handler;
          break;
        case HTTPMethods.PATCH:
          this.endpoints.patch[endpoint] = <HttpRequestHandler>handler;
          break;
        case HTTPMethods.DELETE:
          this.endpoints.delete[endpoint] = <HttpRequestHandler>handler;
          break;
      }
    }
  }
  /**
   * @method processPost
   * @param req
   * @param res
   * @description Built-in middleware that parses a post data
   * and returns a parsed object.
   */
  private async processPost(req, res): Promise<any> {
    return new Promise((resolve, reject) => {
      let data: string = '';
      req.on('data', d => {
        data += d;
        /* Oops way to large body, kill this guy now
        Temporally disabled since it is not currently public feature
        if (data.length > 1e6) {
          data = '';
          res.writeHead(413, {'Content-Type': 'text/plain'}).end();
          req.connection.destroy();
        }*/
      });
      req.on('end', function() {
        resolve(data);
      });
    });
  }
}
