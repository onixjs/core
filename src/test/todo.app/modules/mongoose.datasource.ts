import {Mongoose} from 'mongoose';
import {IDataSource, DataSource, IModel} from '../../../index';

@DataSource()
export class MongooseDatasource implements IDataSource {
  private mongoose: Mongoose = new Mongoose();

  async connect(): Promise<Mongoose> {
    return this.mongoose.connect(
      'mongodb://lb-sdk-test:lb-sdk-test@ds153400.mlab.com:53400/heroku_pmkjxjwz',
    );
  }

  async disconnect(): Promise<void> {
    return this.mongoose.disconnect();
  }

  register(name: string, model: IModel): any {
    return this.mongoose.model(name, model.schema());
  }
}
