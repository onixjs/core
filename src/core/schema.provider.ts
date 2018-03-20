import 'reflect-metadata';
import {OnixJS, IAppDirectory, IAppConfig} from '../index';
import * as http from 'http';
import {HTTPServer} from './http.server';
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
  private server: HTTPServer;
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
    // Setup server
    this.server = new HTTPServer(this.onix.config);
    this.server.register('/', (req, res) => this.listener(req, res));
    this.server.start();
    // Indicate the ONIX SERVER is now listening on the given port
    console.log(
      `ONIX SCHEMA PROVIDER: Listening on port ${this.onix.config.port}`,
    );
  }

  stop(): void {
    this.server.stop();
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
    res.end(JSON.stringify(configs));
  }
}
