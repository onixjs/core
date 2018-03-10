import {TodoModule} from './modules/todo.module';
import {MicroService, Application} from '../../src/index';
/**
 * @class TodoApp
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This example app is used as example
 * and for testing purposes. It imports a TodoModule.
 */
@MicroService({
  host: '127.0.0.1',
  port: 8080,
  modules: [TodoModule],
})
export class TodoApp extends Application {}
