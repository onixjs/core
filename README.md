OnixJS
================
![alt text](https://raw.githubusercontent.com/onixjs/core/master/onix-splash.png?sanitize=true "OnixJS")
A High-Performance NodeJS SOA Framework designed to address goals like flexibility, stability and connectivity.

> **Disclaimer**: This framework is in active development and won't be ready for production until we reach release candidate.
> **Alpha release date**: Feb 2018
> **Estimated date for beta release**: March ~ Apr 2018
> **Estimated date for release candidate**: 2Q/2018

## Installation

````sh
$ npm install --save @onixjs/core
````

`Server examples will be delivered when the onix sample is published (Expected by 1.0.0-alpha.5)`

## Phylosophy
The OnixJS phylosophy is to empower developers to decide which dependencies they want to install and maintain in their projects.

We strongly believe that staging or deploying your project, now or in a year... MUST NOT be affected by the framework or any of its dependencies, and that is the reason of why we decided to use practically zero dependencies.

All of this while providing with cool and modern features and mechanisms to build a better communicated, scalable and highly-available product.

## Features

- Built-in TypeScript
- Dependency Injection
- Service Oriented Architecture (SOA - Micro Services)
- Module and Component Level LifeCycles (Not Opinionated Hooks)
- Remote Procedure Call and Streams API (RPC/RPS)
- Universal SDK (For any framework: Angular, React, Vue, Even Native JS)
- Back-end compatible with any ORM (Mongoose, Sequalize, TypeORM, Etc)

## Project Structure

```sh
Project Root
  | - package.json
  | - onix.config.json
  | + src
  | | - index.ts
  | | - someApp.app
  | | - otherApp.app
  | | - datasources
```
- **pagacke.json**: Contains your nodejs module settings.
- **onix.config.json**: Contains your onixjs project settings.
- **index.ts**: Project executable file, it will just bootstrap your applications.
- **someApp.app**: Relatively small application for specific functionalities *(MicroService 1)*.
- **otherApp.app**: Relatively small application for specific functionalities *(MicroService 2)*.
- **datasources**: Project level datasource, since onix modules can be published into NPM, datasources can also be placed at module level.

## Application Structure

```sh
App Root
  | - index.ts
  | - lifecycle.ts
  | + modules
  | | + module
  | | | - my.model.ts
  | | | - my.service.ts
  | | | - my.component.ts
  | | | - my.component.acl.ts
  | | | - my.lifecycle.ts
  | | | - my.datasource.ts
```
- **index.ts**: Application definition, here you define which modules to use.
- **lifecycle.ts**: Application level lifecycle, used to program hooks for your RPC calls (Optional).
- **modules/module**: Application level module, this can be published and must be able to work only by installing in a new application.
- **modules/module/my.model.ts**: Model definition for this module, can be 0, 1 or more than 1 models.
- **modules/module/my.service.ts**: Service definition for this module, can be 0, 1 or more than 1 services.
- **modules/module/my.component.ts**: Component definition, methods within this component will be exposed through the RPC 
- **modules/module/my.component.acl.ts**: Component access control list, might be 1 for each component.
API, but only if these are public.
- **modules/module/my.lifecycle.ts**: Module level lifecycle, used to program hooks for RPC Calls (Optional).
- **modules/module/my.datasource.ts**: Module level datasource.

## Server Examples

A complete server example will be delivered by 1.0.0-alpha.5, when the onixjs-sample is also released.

## Client Examples

This is an example of client implementation, it can work on any framework and runtime environment (NodeJS or Browser).

```js
import { OnixClient, AppReference} from "@onixjs/sdk";
// Create SDK Instance (Hint: Options defaults to localhost)
const SDK: OnixClient = new OnixClient({
    host: '127.0.0.1',
    port: 80
});
// Init SDK
await SDK.init();
// Create a TodoApp Reference
const TodoAppRef: AppReference | Error = await SDK.AppReference('TodoApp');
// Verify we actually got a Reference and not an Error
if (TodoAppRef instanceof AppReference) {
    const result = await TodoAppRef.Module('TodoModule')
                                   .Component('TodoComponent')
                                   .Method('addTodo')
                                   .call({ text: 'Hello SDK World' });
} else {
    throw TodoAppRef;
}
```

## Core Documentation

````sh
$ git clone git@github.com:onixjs/core.git
$ cd core
$ npm install && npm run serve:docs
````

Documents will be served on [http://127.0.0.1:3000](http://127.0.0.1:3000)

## Test

````sh
$ git clone git@github.com:onixjs/core.git
$ cd core
$ npm install && npm run test
````