import {IDataSource, ReflectionKeys} from '../index';
/**
 * @function Model
 * @param DSClass
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This decorator will add the passed datasource
 * class as metadata for further usage.
 */
export function Model(DSClass: new () => IDataSource) {
  return (Class: new () => void) => {
    Reflect.defineMetadata(ReflectionKeys.DATA_SOURCE, DSClass.name, Class);
  };
}
