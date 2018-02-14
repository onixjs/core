import {IComponent, Inject} from '../../../index';
import {TodoService} from './todo.service';
import {TodoModel} from './todo.model';

/**
 * @class TodoComponent
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This class provides with functionality
 * for testing purposes, storing todo objects in memory.
 */

export class TodoComponent implements IComponent {
  @Inject(TodoService) private service: TodoService;

  init() {}

  async addTodo(todo: TodoModel): Promise<TodoModel> {
    return this.service.create(todo);
  }

  async getTodos(): Promise<TodoModel[]> {
    return this.service.find();
  }

  destroy() {}
}
