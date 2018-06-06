import {test} from 'ava';
import {Application} from '../src/core/app';
import {AppFactory} from '../src/core/app.factory';
import {AppNotifier} from '../src/core/app.notifier';
import {AppServer} from '../src/core/app.server';
import {
  OnixJS,
  RPC,
  Stream,
  Module,
  Component,
  Service,
  Inject,
  DataSource,
  IDataSource,
  IModel,
  Model,
  Property,
  OnixHTTPRequest,
  IViewRenderer,
  Directory,
  ViewRenderer,
  Router,
  IComponentConfig,
  IACLRule,
  AccessType,
  GroupList,
  ModelProvider,
  OnixMethod,
  IModelRegister,
} from '../src';
import {Groups} from '../src/core/acl.groups';
import {LifeCycle} from '../src/core/lifecycle';
import {Injector} from '../src/core/injector';
import {HostBoot} from '../src/core/host.boot';
import * as path from 'path';
import {CallResponser} from '../src/core/call.responser';
//import * as WebSocket from 'ws';
import * as dot from 'dot';
import {CallStreamer} from '../src/core/call.streamer';
import {NodeJS} from '@onixjs/sdk/dist/adapters/node.adapters';
import {Utils} from '@onixjs/sdk/dist/utils';
import {Mongoose} from 'mongoose';
import {GroupMatch} from '../src/core/acl.group.match';
import {AllowEveryone} from '../src/core/acl.everyone';
import {WSAdapter} from '../src/adapters/ws.adapter';
import {OnixMessage, IRequest, OperationType, IAppOperation} from '@onixjs/sdk';
const cwd = path.join(process.cwd(), 'dist', 'test');

test('Core: AppFactory creates an Application.', async t => {
  class MyApp extends Application {}
  const instance: AppFactory = new AppFactory(MyApp);
  instance.config = {modules: []};
  instance.notifier = new AppNotifier();
  await instance.setup();
  t.truthy(instance.app.start);
  t.truthy(instance.app.stop);
  t.truthy(instance.app.isAlive);
  t.truthy(instance.app.modules);
});

// Test AppFactory
test('Core: AppFactory fails on installing invalid module.', async t => {
  class MyModule {}
  class MyApp extends Application {}
  const instance: AppFactory = new AppFactory(MyApp);
  instance.config = {modules: [MyModule]};
  instance.notifier = new AppNotifier();
  const error = await t.throws(instance.setup());
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
    adapters: {websocket: WSAdapter},
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
    adapters: {websocket: WSAdapter},
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
    adapters: {websocket: WSAdapter},
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
    adapters: {websocket: WSAdapter},
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
    init() {}
    destroy() {}
  }
  @Module({
    models: [],
    renderers: [],
    services: [],
    components: [MyComponent],
  })
  class MyModule {}
  class MyApp extends Application {}
  const instance: AppFactory = new AppFactory(MyApp);
  instance.config = {modules: [MyModule]};
  instance.notifier = new AppNotifier();
  await instance.setup();
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
    init() {}
    destroy() {}
  }
  @Module({
    models: [],
    renderers: [],
    services: [],
    components: [MyComponent],
  })
  class MyModule {}
  class MyApp extends Application {}
  const factory: AppFactory = new AppFactory(MyApp);
  factory.config = {network: {disabled: true}, modules: [MyModule]};
  factory.notifier = new AppNotifier();
  await factory.setup();
  const responser: CallResponser = new CallResponser(factory);
  const error = await t.throws(
    responser.process({
      uuid: Utils.uuid(),
      type: OperationType.ONIX_REMOTE_CALL_PROCEDURE,
      message: {
        rpc: 'something.really.weird.to.call.which.is.invalid',
        request: <IRequest>{},
      },
    }),
  );
  t.is(
    error.message,
    'OnixJS Error: RPC Call is invalid "something.really.weird.to.call.which.is.invalid"',
  );
});
// Test CallResponser not authorized call
test('Core: CallResponser not authorized call.', async t => {
  @Component({})
  class MyComponent {
    @RPC()
    testRPC() {
      return 'ALO WORLD';
    }
    @Stream()
    testSTREAM() {}
    init() {}
    destroy() {}
  }
  @Module({
    models: [],
    renderers: [],
    services: [],
    components: [MyComponent],
  })
  class MyModule {}
  class MyApp extends Application {}
  const factory: AppFactory = new AppFactory(MyApp);
  factory.config = {network: {disabled: true}, modules: [MyModule]};
  factory.notifier = new AppNotifier();
  await factory.setup();
  const responser: CallResponser = new CallResponser(factory);
  const result = await responser.process({
    uuid: Utils.uuid(),
    type: OperationType.ONIX_REMOTE_CALL_PROCEDURE,
    message: {
      rpc: 'MyApp.MyModule.MyComponent.testRPC',
      request: <IRequest>{},
    },
  });
  t.is(result.code, 401);
});
// Test CallResponser valid call
test('Core: CallResponser valid call.', async t => {
  @Component({
    acl: [AllowEveryone],
  })
  class MyComponent {
    @RPC()
    testRPC() {
      return 'ALO WORLD';
    }
    @Stream()
    testSTREAM() {}
    init() {}
    destroy() {}
  }
  @Module({
    models: [],
    renderers: [],
    services: [],
    components: [MyComponent],
  })
  class MyModule {}
  class MyApp extends Application {}
  const factory: AppFactory = new AppFactory(MyApp);
  factory.config = {network: {disabled: true}, modules: [MyModule]};
  factory.notifier = new AppNotifier();
  await factory.setup();
  const responser: CallResponser = new CallResponser(factory);
  const result = await responser.process({
    uuid: Utils.uuid(),
    type: OperationType.ONIX_REMOTE_CALL_PROCEDURE,
    message: {
      rpc: 'MyApp.MyModule.MyComponent.testRPC',
      request: <IRequest>{},
    },
  });
  t.is(result, 'ALO WORLD');
});
// Test CallResponser invalid call
test('Core: CallResponser invalid call.', async t => {
  class MyComponent {
    @RPC()
    testRPC() {}
    @Stream()
    testSTREAM() {}
    init() {}
    destroy() {}
  }
  @Module({
    models: [],
    renderers: [],
    services: [],
    components: [MyComponent],
  })
  class MyModule {}
  class MyApp extends Application {}
  const factory: AppFactory = new AppFactory(MyApp);
  factory.config = {network: {disabled: true}, modules: [MyModule]};
  factory.notifier = new AppNotifier();
  await factory.setup();
  const responser: CallResponser = new CallResponser(factory);
  const error = await t.throws(
    responser.process({
      uuid: Utils.uuid(),
      type: OperationType.ONIX_REMOTE_CALL_PROCEDURE,
      message: {
        rpc: 'MyApp.MyModule.MyComponent.NotExistingMethod',
        request: <IRequest>{},
      },
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
    acl: [AllowEveryone],
    lifecycle: async function(
      models: ModelProvider,
      message: OnixMessage,
      method: OnixMethod,
    ) {
      const methodResult = await method();
      return methodResult;
    },
  })
  class MyComponent {
    @RPC()
    test(payload) {
      return payload;
    }
    init() {}
    destroy() {}
  }
  @Module({
    models: [],
    renderers: [],
    services: [],
    components: [MyComponent],
  })
  class MyModule {}
  class MyApp extends Application {}
  const factory: AppFactory = new AppFactory(MyApp);
  factory.config = {network: {disabled: true}, modules: [MyModule]};
  factory.notifier = new AppNotifier();
  await factory.setup();
  const responser: CallResponser = new CallResponser(factory);
  const uuid: string = Utils.uuid();
  const result = await responser.process({
    uuid,
    type: OperationType.ONIX_REMOTE_CALL_PROCEDURE,
    message: {
      rpc: 'MyApp.MyModule.MyComponent.test',
      request: <IRequest>{
        metadata: {stream: false, subscription: uuid},
        payload: {
          text: 'Hello Responser',
        },
      },
    },
  });
  t.is(result.text, 'Hello Responser');
});
// Test CallStreamer Valid
test('Core: CallStreamer Valid.', async t => {
  @Component({
    acl: [AllowEveryone],
    lifecycle: async function(
      models: ModelProvider,
      message: OnixMessage,
      method: OnixMethod,
    ) {
      const noRealModel = models('NotReal');
      let methodResult;
      if (!noRealModel) {
        methodResult = await method();
      }
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
    renderers: [],
    services: [],
    components: [MyComponent],
    lifecycle: async function(
      models: ModelProvider,
      message: OnixMessage,
      method: OnixMethod,
    ) {
      const noRealModel = models('NotReal');
      let methodResult;
      if (!noRealModel) {
        methodResult = await method();
      }
      return methodResult;
    },
  })
  class MyModule {}
  class MyApp extends Application {}
  const factory: AppFactory = new AppFactory(MyApp);
  factory.config = {network: {disabled: true}, modules: [MyModule]};
  factory.notifier = new AppNotifier();
  await factory.setup();
  const streamer: CallStreamer = new CallStreamer(factory);
  await streamer.register(
    {
      uuid: Utils.uuid(),
      type: OperationType.ONIX_REMOTE_CALL_PROCEDURE,
      message: {
        rpc: 'MyApp.MyModule.MyComponent.test',
        request: <IRequest>{
          metadata: {stream: true},
          payload: {},
        },
      },
    },
    result => {
      if (result) {
        t.is(result.text, 'Hello Streamer');
      }
    },
  );
});

// Test CallStreamer Valid No Hooks
test('Core: CallStreamer Valid No Hooks.', async t => {
  @Component({
    acl: [AllowEveryone],
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
    renderers: [],
    services: [],
    components: [MyComponent],
  })
  class MyModule {}
  class MyApp extends Application {}
  const factory: AppFactory = new AppFactory(MyApp);
  factory.config = {network: {disabled: true}, modules: [MyModule]};
  factory.notifier = new AppNotifier();
  await factory.setup();
  const streamer: CallStreamer = new CallStreamer(factory);
  await streamer.register(
    {
      uuid: Utils.uuid(),
      type: OperationType.ONIX_REMOTE_CALL_PROCEDURE,
      message: {
        rpc: 'MyApp.MyModule.MyComponent.test',
        request: <IRequest>{
          metadata: {stream: true},
          payload: {},
        },
      },
    },
    result => {
      if (result) {
        t.is(result.text, 'Hello Streamer');
      }
    },
  );
});

// Test CallStreamer Not Authorized
test('Core: CallStreamer Not Authorized.', async t => {
  @Component({
    lifecycle: async function(
      models: ModelProvider,
      message: OnixMessage,
      method: OnixMethod,
    ) {
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
    renderers: [],
    services: [],
    components: [MyComponent],
    lifecycle: async function(
      models: ModelProvider,
      message: OnixMessage,
      method: OnixMethod,
    ) {
      const methodResult = await method();
      return methodResult;
    },
  })
  class MyModule {}
  class MyApp extends Application {}
  const factory: AppFactory = new AppFactory(MyApp);
  factory.config = {network: {disabled: true}, modules: [MyModule]};
  factory.notifier = new AppNotifier();
  await factory.setup();
  const streamer: CallStreamer = new CallStreamer(factory);
  await streamer.register(
    {
      uuid: Utils.uuid(),
      type: OperationType.ONIX_REMOTE_CALL_PROCEDURE,
      message: {
        rpc: 'MyApp.MyModule.MyComponent.test',
        request: <IRequest>{
          metadata: {stream: true},
          payload: {},
        },
      },
    },
    result => {
      if (result) {
        t.is(result.code, 401);
      }
    },
  );
});

// Test CallStreamer Not Method Authorized
test('Core: CallStreamer Not Method Authorized.', async t => {
  @Component({
    acl: [
      class AllowSome implements IACLRule {
        // Define methods to be granted
        methods: string[] = ['nomethod'];
        // Define Access Grant
        access: AccessType = AccessType.ALLOW;
        // Define groups with the defined grant
        groups: GroupList = [Groups.Everyone];
      },
    ],
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
    renderers: [],
    services: [],
    components: [MyComponent],
  })
  class MyModule {}
  class MyApp extends Application {}
  const factory: AppFactory = new AppFactory(MyApp);
  factory.config = {network: {disabled: true}, modules: [MyModule]};
  factory.notifier = new AppNotifier();
  await factory.setup();
  const streamer: CallStreamer = new CallStreamer(factory);
  await streamer.register(
    {
      uuid: Utils.uuid(),
      type: OperationType.ONIX_REMOTE_CALL_PROCEDURE,
      message: {
        rpc: 'MyApp.MyModule.MyComponent.test',
        request: <IRequest>{
          metadata: {stream: true},
          payload: {},
        },
      },
    },
    result => {
      if (result) {
        t.is(result.code, 401);
      }
    },
  );
});
// Test CallStreamer invalid call
test('Core: CallStreamer invalid call.', async t => {
  class MyComponent {}
  @Module({
    models: [],
    renderers: [],
    services: [],
    components: [MyComponent],
  })
  class MyModule {}
  class MyApp extends Application {}
  const factory: AppFactory = new AppFactory(MyApp);
  factory.config = {network: {disabled: true}, modules: [MyModule]};
  factory.notifier = new AppNotifier();
  await factory.setup();
  const streamer: CallStreamer = new CallStreamer(factory);
  await streamer.register(
    {
      uuid: Utils.uuid(),
      type: OperationType.ONIX_REMOTE_CALL_PROCEDURE,
      message: {
        rpc: 'MyApp.MyModule.MyComponent.invalid.method.rpc.call',
        request: <IRequest>{},
      },
    },
    result => {
      t.is(
        result.message,
        'OnixJS Error: RPC Call is invalid "MyApp.MyModule.MyComponent.invalid.method.rpc.call"',
      );
    },
  );
});
// Test Application start and stop
test('Core: Application start and stop.', async t => {
  class MyComponent {
    init() {}
    destroy() {}
  }
  @Module({
    models: [],
    renderers: [],
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
// Test host boot
test('Core: host boot.', async t => {
  const instance: HostBoot = new HostBoot(
    {
      apps: ['TodoApp@todo.app:8076'],
    },
    {
      cwd,
      adapters: {websocket: WSAdapter},
    },
  );
  await t.notThrows(instance.run());
  await instance.host.stop();
});
// Test host boot ssl activation file
test('Core: host boot ssl activation file.', async t => {
  const instance: HostBoot = new HostBoot(
    {
      apps: ['TodoApp@todo.app:8077'],
    },
    {
      cwd,
      port: 5000,
      adapters: {websocket: WSAdapter},
      network: {
        ssl: {
          activation: {
            endpoint: '/.well-known/activation.txt',
            path: '../../test/activation.txt',
          },
        },
      },
    },
  );
  await instance.run();
  // Create HTTP Client
  const client: NodeJS.HTTP = new NodeJS.HTTP();
  // Call the decorated JSON
  const result: any = <any>(
    await client.get('http://127.0.0.1:5000/.well-known/activation.txt')
  );
  // Test Service
  t.is(result, 'activation-hello-world');
  await instance.host.stop();
});
// Test host boot ssl activation file missing directory
test('Core: host boot ssl activation file missing directory.', async t => {
  const instance: HostBoot = new HostBoot(
    {
      apps: ['TodoApp@todo.app:8079'],
    },
    {
      cwd,
      port: 5001,
      adapters: {websocket: WSAdapter},
      network: {
        ssl: {
          activation: {
            endpoint: '/.well-known/activation.txt',
            path: '../../test/activation.notexistent.txt',
          },
        },
      },
    },
  );
  await instance.run();
  // Create HTTP Client
  const client: NodeJS.HTTP = new NodeJS.HTTP();
  // Call the decorated JSON
  const result: any = <any>(
    await client.get('http://127.0.0.1:5001/.well-known/activation.txt')
  );
  // Test Service
  t.is(result.code, 404);
  t.is(result.message, 'Activation file not found.');
  await instance.host.stop();
});
// Test host boot throws
test('Core: host boot throws.', async t => {
  const error = await t.throws(
    new Promise(() => {
      new HostBoot(
        {
          apps: [],
        },
        {
          cwd,
          adapters: {websocket: WSAdapter},
        },
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
  await injector.inject(MyComponent, instance, {
    models: [],
    renderers: [],
    services: [MyService],
    components: [],
  });
  t.is(instance.test(), text);
  t.is(instance.test2(), text);
});
//Test Injector has, get and set
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
    private mongoose: Mongoose = new Mongoose();
    async connect() {
      return this.mongoose.connect(
        'mongodb://lb-sdk-test:lb-sdk-test@ds153400.mlab.com:53400/heroku_pmkjxjwz',
      );
    }
    async disconnect() {
      return this.mongoose.disconnect();
    }
    async register(R: IModelRegister): Promise<IModelRegister> {
      R.model = this.mongoose.model(R.class.name, R.schema);
      return R;
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
  //Model
  @Model({
    datasource: MongooseDatasource,
  })
  class Todo2Model implements IModel {
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
    @Inject.Model(TodoModel) public model;
    @Inject.Model(Todo2Model) public model2;
    @Inject.Model(Todo2Model) public model3;
    @Inject.Service(TodoService) public service: TodoService;
    @Inject.Service(TodoService) public service2: TodoService;
  }
  // Inject Model and Service
  const injector: Injector = new Injector();
  const instance: TodoComponent = new TodoComponent();
  await injector.inject(TodoComponent, instance, {
    components: [],
    renderers: [],
    models: [TodoModel, Todo2Model],
    services: [TodoService],
  });
  // Test Service
  t.is(instance.service.test(), criteria);
  // Test Model
  const result = await instance.model.create({text: criteria});
  t.truthy(result._id);
  t.is(result.text, criteria);
});
// Test Inject Throws Uninstalled Injectable
test('Core: Inject Throws Uninstalled Injectable.', async t => {
  // DataSource
  @DataSource()
  class MongooseDatasource implements IDataSource {
    private mongoose: Mongoose = new Mongoose();
    async connect() {
      return this.mongoose.connect(
        'mongodb://lb-sdk-test:lb-sdk-test@ds153400.mlab.com:53400/heroku_pmkjxjwz',
      );
    }
    async disconnect() {
      return this.mongoose.disconnect();
    }
    async register(R: IModelRegister): Promise<IModelRegister> {
      R.model = this.mongoose.model(R.class.name, R.schema);
      return R;
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
  // Component
  class TodoComponent {
    @Inject.Model(TodoModel) public model;
  }
  // Inject Model and Service
  const injector: Injector = new Injector();
  const instance: TodoComponent = new TodoComponent();
  const error = await t.throws(
    injector.inject(TodoComponent, instance, {
      components: [],
      renderers: [],
      models: [],
      services: [],
    }),
  );
  // Test Service
  t.is(
    error.message,
    'ONIXJS CORE: Unable to inject an unregisted class "TodoModel", please install it within the @Module "TodoComponent" configuration',
  );
});

// Test Main Life Cycle
test('Core: main lifecycle.', async t => {
  const result: boolean = true;
  const lifecycle: LifeCycle = new LifeCycle();
  const r1 = await lifecycle.onAppMethodCall(
    <T>(name: string): T => {
      return newFunction<T>();
    },
    {
      rpc: 'somerpc',
      request: <IRequest>{
        metadata: {},
        payload: {},
      },
    },
    async () => result,
  );
  const r2 = await lifecycle.onModuleMethodCall(
    <T>(name: string): T => {
      return newFunction<T>();
    },
    {
      rpc: 'somerpc',
      request: <IRequest>{
        metadata: {},
        payload: {},
      },
    },
    async () => result,
  );
  const r3 = await lifecycle.onComponentMethodCall(
    <T>(name: string): T => {
      return newFunction<T>();
    },
    {
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
//Test Component Router REST Endpoint
test('Core: Component Router REST Endpoint.', async t => {
  // Component
  class StaticComponent {
    @Router.Get('/test/get')
    async test(req, res) {
      return {HELLO: 'WORLD'};
    }
  }
  // Declare Module
  @Module({
    models: [],
    renderers: [],
    services: [],
    components: [StaticComponent],
  })
  class StaticModule {}
  // Declare Application
  class MyApp extends Application {}
  // Start App Factory
  const server: AppServer = new AppServer(MyApp, {
    port: 7950,
    modules: [StaticModule],
  });
  let uuid: string = Utils.uuid();
  // Create Application
  await server.operation({
    uuid,
    type: OperationType.APP_CREATE,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
  uuid = Utils.uuid();
  // Start Application
  await server.operation({
    uuid,
    type: OperationType.APP_START,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
  // Create HTTP Client
  const client: NodeJS.HTTP = new NodeJS.HTTP();
  // Call the decorated JSON
  // Call the decorated JSON
  const result: any = <any>await client.get('http://127.0.0.1:7950/test/get');
  // Test Service
  t.is(result.HELLO, 'WORLD');
  uuid = Utils.uuid();
  // Start Application
  await server.operation({
    uuid,
    type: OperationType.APP_STOP,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
});
//Test Component Router Param Hook
test('Core: Component Router Param Hook.', async t => {
  // Component
  class StaticComponent {
    private users = [
      {
        id: 0,
        text: 'Foo',
      },
      {
        id: 1,
        text: 'Bar',
      },
    ];

    @Router.Param({name: 'user_id', as: 'user'})
    async param(req: OnixHTTPRequest, user_id) {
      return this.users[user_id];
    }

    @Router.Get('/test/:user_id/params')
    async test(req, res) {
      res.end(JSON.stringify(req.user));
    }
  }
  // Declare Module
  @Module({
    models: [],
    renderers: [],
    services: [],
    components: [StaticComponent],
  })
  class StaticModule {}
  // Declare Application
  class MyApp extends Application {}
  // Start App Factory
  const server: AppServer = new AppServer(MyApp, {
    port: 7951,
    modules: [StaticModule],
  });
  const uuid: string = Utils.uuid();
  // Create Application
  await server.operation({
    uuid,
    type: OperationType.APP_CREATE,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
  // Start Application
  await server.operation({
    uuid: Utils.uuid(),
    type: OperationType.APP_START,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
  // Create HTTP Client
  const client: NodeJS.HTTP = new NodeJS.HTTP();
  // Call the decorated JSON
  // Call the decorated JSON
  const resultA: any = <any>(
    await client.get('http://127.0.0.1:7951/test/0/params')
  );
  const resultB: any = <any>(
    await client.get('http://127.0.0.1:7951/test/1/params')
  );
  // Test Service
  t.is(resultA.text, 'Foo');
  t.is(resultB.text, 'Bar');
  // Start Application
  await server.operation({
    uuid: Utils.uuid(),
    type: OperationType.APP_STOP,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
});
//Test Component Static
test('Core: Component Static.', async t => {
  // Component
  class StaticComponent {
    @Router.Static('test/static.json')
    async test(req: OnixHTTPRequest, buffer: Buffer) {
      return buffer.toString();
    }
    @Router.Static('test')
    async test2(req: OnixHTTPRequest, buffer: Buffer) {
      return buffer.toString();
    }
    @Router.Static('test/no.exist.json')
    async thrower(req: OnixHTTPRequest, buffer: Buffer) {
      // Wont be executed since path file does not exist
      return buffer.toString();
    }
  }
  // Declare Module
  @Module({
    models: [],
    renderers: [],
    services: [],
    components: [StaticComponent],
  })
  class StaticModule {}
  // Declare Application
  class MyApp extends Application {}
  // Start App Factory
  const server: AppServer = new AppServer(MyApp, {
    port: 6950,
    modules: [StaticModule],
  });
  let uuid: string = Utils.uuid();
  // Create Application
  await server.operation({
    uuid,
    type: OperationType.APP_CREATE,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
  uuid = Utils.uuid();
  // Start Application
  await server.operation({
    uuid,
    type: OperationType.APP_START,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
  // Create HTTP Client
  const client: NodeJS.HTTP = new NodeJS.HTTP();
  // Call the decorated JSON
  const result: String = <String>(
    await client.get('http://127.0.0.1:6950/test/static.json')
  );
  // Test Service
  t.is(JSON.parse(result.toString()).hello, 'world');
  // Call the decorated JSON
  const dirresult: String = <String>(
    await client.get('http://127.0.0.1:6950/test/static2.json')
  );
  console.log('DIR RESULT: ', dirresult);
  // Test Service
  t.is(JSON.parse(dirresult.toString()).hello, 'world');
  // Thrower/
  const noexist: String = <String>(
    await client.get('http://127.0.0.1:6950/test/no.exist.json')
  );
  t.true(noexist.includes('Cannot GET /test/no.exist.json'));
  // Start Application
  await server.operation({
    uuid: Utils.uuid(),
    type: OperationType.APP_STOP,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
});
//Test Component View
test('Core: Component View.', async t => {
  // Component
  class StaticComponent {
    @Router.View({
      endpoint: '/my-static',
      file: 'test/static.json',
    })
    async test(req: OnixHTTPRequest, buffer: Buffer) {
      return buffer.toString();
    }
  }
  // Declare Module
  @Module({
    models: [],
    renderers: [],
    services: [],
    components: [StaticComponent],
  })
  class StaticModule {}
  // Declare Application
  class MyApp extends Application {}
  // Start App Factory
  const server: AppServer = new AppServer(MyApp, {
    port: 6050,
    modules: [StaticModule],
  });
  let uuid: string = Utils.uuid();
  // Create Application
  await server.operation({
    uuid,
    type: OperationType.APP_CREATE,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
  uuid = Utils.uuid();
  // Start Application
  await server.operation({
    uuid,
    type: OperationType.APP_START,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
  // Create HTTP Client
  const client: NodeJS.HTTP = new NodeJS.HTTP();
  // Call the decorated JSON
  // Call the decorated JSON
  const result: String = <String>(
    await client.get('http://127.0.0.1:6050/my-static')
  );
  // Test Service
  t.is(JSON.parse(result.toString()).hello, 'world');
  // Start Application
  await server.operation({
    uuid: Utils.uuid(),
    type: OperationType.APP_STOP,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
});
//Test Component View Immutable
test('Core: Component View Immutable.', async t => {
  // Component
  class StaticComponent {
    @Router.View({
      endpoint: '/my-static',
      file: 'test/static.json',
    })
    async test(req: OnixHTTPRequest, buffer: Buffer) {
      return buffer.toString();
    }
  }
  // Declare Module
  @Module({
    models: [],
    renderers: [],
    services: [],
    components: [StaticComponent],
  })
  class StaticModule {}
  // Declare Application
  class MyApp extends Application {}
  // Start App Factory
  const server: AppServer = new AppServer(MyApp, {
    port: 6150,
    modules: [StaticModule],
  });
  let uuid: string = Utils.uuid();
  // Create Application
  await server.operation({
    uuid,
    type: OperationType.APP_CREATE,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
  uuid = Utils.uuid();
  // Start Application
  await server.operation({
    uuid: Utils.uuid(),
    type: OperationType.APP_START,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
  // Create HTTP Client
  const client: NodeJS.HTTP = new NodeJS.HTTP();
  // Call the decorated JSON
  // Call the decorated JSON
  const result: String = <String>(
    await client.get('http://127.0.0.1:6150/my-static')
  );
  // Test Service
  t.is(JSON.parse(result.toString()).hello, 'world');
  // Start Application
  await server.operation({
    uuid: Utils.uuid(),
    type: OperationType.APP_STOP,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
});
//Test Component View FilePath Not Exist
test('Core: Component View FilePath Not Exist.', async t => {
  // Component
  class StaticComponent {
    @Router.View({
      endpoint: '/my-static',
      file: 'test/some.missing.file.json',
    })
    async test(req: OnixHTTPRequest, buffer: Buffer) {
      return buffer.toString();
    }
  }
  // Declare Module
  @Module({
    models: [],
    renderers: [],
    services: [],
    components: [StaticComponent],
  })
  class StaticModule {}
  // Declare Application
  class MyApp extends Application {}
  // Start App Factory
  const server: AppServer = new AppServer(MyApp, {
    port: 6350,
    modules: [StaticModule],
  });
  let uuid: string = Utils.uuid();
  // Create Application
  await server.operation({
    uuid,
    type: OperationType.APP_CREATE,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
  uuid = Utils.uuid();
  // Start Application
  await server.operation({
    uuid,
    type: OperationType.APP_START,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
  // Create HTTP Client
  const client: NodeJS.HTTP = new NodeJS.HTTP();
  // Call the decorated JSON
  const result: any = <any>await client.get('http://127.0.0.1:6350/my-static');
  // Test Service
  t.is(result.code, 404);
  t.is(result.message, 'Oops!!! something went wrong.');
  uuid = Utils.uuid();
  // Start Application
  await server.operation({
    uuid,
    type: OperationType.APP_STOP,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
});
//TestView Renderer.
test('Core: View Renderer.', async t => {
  // Declare renderer
  @ViewRenderer
  class MyRenderer implements IViewRenderer {
    process(view: string, args: Directory): string {
      // Use Any JS Template Engine Here
      // This test uses doT: https://github.com/olado/doT/
      return dot.template(view, undefined, args)();
    }
  }
  // Component
  class DynamicComponent {
    // Inject Renderer
    @Inject.Renderer(MyRenderer) renderer: MyRenderer;

    @Router.View({
      endpoint: '/my-dynamic',
      file: 'test/dynamic.json',
    })
    async test(req: OnixHTTPRequest, buffer: Buffer) {
      return this.renderer.process(buffer.toString(), {
        key: 'HELLO',
        value: 'WORLD',
      });
    }
  }
  // Declare Module
  @Module({
    models: [],
    renderers: [MyRenderer],
    services: [],
    components: [DynamicComponent],
  })
  class DynamicModule {}
  // Declare Application
  class MyApp extends Application {}
  // Start App Factory
  const server: AppServer = new AppServer(MyApp, {
    port: 6060,
    modules: [DynamicModule],
  });
  let uuid: string = Utils.uuid();
  // Create Application
  await server.operation({
    uuid,
    type: OperationType.APP_CREATE,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
  uuid = Utils.uuid();
  // Start Application
  await server.operation({
    uuid: Utils.uuid(),
    type: OperationType.APP_START,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
  // Create HTTP Client
  const client: NodeJS.HTTP = new NodeJS.HTTP();
  // Call the decorated JSON
  const result: String = <String>(
    await client.get('http://127.0.0.1:6060/my-dynamic')
  );
  // Test Service
  t.is(JSON.parse(result.toString()).HELLO, 'WORLD');
  // Start Application
  await server.operation({
    uuid: Utils.uuid(),
    type: OperationType.APP_STOP,
    message: {
      rpc: '',
      request: {
        metadata: {stream: false, subscription: uuid},
        payload: '',
      },
    },
  });
});
//Test Notifier
test('Core: Notifier.', async t => {
  // Set test event
  const event: string = 'notifier:test';
  // Component
  class NotifierComponent {
    // Inject Renderer
    @Inject.Notifier() notifier: AppNotifier;
    // Test Notifier Event
    test() {
      return new Promise((resolve, reject) =>
        this.notifier.on(event, r => resolve(r)),
      );
    }
  }
  // Create Notifier
  const notifier: AppNotifier = new AppNotifier();
  // Create NotifierComponent instance
  const instance: NotifierComponent = new NotifierComponent();
  // Start App Factory
  const injector: Injector = new Injector();
  // Inject Notifier
  await injector.inject(NotifierComponent, instance, {
    renderers: [],
    components: [],
    services: [],
    models: [],
    notifier,
  });

  // Test Notifier Event
  instance.test().then(r => t.true(r), e => console.log(e));
  // Send test event
  notifier.emit(event, true);
});
// Test acl.group.match
test('CORE: ACL Group Match', async t => {
  // SOME DUMMY METHOD NAME
  const name: string = 'somemethod';
  const uuid: string = Utils.uuid();
  // SOME DUMMY OPERATION
  const operation: IAppOperation = {
    uuid,
    type: OperationType.ONIX_REMOTE_CALL_PROCEDURE,
    message: {
      rpc: name,
      request: {
        metadata: {
          stream: false,
          subscription: uuid,
        },
        payload: {},
      },
    },
  };
  // SOME DUMMY COMPONENT CONFIG
  const config: IComponentConfig = {
    acl: [AllowEveryone],
  };
  // VERIFY ACCESS
  const hasAccess: boolean = await GroupMatch.verify(
    name,
    operation,
    {
      components: [],
      services: [],
      models: [],
      renderers: [],
    },
    config,
    new Injector(),
  );
  // TEST IF HAS ACCESS
  t.true(hasAccess);
});

function newFunction<T>(): T {
  return <T>{};
}
