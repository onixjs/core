import {BobModule} from './modules/bob.module';
import {Application, MicroService} from '../../src/index';
/**
 * @class BobApp
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This example app is used as example
 * and for testing purposes. It imports a BobModule
 */
@MicroService({
  host: '127.0.0.1',
  port: 3001,
  modules: [BobModule],
})
export class BobApp extends Application {}
