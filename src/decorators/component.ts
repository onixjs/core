import {ReflectionKeys, IComponentConfig} from '../index';
/**
 * @function Component
 * @param DSClass
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This decorator will add the passed datasource
 * class as metadata for further usage.
 */
export function Component(config: IComponentConfig) {
  return (Class: new () => void) => {
    Reflect.defineMetadata(ReflectionKeys.COMPONENT_CONFIG, config, Class.prototype);
  };
}
