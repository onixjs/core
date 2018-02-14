import {IDataSource, Injector} from '../index';
/**
 * @function DataSource
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This decorator will create an instance
 * of a datasource, persit it on the Injector and initialize
 * the connection process.
 */
export function DataSource() {
  return (Class: new () => IDataSource) => {
    if (!Injector.has(Class.name)) {
      const datasource: IDataSource = new Class();
      datasource.connect();
      Injector.set(Class.name, datasource);
    } else {
      console.log(`Ignoring Duplicated datasource ${Class.name}`);
    }
  };
}
