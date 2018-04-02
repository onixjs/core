import {BobModule} from './modules/bob.module';
import {Application, SOAService} from '../../src/index';
/**
 * @class BobApp
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This example app is used as example
 * and for testing purposes. It imports a BobModule
 */
@SOAService({
  port: 3001,
  modules: [BobModule],
})
export class BobApp extends Application {}
