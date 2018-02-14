import {TodoModule} from './modules/todo.module';
import {Gateway, Application} from '../../index';
/**
 * @class TodoApp
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This example app is used as example
 * and for testing purposes. It imports a TodoModule.
 */
@Gateway({
  host: '127.0.0.1',
  port: Math.floor(Math.random() * 4000) + 3000,
  modules: [TodoModule],
})
export class TodoApp extends Application {}
