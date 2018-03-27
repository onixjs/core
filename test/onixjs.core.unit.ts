import {test} from 'ava';
import {AppServer} from '../src/core/app.server';
import {Application} from '../src/core/app';
import {AppFactory} from '../src/core/app.factory';
import {
  OnixJS,
  IRequest,
  RPC,
  Stream,
  Module,
  OperationType,
  IAppOperation,
  Component,
  ClientConnection,
  OnixMessage,
  HostBoot,
  Injector,
  Service,
  Inject,
  DataSource,
  IDataSource,
  IModel,
  Model,
  Property,
  LifeCycle,
  IApp,
  IModuleDirectory,
  HTTPServer,
  HTTPMethods,
} from '../src';
import * as path from 'path';
import {CallResponser} from '../src/core/call.responser';
import * as WebSocket from 'uws';
import {CallStreamer} from '../src/core/call.streamer';
import {NodeJS} from '@onixjs/sdk/dist/core/node.adapters';
import {Utils} from '@onixjs/sdk/dist/utils';
import {Mongoose, Schema, Model as MongooseModel} from 'mongoose';
const cwd = path.join(process.cwd(), 'dist', 'test');
// Test AppFactory
test('Core: AppFactory creates an Application.', async t => {
  class MyApp extends Application {}
  const instance: AppFactory = new AppFactory(MyApp, {modules: []});
  t.truthy(instance.app.start);
  t.truthy(instance.app.stop);
  t.truthy(instance.app.isAlive);
  t.truthy(instance.app.modules);
});
// Test AppFactory
test('Core: AppFactory fails on installing invalid module.', async t => {
  const error = await t.throws(
    new Promise(() => {
      class MyModule {}
      class MyApp extends Application {}
      new AppFactory(MyApp, {modules: [MyModule]});
    }),
  );
  t.is(
    error.message,
    'OnixJS: Invalid Module "MyModule", it must provide a module config ({ models: [], services: [], components: [] })',
  );
});
// OnixJS loads duplicated apps
test('Core: OnixJS loads creates duplicated Application.', async t => {
  const onix: OnixJS = new OnixJS({
    cwd: path.join(process.cwd(), 'dist', 'test'),
    port: 8086,
  });
  await onix.load('TodoApp@todo.app:disabled');
  const error = await t.throws(onix.load('TodoApp@todo.app:disabled'));
  t.is(error.message, 'OnixJS Error: Trying to add duplicated application');
});
// Test OnixJS ping missing app
test('Core: OnixJS pings missing Application.', async t => {
  const onix: OnixJS = new OnixJS({
    cwd: path.join(process.cwd(), 'dist', 'test'),
    port: 9091,
  });
  const error = await t.throws(onix.ping('MissingApp'));
  t.is(
    error.message,
    'OnixJS Error: Trying to ping unexisting app "MissingApp".',
  );
});
// Test OnixJS
test('Core: OnixJS fails on coordinating invalid callee.', async t => {
  const onix: OnixJS = new OnixJS({
    cwd: path.join(process.cwd(), 'dist', 'test'),
    port: 8088,
  });
  const error = await t.throws(
    onix.coordinate('Dummy.call', <IRequest>{metadata: {}, payload: {}}),
  );
  t.is(error.message, 'Unable to find callee application');
});
// Test OnixJS Apps getter
test('Core: OnixJS gets list of apps.', async t => {
  const onix: OnixJS = new OnixJS({
    cwd: path.join(process.cwd(), 'dist', 'test'),
    port: 8089,
  });
  await onix.load('TodoApp@todo.app:disabled');
  const apps = onix.apps();
  t.is(Object.keys(apps).length, 1);
});
// Test OnixJS Schema builder
test('Core: OnixJS schema builder.', async t => {
  class MyComponent {
    @RPC()
    testRPC() {}
    @Stream()
    testSTREAM() {}
  }
  @Module({
    models: [],
    services: [],
    components: [MyComponent],
  })
  class MyModule {}
  class MyApp extends Application {}
  const instance: AppFactory = new AppFactory(MyApp, {modules: [MyModule]});
  const schema = instance.schema();
  t.truthy(schema.modules.MyModule);
});
// Test CallResponser invalid call
test('Core: CallResponser invalid call.', async t => {
  class MyComponent {
    @RPC()
    testRPC() {}
    @Stream()
    testSTREAM() {}
  }
  @Module({
    models: [],
    services: [],
    components: [MyComponent],
  })
  class MyModule {}
  class MyApp extends Application {}
  const factory: AppFactory = new AppFactory(MyApp, {
    disableNetwork: true,
    modules: [MyModule],
  });
  const responser: CallResponser = new CallResponser(factory, MyApp);
  const error = await t.throws(
    responser.process({
      uuid: '1',
      rpc: 'something.really.weird.to.call.which.is.invalid',
      request: <IRequest>{},
    }),
  );
  t.is(
    error.message,
    'OnixJS Error: RPC Call is invalid "something.really.weird.to.call.which.is.invalid"',
  );
});
// Test CallResponser invalid call
test('Core: CallResponser invalid call.', async t => {
  class MyComponent {
    @RPC()
    testRPC() {}
    @Stream()
    testSTREAM() {}
  }
  @Module({
    models: [],
    services: [],
    components: [MyComponent],
  })
  class MyModule {}
  class MyApp extends Application {}
  const factory: AppFactory = new AppFactory(MyApp, {
    disableNetwork: true,
    modules: [MyModule],
  });
  const responser: CallResponser = new CallResponser(factory, MyApp);
  const error = await t.throws(
    responser.process({
      uuid: '1',
      rpc: 'MyApp.MyModule.MyComponent.NotExistingMethod',
      request: <IRequest>{},
    }),
  );
  t.is(
    error.message,
    'OnixJS Error: RPC Call is invalid "MyApp.MyModule.MyComponent.NotExistingMethod"',
  );
});
// Test CallResponser invalid call
test('Core: CallResponser invalid call.', async t => {
  class MyComponent {
    @RPC()
    testRPC() {}
    @Stream()
    testSTREAM() {}
  }
  @Module({
    models: [],
    services: [],
    components: [MyComponent],
  })
  class MyModule {}
  class MyApp extends Application {}
  const factory: AppFactory = new AppFactory(MyApp, {
    disableNetwork: true,
    modules: [MyModule],
  });
  const responser: CallResponser = new CallResponser(factory, MyApp);
  const error = await t.throws(
    responser.process({
      uuid: '1',
      rpc: 'MyApp.MyModule.MyComponent.NotExistingMethod',
      request: <IRequest>{},
    }),
  );
  t.is(
    error.message,
    'OnixJS Error: RPC Call is invalid "MyApp.MyModule.MyComponent.NotExistingMethod"',
  );
});
// Test CallResponser Hooks
test('Core: CallResponser Hooks.', async t => {
  @Component({
    lifecycle: async function(app, metadata, method) {
      const methodResult = await method();
      return methodResult;
    },
  })
  class MyComponent {
    @RPC()
    test(payload) {
      return payload;
    }
  }
  @Module({
    models: [],
    services: [],
    components: [MyComponent],
  })
  class MyModule {}
  class MyApp extends Application {}
  const factory: AppFactory = new AppFactory(MyApp, {
    disableNetwork: true,
    modules: [MyModule],
  });
  const responser: CallResponser = new CallResponser(factory, MyApp);
  const result = await responser.process({
    uuid: '1',
    rpc: 'MyApp.MyModule.MyComponent.test',
    request: <IRequest>{
      metadata: {stream: false},
      payload: {
        text: 'Hello Responser',
      },
    },
  });
  t.is(result.text, 'Hello Responser');
});

// Test CallResponser Hooks
test('Core: CallResponser Hooks.', async t => {
  @Component({
    lifecycle: async function(app, metadata, method) {
      const methodResult = await method();
      return methodResult;
    },
  })
  class MyComponent {
    @Stream()
    test(stream) {
      return stream({
        text: 'Hello Streamer',
      });
    }
  }
  @Module({
    models: [],
    services: [],
    components: [MyComponent],
  })
  class MyModule {}
  class MyApp extends Application {}
  const factory: AppFactory = new AppFactory(MyApp, {
    disableNetwork: true,
    modules: [MyModule],
  });
  const streamer: CallStreamer = new CallStreamer(factory, MyApp);
  streamer.register(
    {
      uuid: '1',
      rpc: 'MyApp.MyModule.MyComponent.test',
      request: <IRequest>{
        metadata: {stream: true},
        payload: {},
      },
    },
    result => {
      t.is(result.text, 'Hello Streamer');
    },
  );
});

// Test CallStreamer invalid call
test('Core: CallStreamer invalid call.', async t => {
  class MyComponent {}
  @Module({
    models: [],
    services: [],
    components: [MyComponent],
  })
  class MyModule {}
  class MyApp extends Application {}
  const factory: AppFactory = new AppFactory(MyApp, {
    disableNetwork: true,
    modules: [MyModule],
  });
  const streamer: CallStreamer = new CallStreamer(factory, MyApp);
  streamer.register(
    {
      uuid: '1',
      rpc: 'MyApp.MyModule.MyComponent.invalid.method.rpc.call',
      request: <IRequest>{},
    },
    result => {
      t.is(
        result.message,
        'OnixJS Error: RPC Call is invalid "MyApp.MyModule.MyComponent.invalid.method.rpc.call"',
      );
    },
  );
});
// Test AppServer invalid operation
test('Core: AppServer invalid operation.', async t => {
  class MyApp extends Application {}
  const appServer: AppServer = new AppServer(MyApp, {
    host: '127.0.0.1',
    port: 8090,
    modules: [],
  });
  // Start App
  await appServer.operation({
    uuid: '2',
    type: OperationType.APP_CREATE,
    message: '',
  });
  // Start websocket server
  await appServer.operation({
    uuid: '2',
    type: OperationType.APP_START,
    message: '',
  });
  // Connect to the application websocket server
  const client: WebSocket = new WebSocket('ws://127.0.0.1:8090');
  // Send remote call through websockets
  client.on('message', async data => {
    if (Utils.IsJsonString(data)) {
      const operation: IAppOperation = JSON.parse(data);
      t.is(operation.message, 'welcome');
      await appServer.operation({
        uuid: '2',
        type: OperationType.APP_STOP,
        message: '',
      });
    }
  });
});
// Test Application start and stop
test('Core: Application start and stop.', async t => {
  class MyComponent {
    init() {}
    destroy() {}
  }
  @Module({
    models: [],
    services: [],
    components: [MyComponent],
  })
  class MyModule {}
  class MyApp extends Application {}
  const appInstance: MyApp = new MyApp();
  appInstance.modules[MyModule.name] = new MyModule();
  appInstance.modules[MyModule.name][MyComponent.name] = new MyComponent();
  const startResult: boolean = await appInstance.start();
  const stopResult: boolean = await appInstance.stop();
  t.true(startResult);
  t.true(stopResult);
});
// Test Connection
test('Core: Connection.', async t => {
  const payload = {hello: 'connection...'};
  @Component({
    lifecycle: async function(app, metadata, method) {
      console.log('SAVING CONNECTION TEST');
      const methodResult = await method();
      return methodResult;
    },
  })
  class MyComponent {
    @RPC()
    testRPC(data) {
      return data;
    }
    @Stream()
    testStream(stream) {
      return stream(payload);
    }
  }
  @Module({
    models: [],
    services: [],
    components: [MyComponent],
  })
  class MyModule {}
  class MyApp extends Application {}
  const factory: AppFactory = new AppFactory(MyApp, {
    disableNetwork: true,
    modules: [MyModule],
  });
  // Create websocket server
  const server = new WebSocket.Server({host: '127.0.0.1', port: 9090}, () => {
    const responser = new CallResponser(factory, MyApp);
    const streamer = new CallStreamer(factory, MyApp);
    // Wait for client connections
    server.on('connection', async (ws: WebSocket) => {
      ws.send(<IAppOperation>{
        type: OperationType.APP_PING_RESPONSE,
      });
      // Create a new Client Connection
      const connection = new ClientConnection(ws, responser, streamer);
      // Handle RPC Call
      await connection.handle(<OnixMessage>{
        rpc: 'MyApp.MyModule.MyComponent.testRPC',
        request: <IRequest>{
          metadata: {stream: false, caller: 'tester', token: 'dummytoken'},
          payload,
        },
      });
      // Handle Stream
      await connection.handle(<OnixMessage>{
        rpc: 'MyApp.MyModule.MyComponent.testStream',
        request: <IRequest>{
          metadata: {stream: true, caller: 'tester', token: 'dummytoken'},
          payload,
        },
      });
    });
    // Create Client
    const client: WebSocket = new WebSocket('ws://127.0.0.1:9090');
    // Create Listeners
    client.on('message', (data: string) => {
      if (Utils.IsJsonString(data)) {
        const rpcOp: IAppOperation = JSON.parse(data);
        if (rpcOp.type === OperationType.ONIX_REMOTE_CALL_PROCEDURE_RESPONSE) {
          t.is(payload.hello, rpcOp.message.hello);
        }
        const streamOp: IAppOperation = JSON.parse(data);
        if (streamOp.type === OperationType.ONIX_REMOTE_CALL_STREAM) {
          t.is(payload.hello, streamOp.message.hello);
        }
      }
    });
  });
});
// Test host boot
test('Core: host boot.', async t => {
  const host: HostBoot = new HostBoot(
    {
      apps: ['TodoApp@todo.app:8076'],
    },
    {cwd},
  );
  await t.notThrows(host.run());
});
// Test host boot throws
test('Core: host boot throws.', async t => {
  const error = await t.throws(
    new Promise(() => {
      new HostBoot(
        {
          apps: [],
        },
        {cwd},
      );
    }),
  );
  t.is(error.message, 'OnixJS: No apps to be loaded');
});
// Test Injector
test('Core: Injector.', async t => {
  const text: string = 'Hello Service';
  const injector: Injector = new Injector();
  // Create Injectable Service
  @Service()
  class MyService {
    test() {
      return text;
    }
  }
  // Create a component that will inject the service
  class MyComponent {
    @Inject.Service(MyService) service: MyService;
    @Inject.Service(MyService) service2: MyService; // Singleton service
    test(): string {
      return this.service.test();
    }
    test2(): string {
      return this.service2.test();
    }
  }
  // create component instance
  const instance: MyComponent = new MyComponent();
  injector.inject(MyComponent, instance, {
    models: [],
    services: [MyService],
    components: [],
  });
  t.is(instance.test(), text);
  t.is(instance.test2(), text);
});
// Test Injector has, get and set
test('Core: injector has, get and set.', t => {
  const injector: Injector = new Injector();
  const hello = 'world';
  if (!injector.has(hello)) {
    injector.set('hello', hello);
  }
  t.is(injector.get('hello'), hello);
});
// Test Inject Model and Services
test('Core: Inject Model and Services.', async t => {
  // Test Reference
  const criteria: string = 'Hello World';
  // DataSource
  @DataSource()
  class MongooseDatasource implements IDataSource {
    /**
     * @property mongoose
     * @description Mongoose instance reference
     */
    private mongoose: Mongoose = new Mongoose();
    async connect(): Promise<Mongoose> {
      return this.mongoose.connect(
        'mongodb://lb-sdk-test:lb-sdk-test@ds153400.mlab.com:53400/heroku_pmkjxjwz',
      );
    }
    async disconnect(): Promise<void> {
      return this.mongoose.disconnect();
    }
    register(name: string, model: IModel, schema: Schema): any {
      return this.mongoose.model(name, schema);
    }
  }
  // Model
  @Model({
    datasource: MongooseDatasource,
  })
  class TodoModel implements IModel {
    _id?: string;
    @Property(String) text: String;
  }
  // Service
  @Service()
  class TodoService {
    test(): string {
      return criteria;
    }
  }
  // Component
  class TodoComponent {
    @Inject.Model(TodoModel) public model: MongooseModel<any>;
    @Inject.Model(TodoModel) public model2: MongooseModel<any>;
    @Inject.Service(TodoService) public service: TodoService;
    @Inject.Service(TodoService) public service2: TodoService;
  }
  // Inject Model and Service
  const injector: Injector = new Injector();
  const instance: TodoComponent = new TodoComponent();
  injector.inject(TodoComponent, instance, {
    components: [],
    models: [TodoModel],
    services: [TodoService],
  });
  // Test Service
  t.is(instance.service.test(), criteria);
  // Test Model
  const result = await instance.model.create({text: criteria});
  t.truthy(result._id);
  t.is(result.text, criteria);
});
// Test Main Life Cycle
test('Core: main lifecycle.', async t => {
  const result: boolean = true;
  class MyApp implements IApp {
    modules: IModuleDirectory;
    async start(): Promise<boolean> {
      return result;
    }
    async stop(): Promise<boolean> {
      return result;
    }
    isAlive(): boolean {
      return result;
    }
  }
  const instance: MyApp = new MyApp();
  const lifecycle: LifeCycle = new LifeCycle();
  const r1 = await lifecycle.onAppMethodCall(
    instance,
    {
      uuid: '1',
      rpc: 'somerpc',
      request: <IRequest>{
        metadata: {},
        payload: {},
      },
    },
    async () => result,
  );
  const r2 = await lifecycle.onModuleMethodCall(
    instance,
    {
      uuid: '2',
      rpc: 'somerpc',
      request: <IRequest>{
        metadata: {},
        payload: {},
      },
    },
    async () => result,
  );
  const r3 = await lifecycle.onComponentMethodCall(
    instance,
    {
      uuid: '3',
      rpc: 'somerpc',
      request: <IRequest>{
        metadata: {},
        payload: {},
      },
    },
    async () => result,
  );
  t.true(r1);
  t.true(r2);
  t.true(r3);
});
// Test HTTP Methods
test('Core: HTTP Methods.', async t => {
  interface Result {
    hello: string;
  }
  interface HTTPError {
    error: {
      code: number;
    };
  }
  const result: Result = {hello: 'world'};
  const config = {
    host: '127.0.0.1',
    port: 8060,
    path: '/hello-post',
  };
  const server: HTTPServer = new HTTPServer(config);
  // Register middlewares
  server.register(HTTPMethods.GET, '/hello-get', (req, res) => {
    res.end(JSON.stringify(result));
  });
  server.register(HTTPMethods.POST, config.path, (req, res) => {
    res.end(JSON.stringify(req['post']));
  });
  server.register(HTTPMethods.PATCH, '/hello-patch', (req, res) => {
    res.end(JSON.stringify(result));
  });
  server.register(HTTPMethods.PUT, '/hello-put', (req, res) => {
    res.end(JSON.stringify(result));
  });
  server.register(HTTPMethods.DELETE, '/hello-delete', (req, res) => {
    res.end(JSON.stringify(result));
  });
  server.start();
  // Use SDK Client to make calls
  const client: NodeJS.HTTP = new NodeJS.HTTP();
  const getResult: Result = <Result>await client.get(
    `http://${config.host}:${config.port}/hello-get`,
  );
  const getError: HTTPError = <HTTPError>await client.get(
    `http://${config.host}:${config.port}/noexist`,
  );
  const postResult: Result = <Result>await client.post(config, result);
  server.stop();
  t.is(getResult.hello, result.hello);
  t.is(getError.error.code, 404);
  t.is(postResult.hello, result.hello);
});
// Test HTTP WildCard
test('Core: HTTP WildCard.', async t => {
  interface Result {
    hello: string;
  }
  const result: Result = {hello: 'world'};
  const config = {
    host: '127.0.0.1',
    port: 8061,
  };
  const server: HTTPServer = new HTTPServer(config);
  // Register Wildcard middleware
  server.register(HTTPMethods.GET, '*', (req, res) => {
    res.end(JSON.stringify(result));
  });
  server.start();
  // Use SDK Client to make calls
  const client: NodeJS.HTTP = new NodeJS.HTTP();
  const getResult: Result = <Result>await client.get(
    `http://${config.host}:${config.port}/noexist`,
  );
  server.stop();
  t.is(getResult.hello, result.hello);
});
