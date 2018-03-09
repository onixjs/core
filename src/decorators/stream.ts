import {ReflectionKeys} from '../index';
/**
 * @function Stream
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This decorator will expose component methods
 */
export function Stream() {
  return function(target: object, propertyKey: string) {
    Reflect.defineMetadata(
      ReflectionKeys.STREAM_METHOD,
      true,
      target,
      propertyKey,
    );
  };
}
