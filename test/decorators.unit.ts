import {test} from 'ava';
import {
  Component,
  IComponentConfig,
  ReflectionKeys,
  DataSource,
  IDataSource,
  Inject,
  Constructor,
  Service,
  Model,
  IMiddleware,
  RouterTypes,
  IModelRegister,
} from '../src';
import {Router} from '../src/decorators/onix.router';
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
    async connect() {
      throw new Error('Method not implemented.');
    }
    async disconnect() {
      throw new Error('Method not implemented.');
    }
    async register(r: IModelRegister): Promise<IModelRegister> {
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
      async connect() {
        throw new Error('Method not implemented.');
      }
      async disconnect() {
        throw new Error('Method not implemented.');
      }
      async register(r: IModelRegister): Promise<IModelRegister> {
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
// Test Router.Get decorator
test('@Router.Get should decorate a get endpoint.', t => {
  const uri: string = 'my-endpoint';
  class MyClass {
    @Router.Get(uri)
    myEndpoint() {}
  }
  const instance: MyClass = new MyClass();
  const config: IMiddleware = Reflect.getMetadata(
    ReflectionKeys.MIDDLEWARE,
    instance,
    'myEndpoint',
  );
  t.truthy(config);
  t.is(config.endpoint, uri);
  t.is(config.method, 'GET');
});
// Test Router.Post decorator
test('@Router.Post should decorate a post endpoint.', t => {
  const uri: string = 'my-endpoint';
  class MyClass {
    @Router.Post(uri)
    myEndpoint() {}
  }
  const instance: MyClass = new MyClass();
  const config: IMiddleware = Reflect.getMetadata(
    ReflectionKeys.MIDDLEWARE,
    instance,
    'myEndpoint',
  );
  t.truthy(config);
  t.is(config.endpoint, uri);
  t.is(config.method, 'POST');
});
// Test Router.Put decorator
test('@Router.Put should decorate a put endpoint.', t => {
  const uri: string = 'my-endpoint';
  class MyClass {
    @Router.Put(uri)
    myEndpoint() {}
  }
  const instance: MyClass = new MyClass();
  const config: IMiddleware = Reflect.getMetadata(
    ReflectionKeys.MIDDLEWARE,
    instance,
    'myEndpoint',
  );
  t.truthy(config);
  t.is(config.endpoint, uri);
  t.is(config.method, 'PUT');
});
// Test Router.Patch decorator
test('@Router.Patch should decorate a patch endpoint.', t => {
  const uri: string = 'my-endpoint';
  class MyClass {
    @Router.Patch(uri)
    myEndpoint() {}
  }
  const instance: MyClass = new MyClass();
  const config: IMiddleware = Reflect.getMetadata(
    ReflectionKeys.MIDDLEWARE,
    instance,
    'myEndpoint',
  );
  t.truthy(config);
  t.is(config.endpoint, uri);
  t.is(config.method, 'PATCH');
});
// Test Router.Delete decorator
test('@Router.Delete should decorate a delete endpoint.', t => {
  const uri: string = 'my-endpoint';
  class MyClass {
    @Router.Delete(uri)
    myEndpoint() {}
  }
  const instance: MyClass = new MyClass();
  const config: IMiddleware = Reflect.getMetadata(
    ReflectionKeys.MIDDLEWARE,
    instance,
    'myEndpoint',
  );
  t.truthy(config);
  t.is(config.endpoint, uri);
  t.is(config.method, 'DELETE');
});
// Test Router.Delete decorator
test('@RPC Method should be decorated.', t => {
  class MyClass {
    @RPC()
    myRPC() {}
    init() {}
    destroy() {}
  }
  const instance: MyClass = new MyClass();
  const enabled: boolean = Reflect.getMetadata(
    ReflectionKeys.RPC_METHOD,
    instance,
    'myRPC',
  );
  t.true(enabled);
});
// Test Router.Delete decorator
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

// Test Router.All decorator
test('@Router.All Method should be decorated.', t => {
  class MyClass {
    @Router.All()
    myAll() {}
  }
  const instance: MyClass = new MyClass();
  const enabled: IMiddleware = Reflect.getMetadata(
    ReflectionKeys.MIDDLEWARE,
    instance,
    'myAll',
  );
  t.is(enabled.type, RouterTypes.ALL);
});

// Test Router.Use decorator
test('@Router.Use Method should be decorated.', t => {
  class MyClass {
    @Router.Use()
    myUse() {}
  }
  const instance: MyClass = new MyClass();
  const enabled: IMiddleware = Reflect.getMetadata(
    ReflectionKeys.MIDDLEWARE,
    instance,
    'myUse',
  );
  t.is(enabled.type, RouterTypes.USE);
});

// Test Router.Head decorator
test('@Router.Head Method should be decorated.', t => {
  class MyClass {
    @Router.Head()
    myHead() {}
  }
  const instance: MyClass = new MyClass();
  const enabled: IMiddleware = Reflect.getMetadata(
    ReflectionKeys.MIDDLEWARE,
    instance,
    'myHead',
  );
  t.is(enabled.type, RouterTypes.HTTP);
});
