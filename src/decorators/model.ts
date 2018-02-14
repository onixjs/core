import {ReflectionKeys, IModelConfig} from '../index';
/**
 * @function Model
 * @param DSClass
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This decorator will add the passed datasource
 * class as metadata for further usage.
 */
export function Model(config: IModelConfig) {
  return (Class: new () => void) => {
    Reflect.defineMetadata(
      ReflectionKeys.DATA_SOURCE,
      config.datasource.name,
      Class,
    );
    Reflect.defineMetadata(
      ReflectionKeys.MODEL_SCHEMA,
      config.schema || {},
      Class,
    );
  };
}
