import {Module} from '../../src/index';
import {TodoComponent} from './todo.component';
import {TodoModel} from './todo.model';
import {TodoService} from './todo.service';
import {ModelProvider, OnixMethod} from '../../src/interfaces';
import {OnixMessage} from '@onixjs/sdk';
/**
 * @class TodoModule
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This demo module is for testing
 * purposes. It contains Todo related components
 */
@Module({
  models: [TodoModel],
  services: [TodoService],
  renderers: [],
  components: [TodoComponent],
  lifecycle: async (
    models: ModelProvider,
    message: OnixMessage,
    method: OnixMethod,
  ): Promise<TodoModel> => {
    // Add createdAt for any newly created todo
    if (message.rpc.match(/addTodo/)) {
      // Add Created At
      const date = new Date();
      message.request.payload.createdAt = date.toISOString();
    }
    // before call
    const result = await method();
    // after call
    return result;
  },
})
export class TodoModule {}
