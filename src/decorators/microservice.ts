import {AppServer} from '../core';
import {IAppConfig, AppConstructor} from '../interfaces';
import {seal} from '../utils/seal';
/**
 * @function MicroService
 * @author Jonathan Casarrubias <t: johncasarrubias>
 * @param config
 * @license MIT
 * @description This decorator configures an application
 * in order to work in a cluster of Onix apps
 */
export function MicroService(config: IAppConfig) {
  return function(AppClass: AppConstructor) {
    seal(AppClass);
    new AppServer(AppClass, config);
  };
}
