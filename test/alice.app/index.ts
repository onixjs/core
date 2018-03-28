import {AliceModule} from './modules/alice.module';
import {Application, MicroService} from '../../src/index';
/**
 * @class AliceApp
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This example app is used as example
 * and for testing purposes. It imports a AliceModule
 */
@MicroService({
  port: 3001,
  modules: [AliceModule],
})
export class AliceApp extends Application {}
