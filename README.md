OnixJS - FrameWork
================
![alt text](https://raw.githubusercontent.com/onixjs/core/master/misc/onix-splash.png "OnixJS")
The High-Performance SOA Real-Time Framework for Node.JS.

> **Disclaimer**: This framework is in active development and won't be ready for production until we reach release candidate.
 - **Alpha release date**: Feb 2018
 - **Estimated date for beta release**: Apr 2018
 - **Estimated date for release candidate**: EO2Q/2018

## Installation

````sh
$ npm install --save @onixjs/core
````
## Features

- High-Availability
- High-Performance
- Built-in TypeScript
- Dependency Injection
- Stand-Alone SDK (Can work in any framework: Angular, React, Vue, Even Native JS)
- Service Oriented Architecture (SOA - Micro Services)
- Module and Component Level LifeCycles (Not Opinionated Hooks)
- Remote Procedure Call and Streams API (RPC/RPCS)
- Back-end compatible with any ORM (Mongoose, Sequalize, TypeORM, Etc)

## Phylosophy
The OnixJS phylosophy is to empower developers to decide which dependencies they want to install and maintain in their projects.

We strongly believe that staging or deploying your project, now or in a year... MUST NOT be affected by the framework or any of its dependencies, and that is the reason of why we decided to use practically zero dependencies.

All of this while providing with cool and modern features and mechanisms to build a better communicated, scalable and highly-available product.

## Core Documentation

````sh
$ git clone git@github.com:onixjs/core.git
$ cd core
$ npm install && npm run serve:docs
````
Documents will be served on [http://127.0.0.1:3000](http://127.0.0.1:3000)

Note: Core documentation is not focused on end application developers.

## Test

````sh
$ git clone git@github.com:onixjs/core.git
$ cd core
$ npm install && npm run test
````