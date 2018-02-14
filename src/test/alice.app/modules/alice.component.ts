import {IComponent} from '../../../index';
/**
 * @class AliceComponent
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This class provides with functionality
 * for testing purposes, storing Alice objects in memory.
 */
export class AliceComponent implements IComponent {
  init() {
    console.log('Bob Component is Alive');
  }
  destroy() {
    throw new Error('Method not implemented.');
  }
}
