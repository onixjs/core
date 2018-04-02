import {TodoModule} from '../todo.shared/todo.module';
import {SOAService, Application} from '../../src/index';
/**
 * @class TodoApp
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This example app is used as example
 * and for testing purposes. It imports a TodoModule.
 */
@SOAService({
  port: 8079,
  modules: [TodoModule],
})
export class TodoApp extends Application {}
