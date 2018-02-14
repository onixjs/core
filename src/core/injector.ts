/**
 * @class Injector
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This class is a directory collection
 * of injectable instances.
 */
export class Injector {
  /**
   * @property directory
   * @description Object that contains instances of
   * injectable classes.
   */
  private static directory: {[key: string]: any} = {};
  /**
   * @method has
   * @description Verifies if the given key already exists
   * on the directory.
   */
  public static has(key: string): boolean {
    return Injector.directory[key] ? true : false;
  }
  /**
   * @method set
   * @description Sets a new value for the given key name
   * within the directory
   */
  public static set(key: string, value: any): void {
    Injector.directory[key] = value;
  }
  /**
   * @method get
   * @description Returns a value from the directory
   * using given key.
   */
  public static get<T>(key: string): T {
    return Injector.directory[key];
  }
}
