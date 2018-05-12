import {
  IComponent,
  RPC,
  Stream,
  Component,
  AllowEveryone,
} from '../../../src/index';
/**
 * @class AliceComponent
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This class provides with functionality
 * for testing purposes, storing Alice objects in memory.
 */
@Component({
  acl: [AllowEveryone],
})
export class AliceComponent implements IComponent {
  init() {}
  destroy() {}

  @RPC()
  callMe(payload) {
    return payload;
  }

  @Stream()
  streamMe(stream) {
    stream('Hello Connected World');
  }
}
