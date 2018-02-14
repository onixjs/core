import {IModule, Constructable, seal, ReflectionKeys} from '../index';
/**
 * @function Module
 * @author Jonathan Casarrubias <t: johncasarrubias>
 * @param config
 * @license MIT
 * @description This decorator simly seals the module class
 */
export function Module(config: IModule) {
  return function(ModuleClass: Constructable) {
    seal(ModuleClass);
    Reflect.defineMetadata(
      ReflectionKeys.MODULE_CONFIG,
      config,
      ModuleClass.prototype,
    );
  };
}
