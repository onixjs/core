import {Constructable} from '../index';

export function seal(Class: Constructable) {
  Object.seal(Class);
  Object.seal(Class.prototype);
}
