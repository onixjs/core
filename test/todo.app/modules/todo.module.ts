import {Module} from '../../../src/index';
import {TodoComponent} from './todo.component';
import {TodoModel} from './todo.model';
import {TodoService} from './todo.service';
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
  components: [TodoComponent],
  lifecycle: async (app, metadata, method): Promise<any> => {
    console.log('I could be doing some authentication here');
    // before call
    const result = await method();
    // after call
    return result;
  },
})
export class TodoModule {}
