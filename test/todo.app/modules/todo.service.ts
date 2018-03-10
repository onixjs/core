import {Inject} from '../../../src/index';
import {Model} from 'mongoose';
import {TodoModel} from './todo.model';
/**
 * @class TodoService
 * @author Jonathan Casarrubias
 * @license MIT
 * @description Example class that explains how to create
 * module level injectable services.
 *
 * Injectable services won't be directly accessible from
 * other modules or applications
 */
export class TodoService {
  /**
   * @property model
   * @description This is a dependency injection example.
   * Here we inject a singleton instance of TodoModel.
   *
   * Models and Services are injectables either from
   * Components or other Services, but are not exposed
   * through the RPC API as the component methods does.
   */
  @Inject(TodoModel) private model: Model<any>;
  /**
   * @method create
   * @param todo
   * @returns Promise<TodoModel>
   * @description Example method of a service providing access
   * to a model method. Technically the model could be directly
   * injected within a component, but doing it within a service
   * allows to re-use these methods within different components.
   */
  async create(todo: TodoModel): Promise<TodoModel> {
    return this.model.create(todo);
  }
  /**
   * @method find
   * @returns Promise<TodoModel>
   * @description Example method of a service providing access
   * to a model method.
   */
  async find(): Promise<TodoModel[]> {
    return this.model.find();
  }
}
