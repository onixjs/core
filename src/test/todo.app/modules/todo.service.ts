import {Inject} from '../../../index';
import {Model} from 'mongoose';
import {TodoModel} from './todo.model';

export class TodoService {
  @Inject(TodoModel) private model: Model<any>;

  async create(todo: TodoModel): Promise<TodoModel> {
    return this.model.create(todo);
  }

  async find(): Promise<TodoModel[]> {
    return this.model.find();
  }
}
