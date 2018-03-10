import 'reflect-metadata';
import {OnixJS, IAppDirectory, IAppConfig} from '../index';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
/**
 * @function OnixServer
 * @author Jonathan Casarrubias
 * @param operation
 * @license MIT
 * @description This class handles an system level server.
 * It basically will serve http endpoints that will help
 * clients to subscribe to their RPC connections.
 */
export class OnixServer {
  /**
   * @property server
   * @description http server
   */
  private server: http.Server | https.Server;
  /**
   * @constructor
   * @param onix
   * @param config
   */
  constructor(private onix: OnixJS) {}
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
      this.onix.config.port === 443 &&
      (!this.onix.config.ssl ||
        !this.onix.config.ssl.key ||
        this.onix.config.ssl.cert)
    )
      throw new Error(
        'ONIX SERVER: SSL configuration is invalid, ssl key or cert missing',
      );
    // Setup server
    this.server =
      this.onix.config.port === 443
        ? // Create secure HTTPS Connection
          https
            .createServer(
              {
                key: fs.readFileSync(
                  this.onix.config.ssl
                    ? this.onix.config.ssl.key
                    : './ssl/file.key',
                ),
                cert: fs.readFileSync(
                  this.onix.config.ssl
                    ? this.onix.config.ssl.cert
                    : './ssl/file.cert',
                ),
              },
              (req, res) => this.listener(req, res),
            )
            .listen(this.onix.config.port)
        : // Create insecure HTTP Connection
          http
            .createServer((req, res) => this.listener(req, res))
            .listen(this.onix.config.port);
    // Indicate the ONIX SERVER is now listening on the given port
    console.log(`ONIX SERVER: Listening on port ${this.onix.config.port}`);
  }

  stop(): void {
    this.server.close();
  }

  listener(req: http.IncomingMessage, res: http.ServerResponse): void {
    const apps: IAppDirectory = this.onix.apps();
    const configs: {
      [key: string]: IAppConfig | undefined;
    } = {};
    // Create an Object directory instead of Array
    // Will allow client SDK to perform better
    Object.keys(apps)
      .filter((name: string) => apps[name].config)
      .forEach((name: string) => {
        configs[name] = apps[name].config;
      });
    // Response the schema now
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(configs, null, 2));
  }
}
