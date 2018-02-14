import {MongooseDatasource} from './mongoose.datasource';
import {Model, IModel} from '../../../index';
import {Schema} from 'mongoose';

@Model(MongooseDatasource)
export class TodoModel implements IModel {
  text: String;

  schema(): Schema {
    return new Schema({text: String});
  }
}
