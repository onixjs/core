import {ReflectionKeys, IRESTConfig} from '../interfaces';
/**
 * @function GET
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This decorator will expose component methods
 */
export function GET(config: IRESTConfig) {
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
 * @function POST
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This decorator will expose component methods
 */
export function POST(config: IRESTConfig) {
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
 * @function PUT
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This decorator will expose component methods
 */
export function PUT(config: IRESTConfig) {
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
 * @function PATCH
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This decorator will expose component methods
 */
export function PATCH(config: IRESTConfig) {
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
 * @function DELETE
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This decorator will expose component methods
 */
export function DELETE(config: IRESTConfig) {
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
