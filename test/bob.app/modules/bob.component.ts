import {IComponent} from '../../../src/index';
/**
 * @class BobComponent
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This class provides with functionality
 * for testing purposes, storing Bob objects in memory.
 */
export class BobComponent implements IComponent {
  init() {
    console.log('Bob Component is Alive');
  }
  destroy() {}
}
