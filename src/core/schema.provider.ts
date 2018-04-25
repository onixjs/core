import 'reflect-metadata';
import {IAppDirectory, IAppConfig} from '../index';
import * as Router from 'router';
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
   * @constructor
   * @param server
   */
  constructor(private router: Router, private apps: IAppDirectory) {
    this.router.get('/.well-known/onixjs-schema', (req, res) => {
      const configs: {
        [key: string]: IAppConfig | undefined;
      } = {};
      // Create an Object directory instead of Array
      // Will allow client SDK to perform better
      Object.keys(this.apps)
        .filter((name: string) => this.apps[name].config)
        .forEach((name: string) => (configs[name] = this.apps[name].config));
      // Response the schema now
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET,PUT,PATCH,POST,DELETE',
      );
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200, {'Content-Type': 'application/json'});
      const schema = JSON.stringify(configs);
      res.end(schema);
    });
  }
}
