import {IDataSource, ReflectionKeys} from '../interfaces';
/**
 * @function DataSource
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This decorator will create an instance
 * of a datasource, persit it on the Injector and initialize
 * the connection process.
 */
export function DataSource() {
  return (target: new () => IDataSource) => {
    Reflect.defineMetadata(
      ReflectionKeys.INJECTABLE_DATASOURCE,
      true,
      target.prototype,
    );
  };
}
