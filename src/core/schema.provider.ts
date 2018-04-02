import 'reflect-metadata';
import {OnixJS, IAppDirectory, IAppConfig} from '../index';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
/**
 * @function SchemaProvider
 * @author Jonathan Casarrubias
 * @param operation
 * @license MIT
 * @description This class handles an system level server.
 * It basically will serve http endpoints that will help
 * clients to subscribe to their RPC connections.
 */
export class SchemaProvider {
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
  constructor(private onix: OnixJS) {
    // Listener for closing process
    process.on('exit', () => this.stop());
  }
  /**
   * @method start
   * @author Jonathan Casarrubias
   * @description This method will configure the OnixJS HTTP Server.
   * depending on the incoming configurations it will load either a
   * HTTP or HTTPS server.
   **/
  start(): void {
    // Setup server
    this.server =
      this.onix.config.port === 443
        ? // Create secure HTTPS Connection
          https
            .createServer(
              {
                key: fs.readFileSync(
                  this.onix.config.network!.ssl
                    ? this.onix.config.network!.ssl!.key
                    : './ssl/file.key',
                ),
                cert: fs.readFileSync(
                  this.onix.config.network!.ssl
                    ? this.onix.config.network!.ssl!.cert
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
    console.log(
      `ONIX SCHEMA PROVIDER: Listening on port ${this.onix.config.port}`,
    );
  }

  stop(cb?): void {
    this.server.close(cb);
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(configs));
  }
}
