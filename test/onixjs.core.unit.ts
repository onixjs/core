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
} from '../src';
import * as path from 'path';
import {CallResponser} from '../src/core/call.responser';
import * as WebSocket from 'uws';
import {CallStreamer} from '../src/core/call.streamer';
import {Utils} from '@onixjs/sdk/dist/utils';
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
  await onix.load('TodoApp@todo2.app');
  const error = await t.throws(onix.load('TodoApp@todo2.app'));
  t.is(error.message, 'OnixJS Error: Trying to add duplicated application');
});
// Test OnixJS ping missing app
test('Core: OnixJS pings missing Application.', async t => {
  const onix: OnixJS = new OnixJS({
    cwd: path.join(process.cwd(), 'dist', 'test'),
    port: 8087,
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
  await onix.load('TodoApp@todo2.app');
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
