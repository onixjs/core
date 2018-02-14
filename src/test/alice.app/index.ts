import {AliceModule} from './modules/alice.module';
import {Application, Gateway} from '../../index';
/**
 * @class AliceApp
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This example app is used as example
 * and for testing purposes. It imports a AliceModule
 */
@Gateway({
  host: '127.0.0.1',
  port: 3001,
  modules: [AliceModule],
})
export class AliceApp extends Application {}
