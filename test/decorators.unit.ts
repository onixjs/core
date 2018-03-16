import {test} from 'ava';
import {
  Component,
  IComponentConfig,
  ReflectionKeys,
  DataSource,
  IDataSource,
  IModel,
  Inject,
  Constructor,
  Service,
  Model,
  IRESTConfig,
} from '../src';
import {REST} from '../src/decorators/rest';
import {RPC} from '../src/decorators/rpc';
import {Stream} from '../src/decorators';
// Test component decorator
test('@Component decorator should define config metadata.', t => {
  @Component({
    lifecycle: async (app, metadata, method): Promise<any> => null,
  })
  class MyComponent {}
  const instance: MyComponent = new MyComponent();
  const config: IComponentConfig = Reflect.getMetadata(
    ReflectionKeys.COMPONENT_CONFIG,
    instance,
  );
  t.truthy(config.lifecycle);
});
// Test datasource decorator
test('@Datasource decorator should define config metadata.', t => {
  @DataSource()
  class MyDataSource implements IDataSource {
    connect(): void {
      throw new Error('Method not implemented.');
    }
    disconnect(): void {
      throw new Error('Method not implemented.');
    }
    register(name: string, model: any, schema: IModel) {
      throw new Error('Method not implemented.');
    }
  }
  const instance: MyDataSource = new MyDataSource();
  const enabled: boolean = Reflect.getMetadata(
    ReflectionKeys.INJECTABLE_DATASOURCE,
    instance,
  );
  t.true(enabled);
});
// Test invalid datasource
test('@Datasource not implemented should fail.', t => {
  class MyDataSource {}
  const instance: MyDataSource = new MyDataSource();
  const enabled: boolean = Reflect.getMetadata(
    ReflectionKeys.INJECTABLE_DATASOURCE,
    instance,
  );
  t.falsy(enabled);
});
// Test InjectService decorator
test('@InjectService decorator should request an injection.', t => {
  const type: string = 'service';
  @Service()
  class MyService {}
  class MyComponent {
    @Inject.Service(MyService) service: MyService;
  }
  const instance: MyComponent = new MyComponent();
  const config: {type: string; class: Constructor} = Reflect.getMetadata(
    ReflectionKeys.INJECT_REQUEST,
    instance,
    type,
  );
  t.is(config.type, type);
});
// Test InjectService decorator
test('@InjectService decorator should fail while injecting invalid classes.', async t => {
  const error = await t.throws(
    new Promise(() => {
      class MyService {}
      class MyComponent {
        @Inject.Service(MyService) service: MyService;
      }
      new MyComponent();
    }),
  );
  t.is(
    error.message,
    'ONIXJS Error: Invalid injectable service class MyService, it is not a valid service.',
  );
});
// Test InjectModel decorator
test('@InjectModel decorator should request an injection.', t => {
  const type: string = 'model';
  @Model({
    datasource: class DummyDS implements IDataSource {
      connect(): void {
        throw new Error('Method not implemented.');
      }
      disconnect(): void {
        throw new Error('Method not implemented.');
      }
      register(name: string, model: any, schema: IModel) {
        throw new Error('Method not implemented.');
      }
    },
  })
  class MyModel {}
  class MyComponent {
    @Inject.Model(MyModel) model: MyModel;
  }
  const instance: MyComponent = new MyComponent();
  const config: {type: string; class: Constructor} = Reflect.getMetadata(
    ReflectionKeys.INJECT_REQUEST,
    instance,
    type,
  );
  t.is(config.type, type);
});
// Test InjectModel decorator
test('@InjectModel decorator should fail while injecting invalid classes.', async t => {
  const error = await t.throws(
    new Promise(() => {
      class MyModel {}
      class MyComponent {
        @Inject.Model(MyModel) model: MyModel;
      }
      new MyComponent();
    }),
  );
  t.is(
    error.message,
    'ONIXJS Error: Invalid injectable model class MyModel, it is not a valid model.',
  );
});
// Test Rest.Get decorator
test('@REST.Get should decorate a get endpoint.', t => {
  const uri: string = 'my-endpoint';
  class MyClass {
    @REST.Get({uri, args: []})
    myEndpoint() {}
  }
  const instance: MyClass = new MyClass();
  const config: IRESTConfig = Reflect.getMetadata(
    ReflectionKeys.REST_METHOD,
    instance,
    'myEndpoint',
  );
  t.truthy(config);
  t.is(config.uri, uri);
  t.is(config.method, 'GET');
});
// Test Rest.Post decorator
test('@REST.Post should decorate a post endpoint.', t => {
  const uri: string = 'my-endpoint';
  class MyClass {
    @REST.Post({uri, args: []})
    myEndpoint() {}
  }
  const instance: MyClass = new MyClass();
  const config: IRESTConfig = Reflect.getMetadata(
    ReflectionKeys.REST_METHOD,
    instance,
    'myEndpoint',
  );
  t.truthy(config);
  t.is(config.uri, uri);
  t.is(config.method, 'POST');
});
// Test Rest.Put decorator
test('@REST.Put should decorate a put endpoint.', t => {
  const uri: string = 'my-endpoint';
  class MyClass {
    @REST.Put({uri, args: []})
    myEndpoint() {}
  }
  const instance: MyClass = new MyClass();
  const config: IRESTConfig = Reflect.getMetadata(
    ReflectionKeys.REST_METHOD,
    instance,
    'myEndpoint',
  );
  t.truthy(config);
  t.is(config.uri, uri);
  t.is(config.method, 'PUT');
});
// Test Rest.Patch decorator
test('@REST.Patch should decorate a patch endpoint.', t => {
  const uri: string = 'my-endpoint';
  class MyClass {
    @REST.Patch({uri, args: []})
    myEndpoint() {}
  }
  const instance: MyClass = new MyClass();
  const config: IRESTConfig = Reflect.getMetadata(
    ReflectionKeys.REST_METHOD,
    instance,
    'myEndpoint',
  );
  t.truthy(config);
  t.is(config.uri, uri);
  t.is(config.method, 'PATCH');
});
// Test Rest.Delete decorator
test('@REST.Delete should decorate a delete endpoint.', t => {
  const uri: string = 'my-endpoint';
  class MyClass {
    @REST.Delete({uri, args: []})
    myEndpoint() {}
  }
  const instance: MyClass = new MyClass();
  const config: IRESTConfig = Reflect.getMetadata(
    ReflectionKeys.REST_METHOD,
    instance,
    'myEndpoint',
  );
  t.truthy(config);
  t.is(config.uri, uri);
  t.is(config.method, 'DELETE');
});
// Test Rest.Delete decorator
test('@RPC Method should be decorated.', t => {
  class MyClass {
    @RPC()
    myRPC() {}
  }
  const instance: MyClass = new MyClass();
  const enabled: boolean = Reflect.getMetadata(
    ReflectionKeys.RPC_METHOD,
    instance,
    'myRPC',
  );
  t.true(enabled);
});
// Test Rest.Delete decorator
test('@Stream Method should be decorated.', t => {
  class MyClass {
    @Stream()
    myStream() {}
  }
  const instance: MyClass = new MyClass();
  const enabled: boolean = Reflect.getMetadata(
    ReflectionKeys.STREAM_METHOD,
    instance,
    'myStream',
  );
  t.true(enabled);
});
