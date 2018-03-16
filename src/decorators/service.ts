import {ReflectionKeys} from '../index';
/**
 * @function Service
 * @param DSClass
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This decorator will register this class as
 * injectable service.
 */
export function Service() {
  return (Class: new () => void) => {
    Reflect.defineMetadata(
      ReflectionKeys.INJECTABLE_SERVICE,
      true,
      Class.prototype,
    );
  };
}
