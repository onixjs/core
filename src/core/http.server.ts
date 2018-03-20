import 'reflect-metadata';
import {OnixConfig} from '../index';
import {EndpointDirectory, HttpRequestHandler} from '../interfaces';
import * as fs from 'fs';
import * as url from 'url';
import * as http from 'http';
import * as https from 'https';
import * as querystring from 'querystring';
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
   * @property endpoints
   * @description Will contain a directory of handlers
   * for specific http request calls.
   */
  private endpoints: EndpointDirectory = {};
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
              (req: http.IncomingMessage, res: http.ServerResponse) =>
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
              await this.listener(req, res);
            })
            .listen(this.config.port);
    // Indicate the ONIX SERVER is now listening on the given port
    console.log(`ONIX SERVER: Listening on port ${this.config.port}`);
  }

  stop(): void {
    this.server.close();
  }

  private async listener(req: http.IncomingMessage, res: http.ServerResponse) {
    if (req.url) {
      // TODO Create HTTP Request that extends from http.IncomingMessage
      if (req.method === 'POST') {
        req['post'] = await this.processPost(req, res);
      }
      // Get Query String
      req['query'] = querystring.parse(url.parse(req.url).query || '');
      // Define Endpoint
      const endpoint: string | undefined = url.parse(req.url).pathname;
      //const query: string | null = url.parse(req.url).query;
      if (endpoint && this.endpoints[endpoint]) {
        this.endpoints[endpoint](req, res);
      } else if (this.endpoints['*']) {
        this.endpoints['*'](req, res);
      } else {
        res.end(
          JSON.stringify({
            error: {
              code: 404,
              message: `Unable to process endpoint, missing listener ${endpoint}`,
            },
          }),
        );
      }
    } else {
      throw new Error('Missing request.url from http.server');
    }
  }

  register(endpoint: string, handler: HttpRequestHandler): void {
    this.endpoints[endpoint] = handler;
  }

  private async processPost(req, res): Promise<any> {
    return new Promise((resolve, reject) => {
      let data: string = '';
      req.on('data', d => {
        data += d;
        // Oops way to large body, kill this guy now
        if (data.length > 1e6) {
          data = '';
          res.writeHead(413, {'Content-Type': 'text/plain'}).end();
          req.connection.destroy();
        }
      });
      req.on('end', function() {
        resolve(querystring.parse(data));
      });
    });
  }
}
