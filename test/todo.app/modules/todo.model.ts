import {MongooseDatasource} from './mongoose.datasource';
import {Model, IModel} from '../../../src/index';
import {Property} from '../../../src/decorators';
/**
 * @class TodoModel
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This is an example of how to define and
 * register models for an application.
 *
 * Models are injected in a module context, trying to inject
 * a model within another app or module won't be possible,
 * unless it's also installed in that other module.
 */
@Model({
  // Datasource (Required): Any datasource you create
  datasource: MongooseDatasource,
})
export class TodoModel implements IModel {
  // _id is created from mongo, no need to decorate it.
  _id?: string;
  // Same as the schema but this will be used when creating
  // New instances of the TodoModel Class
  @Property(String) text: String;
}
