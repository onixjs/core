import {ReflectionKeys, IModelConfig, Constructor} from '../index';
/**
 * @function Model
 * @param DSClass
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This decorator will add the passed datasource
 * class as metadata for further usage.
 */
export function Model(config: IModelConfig) {
  return (Class: Constructor) => {
    Reflect.defineMetadata(
      ReflectionKeys.INJECTABLE_MODEL,
      config,
      Class.prototype,
    );
  };
}
