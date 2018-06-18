import {test} from 'ava';
import * as path from 'path';
import {OnixJS} from '../src/index';
import {TodoModel} from './todo.shared/todo.model';
const pkg = require('../../package.json');
const cwd = path.join(process.cwd(), 'dist', 'test');
//import * as WebSocket from 'ws';
import {IAppConfig} from '../src/interfaces';
import {Utils} from '@onixjs/sdk/dist/utils';
import {
  OnixClient,
  AppReference,
  ComponentReference,
  OperationType,
  IAppOperation,
  IRequest,
  Subscription,
} from '@onixjs/sdk';
import {NodeJS} from '@onixjs/sdk/dist/adapters/node.adapters';
import {WSAdapter} from '../src/adapters/ws.adapter';
// Test Onix Version

test('Acceptance: Onix version', t => {
  const onix: OnixJS = new OnixJS({
    cwd,
    port: 8085,
    adapters: {websocket: WSAdapter},
  });
  t.is(onix.version, pkg.version);
});
//Test Onix App Starter
test('Acceptance: Onix app starter', async t => {
  const onix: OnixJS = new OnixJS({
    cwd,
    port: 8083,
    adapters: {websocket: WSAdapter},
  });
  await onix.load('TodoApp@todo.app:disabled');
  const results: OperationType.APP_START_RESPONSE[] = await onix.start();
  t.deepEqual(results, [
    // Second for the loaded app
    OperationType.APP_START_RESPONSE,
  ]);
  await onix.stop();
});

//Test Onix App Pinger
test('Acceptance: Onix app pinger', async t => {
  const onix: OnixJS = new OnixJS({
    cwd,
    port: 8084,
    adapters: {websocket: WSAdapter},
  });
  await onix.load('TodoApp@todo.app:disabled');
  const config: IAppConfig = await onix.ping('TodoApp');
  t.true(config.network!.disabled);
});
//Test Onix Apps Say Hello
test('Acceptance: Onix app greeter', async t => {
  const onix: OnixJS = new OnixJS({cwd, adapters: {websocket: WSAdapter}});
  await onix.load('BobApp@bob.app');
  await onix.load('AliceApp@alice.app');
  // Bidimentional array, each app call multiple apps, each
  // results in an array of booleans. The final result is
  // a bidimentional array of booleans representing every app
  // Answering between each others.
  const results: boolean[][] = await onix.greet();
  // Both apps should communicate each other and say they are alive (true x 2)
  t.deepEqual(results.reduce((a, b) => a.concat(b)), [true, true]);
});

//Test Onix RPC component methods
test('Acceptance: Onix rpc component methods from server', async t => {
  const onix: OnixJS = new OnixJS({
    cwd,
    port: 8085,
    adapters: {websocket: WSAdapter},
  });
  await onix.load('TodoApp@todo.app:disabled');
  await onix.start();
  const todo: TodoModel = new TodoModel();
  todo.text = 'Hello World';
  const operation: IAppOperation = await onix.coordinate(
    'TodoApp.TodoModule.TodoComponent.addTodo',
    <IRequest>{
      metadata: {
        stream: false,
        caller: 'tester',
        token: 'dummytoken',
        register: Utils.uuid(),
      },
      payload: todo,
    },
  );
  // Get result todo instance from operation message
  const result: TodoModel = <TodoModel>operation.message.request.payload;
  await onix.stop();
  // Test the text and a persisted mongodb id.
  t.deepEqual(todo.text, result.text);
  t.truthy(result._id);
});

//Test Onix RPC component stream*
test('Acceptance: Onix rpc component stream', async t => {
  const text: string = 'Hello SDK World';
  // Host Port 8087
  const onix: OnixJS = new OnixJS({
    cwd,
    port: 8087,
    adapters: {websocket: WSAdapter},
  });
  // SOA Service Port 8078
  await onix.load('TodoApp@todo.app:8078');
  await onix.start();
  // Websocket should be available now
  const client: OnixClient = new OnixClient({
    host: 'http://127.0.0.1',
    port: 8087,
    adapters: {
      http: NodeJS.HTTP,
      websocket: NodeJS.WebSocket,
      storage: NodeJS.LocalStorage,
    },
  });
  // Init SDK
  await client.init();
  // Create a TodoApp Reference
  const TodoAppRef: AppReference | Error = await client.AppReference('TodoApp');
  // Verify we actually got a Reference and not an Error
  if (TodoAppRef instanceof AppReference) {
    const componentRef: ComponentReference = TodoAppRef.Module(
      'TodoModule',
    ).Component('TodoComponent');
    // Set on create listener
    const subscription: Subscription = await componentRef
      .Method('onCreate')
      .stream(data => {
        t.is(data.text, text);
      });
    // Send new todo
    const result = await componentRef.Method('addTodo').call({text});
    // Unsubscribe the stream
    await subscription.unsubscribe();
    // Terminate test
    t.is(result.text, text);
  }
  client.disconnect();
});

//Test Onix Call Connect RPC*
test('Acceptance: Onix Call Connect RPC', async t => {
  const text: string = 'Hello Connected World';
  // Host Port 2999
  const onix: OnixJS = new OnixJS({
    cwd,
    port: 2999,
    adapters: {websocket: WSAdapter},
  });
  // SOA Service Port 8078
  await onix.load('AliceApp@alice.app:disabled');
  await onix.load('BobApp@bob.app:disabled');
  await onix.start();
  // Websocket should be available now
  const client: OnixClient = new OnixClient({
    host: 'http://127.0.0.1',
    port: 2999,
    adapters: {
      http: NodeJS.HTTP,
      websocket: NodeJS.WebSocket,
      storage: NodeJS.LocalStorage,
    },
  });
  // Init SDK
  await client.init();
  // Create a BobApp Reference
  const BobAppRef: AppReference | Error = await client.AppReference('BobApp');
  // Verify we actually got a Reference and not an Error
  if (BobAppRef instanceof AppReference) {
    const componentRef: ComponentReference = BobAppRef.Module(
      'BobModule',
    ).Component('BobComponent');
    // Set on create listener
    const subscription: Subscription = await componentRef
      .Method('exposedStream')
      .stream(async data => {
        t.is(data.text, text);
        await subscription.unsubscribe();
      });
    // Test wrong app through exposed proxy
    const e1 = await componentRef.Method('exposedFakeAppCall').call({});
    console.log('E1: ', e1);
    t.is(e1, 'ONIXJS: The app "fakeApp" is not hosted by the provided broker.');
    // Test wrong module through exposed proxy
    const e2 = await componentRef.Method('exposedFakeModuleCall').call({});
    console.log('E2: ', e2);
    t.is(
      e2,
      'ONIXJS: The module "fakeModule" doesn\'t belongs to app "AliceApp".',
    );
    // Test wrong component through exposed proxy
    const e3 = await componentRef.Method('exposedFakeComponentCall').call({});
    //console.log('E3: ', e3);
    t.is(
      e3,
      'ONIXJS: The component "fakeComponent" doesn\'t belongs to module "AliceModule".',
    );
    // Test wrong method through exposed proxy
    const e4 = await componentRef.Method('exposedFakeMethodCall').call({});
    console.log('E4: ', e4);
    t.is(
      e4,
      'ONIXJS: The method "fakeCallMe" doesn\'t belongs to component "AliceComponent".',
    );
    // Send new todo
    const result = await componentRef.Method('exposedCall').call({text});
    t.is(result.text, text);
  }
  client.disconnect();
});
