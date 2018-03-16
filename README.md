OnixJS - FrameWork [![Beerpay](https://beerpay.io/onixjs/core/badge.svg?style=beer)](https://beerpay.io/onixjs/core) [![Beerpay](https://beerpay.io/onixjs/core/make-wish.svg?style=flat)](https://beerpay.io/onixjs/core?focus=wish) [![Travis](https://img.shields.io/travis/onixjs/core.svg)](https://travis-ci.org/onixjs/core) [![npm (scoped)](https://img.shields.io/npm/v/@onixjs/core.svg)](npmjs.com/package/@onixjs/core) [![Coveralls github](https://img.shields.io/coveralls/github/onixjs/core/development.svg)](https://coveralls.io/github/onixjs/core)
================
![alt text](https://raw.githubusercontent.com/onixjs/core/master/misc/onix-splash.png "OnixJS")

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
- **FrameWork Agnostic SDK** *(For ES6+/TypeScript Clients)*
- Dependency Injection (**DI**)
- **Service Oriented Architecture or Monolithic Architecture**.
- Representional State Transfer API (**REST API**)
- Remote Procedure Call and Streams API (**RPC/RPCS APIs**)
- Module and Component Level LifeCycles (**Hooks**)
- Back-end compatible with any **ORM** *(LoopBack's Datasource Juggler, Mongoose, Sequalize, TypeORM, Etc)*

## Documentation
The following link will take you to the [OnixJS Documentation](https://github.com/onixjs/core/wiki)

`DISCLAIMER: The wiki is a temporal documentation created with the spirit of start guiding developers into the OnixJS World. An Official Web and Documentation Sites are currently being developed.`

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