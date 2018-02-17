import {IComponent, Inject} from '../../../index';
import {TodoService} from './todo.service';
import {TodoModel} from './todo.model';
import {Component} from '../../../decorators/component';
import {TodoComponentACL} from './todo.acl';
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
  // Required ACL Rules
  ACL: TodoComponentACL,
  // Optional component level lifecycle
  // will execute on every RPC Call, do your magic here. :)
  lifecycle: async (app, metadata, method): Promise<any> => {
    // before call
    const result = await method();
    // after call
    console.log('Custom Logger: ', result);
    return result;
  },
})
export class TodoComponent implements IComponent {
  /**
   * @property service
   * @description This is a dependency injection example.
   * Here we inject a singleton instance of TodoService.
   */
  @Inject(TodoService) private service: TodoService;
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
  async addTodo(todo: TodoModel): Promise<TodoModel> {
    return this.service.create(todo);
  }
  /**
   * @method getTodo
   * @param todo
   * @returns Promise<TodoModel>
   * @description Example method of how to fetch data and
   * expose it through RPC methods..
   */
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
