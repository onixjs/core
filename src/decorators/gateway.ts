import {OnixRPC, IApp, OnixServer, IConfig, seal} from '../index';
/**
 * @function Gateway
 * @author Jonathan Casarrubias <t: johncasarrubias>
 * @param config
 * @license MIT
 * @description This decorator configures an application
 * in order to work in a cluster of Onix apps
 */
export function Gateway(config: IConfig) {
  return function(AppClass: new (rpc: OnixRPC) => IApp) {
    seal(AppClass);
    new OnixServer(AppClass, config);
  };
}
