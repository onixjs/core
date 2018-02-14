import {Module} from '../../../index';
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
})
export class TodoModule {}
