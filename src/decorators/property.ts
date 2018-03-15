import {ReflectionKeys, IPropertyConfig} from '../index';
/**
 * @function Property
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This decorator will define model
 * property type.
 */
export function Property(type) {
  return function(target: object, name: string) {
    // Initialize property with type
    target[name] = null;
    // Define property metadata
    Reflect.defineMetadata(
      ReflectionKeys.MODEL_PROPERTY,
      <IPropertyConfig>{
        name,
        type,
      },
      target,
      name,
    );
  };
}
