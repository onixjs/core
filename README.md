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

The **OnixJS FrameWork** is an ***Enterprise Grade*** **Node.JS** platform that implements only **Industry Standards** and **Patterns** in order provide the best development experience possible:

- High-Availability
- High-Performance
- Built-in **TypeScript**
- Identity Provider (**SSO**)
- **OpenID** Authentication
- **OAuth2** Resources Authorization
- **FrameWork Agnostic SDK** *(For ES6+/TypeScript Clents)*
- Dependency Injection (**DI**)
- **Service Oriented Architecture or Monolithic Architecture**.
- Representional State Transfer API (**REST API**)
- Remote Procedure Call and Streams API (**RPC/RPCS APIs**)
- Module and Component Level LifeCycles (**Hooks**)
- Back-end compatible with any **ORM** *(LoopBack's Datasource Juggler, Mongoose, Sequalize, TypeORM, Etc)*

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