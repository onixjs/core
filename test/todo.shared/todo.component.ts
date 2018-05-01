import {IComponent} from '../../src/index';
import {TodoService} from './todo.service';
import {TodoModel} from './todo.model';
import {Component} from '../../src/decorators/component';
import {Inject} from '../../src/decorators/inject';
import {RPC, Stream} from '../../src/decorators';
import {EventEmitter} from 'events';
import {AllowEveryone} from '../../src/core/acl.everyone';
/**
 * @class TodoComponent
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This class is an example of how to
 * declare components for your application.
 *
 * It must implement the IComponent interface.
 */
@Component({
  // add acl rules
  acl: [AllowEveryone],
  // Optional component level lifecycle
  // will execute on every RPC Call, do your magic here. :)
  lifecycle: async (app, metadata, method): Promise<any> => {
    // before call
    const result = await method();
    // after call
    return result;
  },
})
export class TodoComponent implements IComponent {
  private emmiter = new EventEmitter();
  /**
   * @property service
   * @description This is a dependency injection example.
   * Here we inject a singleton instance of TodoService.
   */
  @Inject.Service(TodoService) private service: TodoService;
  /**
   * @method init
   * @description Any injected reference will be guaranteed
   * after the init method has been executed.
   */
  init() {}
  /**
   * @method addTodo
   * @param todo
   * @returns Promise<TodoModel>
   * @description Example method of how to expose through
   * RPC methods that internally might add business logic
   * or database/services calls.
   */
  @RPC()
  async addTodo(todo: TodoModel): Promise<TodoModel> {
    const result = await this.service.create(todo);
    this.emmiter.emit('onCreate', result);
    return result;
  }
  /**
   * @method onCreate
   * @param todo
   * @returns Promise<TodoModel>
   * @description Example method of how to fetch data and
   * expose it through RPC methods..
   */
  @Stream()
  async onCreate(stream) {
    this.emmiter.on('onCreate', todo => {
      stream(todo);
    });
  }
  /**
   * @method getTodo
   * @param todo
   * @returns Promise<TodoModel>
   * @description Example method of how to fetch data and
   * expose it through RPC methods..
   */
  @RPC()
  async getTodos(): Promise<TodoModel[]> {
    return this.service.find();
  }
  /**
   * @method destroy
   * @param todo
   * @description Destroy method will be executed before terminating
   * an application process.
   */
  destroy() {}
}
