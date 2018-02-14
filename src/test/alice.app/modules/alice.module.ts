import {Module} from '../../../index';
import {AliceComponent} from './alice.component';
/**
 * @class AliceModule
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This demo module is for testing
 * purposes. It contains Alice related components
 */
@Module({
  models: [],
  services: [],
  components: [AliceComponent],
})
export class AliceModule {}
