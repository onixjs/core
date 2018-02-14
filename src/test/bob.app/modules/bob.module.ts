import {Module} from '../../../index';
import {BobComponent} from './bob.component';
/**
 * @class BobModule
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This demo module is for testing
 * purposes. It contains Bob related components
 */
@Module({
  models: [],
  services: [],
  components: [BobComponent],
})
export class BobModule {}
