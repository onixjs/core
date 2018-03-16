import {test} from 'ava';
import * as path from 'path';
import {
  OnixJS,
  OperationType,
  IAppOperation,
  IRequest,
  isJsonString,
} from '../src/index';
import {TodoModel} from './todo.shared/todo.model';
const pkg = require('../../package.json');
const cwd = path.join(process.cwd(), 'dist', 'test');
import * as WebSocket from 'uws';
import {IAppConfig, ICall} from '../src/interfaces';
/**
 * Test Onix Version
 **/
test('Onix version', t => {
  const onix: OnixJS = new OnixJS({cwd, port: 8085});
  t.is(onix.version, pkg.version);
});
/**
 * Test Onix App Starter
 **/
test('Onix app starter', async t => {
  const onix: OnixJS = new OnixJS({cwd, port: 8083});
  await onix.load('TodoApp@todo2.app');
  const results: OperationType.APP_START_RESPONSE[] = await onix.start();
  t.deepEqual(results, [
    // One for the server
    OperationType.APP_START_RESPONSE,
    // Second for the loaded app
    OperationType.APP_START_RESPONSE,
  ]);
  await onix.stop();
});
/**
 * Test Onix App Pinger
 */
test('Onix app pinger', async t => {
  const onix: OnixJS = new OnixJS({cwd, port: 8084});
  await onix.load('TodoApp@todo2.app');
  const config: IAppConfig = await onix.ping('TodoApp');
  t.true(config.disableNetwork);
});
/**
 * Test Onix Apps Say Hello
 **/
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
/**
 * Test Onix RPC component methods
 **/
test('Onix rpc component methods from server', async t => {
  const onix: OnixJS = new OnixJS({cwd, port: 8082});
  await onix.load('TodoApp@todo2.app');
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
  const result: TodoModel = <TodoModel>operation.message;
  await onix.stop();
  // Test the text and a persisted mongodb id.
  t.deepEqual(todo.text, result.text);
  t.truthy(result._id);
});

/**
 * Test Onix RPC component methods
 **/
test('Onix rpc component methods from client', async t => {
  const onix: OnixJS = new OnixJS({cwd, port: 8081});
  await onix.load('TodoApp@todo.app');
  await onix.start();
  // Websocket should be available now
  const client: WebSocket = new WebSocket('ws://127.0.0.1:8080');
  const todo: TodoModel = new TodoModel();
  todo.text = 'Hello World';
  // Send remote call through websockets
  client.on('open', () =>
    setTimeout(
      () =>
        client.send(
          JSON.stringify(<ICall>{
            rpc: 'TodoApp.TodoModule.TodoComponent.addTodo',
            request: <IRequest>{
              metadata: {stream: false, caller: 'tester', token: 'dummytoken'},
              payload: todo,
            },
          }),
        ),
      1000,
    ),
  );
  // declare listener
  const result: TodoModel = await new Promise<TodoModel>((resolve, reject) => {
    client.on('message', async (data: string) => {
      if (isJsonString(data)) {
        const operation: IAppOperation = JSON.parse(data);
        if (
          operation.type === OperationType.ONIX_REMOTE_CALL_PROCEDURE_RESPONSE
        ) {
          resolve(operation.message);
        }
      }
    });
  });
  t.deepEqual(todo.text, result.text);
  t.truthy(result._id);
  await onix.stop();
});
