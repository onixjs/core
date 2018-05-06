import {test} from 'ava';
import * as path from 'path';
import {
  OnixJS,
  OperationType,
  IAppOperation,
  IRequest,
  OnixMessage,
} from '../src/index';
import {TodoModel} from './todo.shared/todo.model';
const pkg = require('../../package.json');
const cwd = path.join(process.cwd(), 'dist', 'test');
import * as WebSocket from 'uws';
import {IAppConfig} from '../src/interfaces';
import {Utils} from '@onixjs/sdk/dist/utils';
import {OnixClient, AppReference, ComponentReference} from '@onixjs/sdk';
import {NodeJS} from '@onixjs/sdk/dist/adapters/node.adapters';
// Test Onix Version

test('Onix version', t => {
  const onix: OnixJS = new OnixJS({cwd, port: 8085});
  t.is(onix.version, pkg.version);
});
//Test Onix App Starter
test('Onix app starter', async t => {
  const onix: OnixJS = new OnixJS({cwd, port: 8083});
  await onix.load('TodoApp@todo.app:disabled');
  const results: OperationType.APP_START_RESPONSE[] = await onix.start();
  t.deepEqual(results, [
    // Second for the loaded app
    OperationType.APP_START_RESPONSE,
  ]);
  await onix.stop();
});

//Test Onix App Pinger
test('Onix app pinger', async t => {
  const onix: OnixJS = new OnixJS({cwd, port: 8084});
  await onix.load('TodoApp@todo.app:disabled');
  const config: IAppConfig = await onix.ping('TodoApp');
  t.true(config.network!.disabled);
});
//Test Onix Apps Say Hello
test('Onix app greeter', async t => {
  const onix: OnixJS = new OnixJS({cwd});
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
test('Onix rpc component methods from server', async t => {
  const onix: OnixJS = new OnixJS({cwd, port: 8085});
  await onix.load('TodoApp@todo.app:disabled');
  await onix.start();
  const todo: TodoModel = new TodoModel();
  todo.text = 'Hello World';
  const operation: IAppOperation = await onix.coordinate(
    'TodoApp.TodoModule.TodoComponent.addTodo',
    <IRequest>{
      metadata: {stream: false, caller: 'tester', token: 'dummytoken'},
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

//Test Onix RPC component methods
test('Onix rpc component methods from client', async t => {
  const onix: OnixJS = new OnixJS({cwd, port: 8086});
  await onix.load('TodoApp@todo.app');
  await onix.start();
  // Websocket should be available now
  const client: WebSocket = new WebSocket('ws://127.0.0.1:8079');
  const todo: TodoModel = new TodoModel();
  todo.text = 'Onix rpc component methods from client';
  // Send remote call through websockets
  client.on('message', async (data: string) => {
    if (Utils.IsJsonString(data)) {
      const operation: IAppOperation = JSON.parse(data);
      if (
        operation.type === OperationType.ONIX_REMOTE_CALL_PROCEDURE_RESPONSE
      ) {
        t.deepEqual(todo.text, operation.message.request.payload.text);
        t.truthy(operation.message.request.payload._id);
        await onix.stop();
      }
    }
  });

  client.on('open', () => {
    // Send Todo
    client.send(
      JSON.stringify(<OnixMessage>{
        rpc: 'TodoApp.TodoModule.TodoComponent.addTodo',
        request: <IRequest>{
          metadata: {stream: false, caller: 'tester', token: 'dummytoken'},
          payload: todo,
        },
      }),
    );
  });
});

//Test Onix RPC component stream*
test('Onix rpc component stream', async t => {
  const text: string = 'Hello SDK World';
  // Host Port 8087
  const onix: OnixJS = new OnixJS({cwd, port: 8087});
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
    componentRef.Method('onCreate').stream(data => {
      t.is(data.text, text);
    });
    // Send new todo
    const result = await componentRef.Method('addTodo').call({text});
    t.is(result.text, text);
  }
  await onix.stop();
});
