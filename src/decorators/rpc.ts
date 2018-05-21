import {ReflectionKeys, RPCMethod, IComponent} from '../index';
/**
 * @function RPC
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This decorator will expose component methods
 */
export function RPC() {
  return function(
    target: IComponent,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<RPCMethod>,
  ) {
    Reflect.defineMetadata(
      ReflectionKeys.RPC_METHOD,
      true,
      target,
      propertyKey,
    );
  };
}
