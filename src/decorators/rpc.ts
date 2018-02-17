import {ReflectionKeys} from '../index';
/**
 * @function RPC
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This decorator will expose component methods
 */
export function RPC() {
  return function(target: object, propertyKey: string) {
    Reflect.defineMetadata(
      ReflectionKeys.RPC_METHOD,
      true,
      target,
      propertyKey,
    );
  };
}
