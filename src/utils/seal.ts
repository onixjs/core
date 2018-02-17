import {Constructor} from '../index';

export function seal(Class: Constructor) {
  Object.seal(Class);
  Object.seal(Class.prototype);
}
