OnixJS - Enterprise Grade Framework
================
[![Coverage Status](https://coveralls.io/repos/github/onixjs/core/badge.svg?branch=master)](https://coveralls.io/github/onixjs/core?branch=master) [![Travis](https://img.shields.io/travis/onixjs/core.svg)](https://travis-ci.org/onixjs/core) [![npm (scoped)](https://img.shields.io/npm/v/@onixjs/core.svg)](http://npmjs.com/package/@onixjs/core) [![Beerpay](https://beerpay.io/onixjs/core/make-wish.svg?style=flat)](https://beerpay.io/onixjs/core?focus=wish)
![alt text](https://raw.githubusercontent.com/onixjs/core/master/misc/onix-splash.png "OnixJS")


> **Disclaimer**: This framework is in active development and won't be ready for production until we reach release candidate.
 - **Alpha release date**: Feb 2018
 - **Estimated date for beta release**: MAY 15 2018
 - **Estimated date for release candidate**: EO2Q/2018

## Installation

````sh
$ npm install --save @onixjs/core
````
## Features

The **[OnixJS] Framework** is an ***Enterprise Grade*** **Node.JS** platform that implements only **Industry Standards** and **Patterns** in order provide the best development experience possible:

- High-Availability
- High-Performance
- Built-in *TypeScript*
- Single Sign On (*[OIDC] IdP / SSO*)
- Isomorphic [SDK] *For ES6+/TypeScript Clients that runs on Browser, Mobile, Node.JS*
- Dependency Injection (*DI*)
- Middleware Router
- Compatibility with middleware based modules (e.g. express/bodyparser)
- View Renderer Compatible with any JS Template Engine (*DoT, EJS, Etc*)
- Supported Architectural Patterns: *SOA, MSA and MVC*.
- Representational State Transfer API (*REST API*)
- Remote Procedure Call and Streams API (*RPC/RPCS APIs*)
- Module and Component Level LifeCycles (*Hooks*)
- Back-end compatible with any *ORM* (*LoopBack's Datasource Juggler, Mongoose, Sequelize, TypeORM, Etc*)

## Documentation
The following link will take you to the [OnixJS Documentation](https://github.com/onixjs/core/wiki)

>DISCLAIMER: The wiki is a temporal documentation created to start guiding developers into the [OnixJS] World. An Official Web and More Complete Documentation Sites are currently being developed.

**Examples:** [https://github.com/onixjs/examples](https://github.com/onixjs/examples)

## Philosophy
The **[OnixJS] FrameWork** is an ***Enterprise Grade*** **Node.JS** platform that implements only **Industry Standards** and **Patterns**.

**Core Objectives**


- **Slightly Opinionated**: Though [OnixJS] provide with a business logic structure based on *SOA*, *MSA* and it does specify how to communicate your services or clients, *we do empower you* to decide which *Front-End Framework*, *ORM* or even an *Server Side Renderer* (Template Engine) to install. By using any of our provided [Factories], you'll be free to make most of the important decisions.
- **Stability**: We strongly believe that providing a highly featured, tested or covered platform might be great but definitely not enough. We also believe that staging or deploying a project now or in a year MUSTN'T be affected by the Framework or any of its dependencies, being that the reason of why we decided to use the lowest amount of dependencies possible. 
- **High-Availability**: Either you choose Monolithic *SOA* or *MSA*, your services will run independently in separated processes. While implementing the right patterns and infrastructure, any failure on either of your services won't block or disable access to users or other services.
- **High-Performance**: [OnixJS] provides with a really small footprint, we don't really add unnecessary and unused features, instead we provide you with artifacts all based on established design patterns for you to build projects with ease, as well as providing ways to flawlessly communicate services and clients. 
- **Security**: [OnixJS] provides with a fully [OIDC] featured *Single Sign On* IdP, so you can start avoiding expenses on authentication and authorization issues due far simplistic auth implementations not suited for enterprise grade projects.
- **Compatibility**: A must have goal is to provide not only compatibility with other Middleware Based Node.JS Frameworks, but as described before; compatibility with any ORM, Template Engine, Front-End Framework and even other Programming Languages using the REST API or the [OnixJS] REST Gateway.
- **Communication**: With the [OnixJS] [Isomorphic] [SDK] you'll be able to easily communicate services to services or services to clients. *Don't want to communicate services over network? No problem, communicate services using STD IO Streams.*


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
## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
| [<img src="https://avatars0.githubusercontent.com/u/1533239?v=3" width="100px;"/><br /><sub>Jonathan Casarrubias</sub>](http://mean.expert/)<br />[💻](https://github.com/onixjs/core/commits?author=jonathan-casarrubias) | [<img src="https://avatars1.githubusercontent.com/u/12107518?v=3" width="100px;"/><br /><sub>Andres David Jimenez</sub>](https://plus.google.com/+AndresJimenezS/posts)<br />[💡](https://github.com/onixjs/examples/commits?author=kattsushi) | [<img src="https://avatars0.githubusercontent.com/u/40091?s=460&v=4" width="100px;"/><br /><sub>Paul Warelis</sub>](https://github.com/pwarelis)<br />[📖](https://github.com/onixjs/core/commits?author=pwarelis) | [<img src="https://avatars0.githubusercontent.com/u/17414885?s=460&v=4" width="100px;"/><br /><sub>Miguel Serrano</sub>](https://github.com/Serranom4)<br />[💻](https://github.com/onixjs/sdk/commits?author=Serranom4)[💡](https://github.com/onixjs/examples/commits?author=Serranom4) | [<img src="https://avatars1.githubusercontent.com/u/2659407?s=460&v=4" width="100px;"/><br /><sub>Ixshel Escamilla</sub>](https://github.com/ixshelescamilla)<br />[📋](https://github.com/onixjs)[🔍](https://github.com/onixjs) | [<img src="https://avatars0.githubusercontent.com/u/7293874?s=460&v=4" width="100px;"/><br /><sub>Raul Vargas</sub>](https://github.com/raul26)<br />[🔌](https://github.com/onixjs/vcode/commits?author=raul26) |
| :---: | :---: | :---: | :---: | :---: | :---: |
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/kentcdodds/all-contributors) specification. Contributions of any kind welcome!


[OnixJS]: http://onixjs.io
[Factories]: https://en.wikipedia.org/wiki/Factory_method_pattern
[Factory Methid]: https://en.wikipedia.org/wiki/Factory_method_pattern
[OIDC]: http://openid.net/connect/
[Isomorphic]: https://en.wikipedia.org/wiki/Isomorphic_JavaScript
[SDK]: https://github.com/onixjs/sdk
