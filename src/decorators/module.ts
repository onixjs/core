import {IModuleConfig, Constructor, seal, ReflectionKeys} from '../index';
/**
 * @function Module
 * @author Jonathan Casarrubias <t: johncasarrubias>
 * @param config
 * @license MIT
 * @description This decorator simly seals the module class
 */
export function Module(config: IModuleConfig) {
  return function(ModuleClass: Constructor) {
    seal(ModuleClass);
    Reflect.defineMetadata(
      ReflectionKeys.MODULE_CONFIG,
      config,
      ModuleClass.prototype,
    );
  };
}
