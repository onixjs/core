import {ReflectionKeys, IRESTConfig} from '../interfaces';
/**
 * @namespace REST
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This namespace provides with decorators
 * to enable REST endpoints linked to component methods.
 */
export namespace REST {
  /**
   * @function Get
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This decorator will expose component methods
   */
  export function Get(config: IRESTConfig) {
    return function(target: object, propertyKey: string) {
      config.method = 'GET';
      Reflect.defineMetadata(
        ReflectionKeys.REST_METHOD,
        config,
        target,
        propertyKey,
      );
    };
  }
  /**
   * @function Post
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This decorator will expose component methods
   */
  export function Post(config: IRESTConfig) {
    return function(target: object, propertyKey: string) {
      config.method = 'POST';
      Reflect.defineMetadata(
        ReflectionKeys.REST_METHOD,
        config,
        target,
        propertyKey,
      );
    };
  }
  /**
   * @function Put
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This decorator will expose component methods
   */
  export function Put(config: IRESTConfig) {
    return function(target: object, propertyKey: string) {
      config.method = 'PUT';
      Reflect.defineMetadata(
        ReflectionKeys.REST_METHOD,
        config,
        target,
        propertyKey,
      );
    };
  }
  /**
   * @function Patch
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This decorator will expose component methods
   */
  export function Patch(config: IRESTConfig) {
    return function(target: object, propertyKey: string) {
      config.method = 'PATCH';
      Reflect.defineMetadata(
        ReflectionKeys.REST_METHOD,
        config,
        target,
        propertyKey,
      );
    };
  }
  /**
   * @function Delete
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This decorator will expose component methods
   */
  export function Delete(config: IRESTConfig) {
    return function(target: object, propertyKey: string) {
      config.method = 'DELETE';
      Reflect.defineMetadata(
        ReflectionKeys.REST_METHOD,
        config,
        target,
        propertyKey,
      );
    };
  }
}
