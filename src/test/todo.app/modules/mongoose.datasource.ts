import {Mongoose, Schema} from 'mongoose';
import {IDataSource, DataSource, IModel} from '../../../index';
/**
 * @class MongooseDatasource
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This is an example datasource that integrates
 * OnixJS with Mongoose.
 */
@DataSource()
export class MongooseDatasource implements IDataSource {
  /**
   * @property mongoose
   * @description Mongoose instance reference
   */
  private mongoose: Mongoose = new Mongoose();
  /**
   * @method connect
   * @description This method should connect the mongoose ORM
   * as described in their documentation
   */
  async connect(): Promise<Mongoose> {
    return this.mongoose.connect(
      'mongodb://lb-sdk-test:lb-sdk-test@ds153400.mlab.com:53400/heroku_pmkjxjwz',
    );
  }
  /**
   * @method disconnect
   * @description This method should disconnect the mongoose ORM
   * as described in their documentation
   */
  async disconnect(): Promise<void> {
    return this.mongoose.disconnect();
  }
  /**
   * @method method
   * @description This method is a system hook that allows you to
   * instantiate your models or schemas according the selected ORM
   * approach. In this case mongoose states that we should pass
   * a JSON schema and a model name in order to get a mongoose
   * model instance.
   */
  register(name: string, model: IModel, schema: Schema): any {
    return this.mongoose.model(name, schema);
  }
}
