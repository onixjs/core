import {
  IMiddleware,
  RouterTypes,
  ReflectionKeys,
  IViewConfig,
  IViewHandler,
  IRouteHandler,
  IRouterParamConfig,
} from '..';
/**
 * @namespace Router
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This namespace provides several decorators
 * related to routing, this framework implements middleware
 * functionality which provides compatibility with any
 * middleware based framework, such as express, koa, etc.
 *
 * Any plugin made for those frameworks will be supported
 * in OnixJS, though OnixJS is not build on top of any of
 * those frameworks, compatibility is important :)
 */
export namespace Router {
  /**
   * @function GET
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This function will decorate a GET Middleware
   */
  export function Get(path?: string) {
    return function(
      target: object,
      method: string,
      descriptior: TypedPropertyDescriptor<IRouteHandler>,
    ) {
      Reflect.defineMetadata(
        ReflectionKeys.MIDDLEWARE,
        <IMiddleware>{
          method: 'GET',
          type: RouterTypes.HTTP,
          endpoint: path || method,
        },
        target,
        method,
      );
    };
  }
  /**
   * @function POST
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This function will decorate a POST Middleware
   */
  export function Post(path?: string) {
    return function(
      target: object,
      method: string,
      descriptior: TypedPropertyDescriptor<IRouteHandler>,
    ) {
      Reflect.defineMetadata(
        ReflectionKeys.MIDDLEWARE,
        <IMiddleware>{
          method: 'POST',
          type: RouterTypes.HTTP,
          endpoint: path || method,
        },
        target,
        method,
      );
    };
  }
  /**
   * @function PATCH
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This function will decorate a PATCH Middleware
   */
  export function Patch(path?: string) {
    return function(
      target: object,
      method: string,
      descriptior: TypedPropertyDescriptor<IRouteHandler>,
    ) {
      Reflect.defineMetadata(
        ReflectionKeys.MIDDLEWARE,
        <IMiddleware>{
          method: 'PATCH',
          type: RouterTypes.HTTP,
          endpoint: path || method,
        },
        target,
        method,
      );
    };
  }
  /**
   * @function PUT
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This function will decorate a PUT Middleware
   */
  export function Put(path?: string) {
    return function(
      target: object,
      method: string,
      descriptior: TypedPropertyDescriptor<IRouteHandler>,
    ) {
      Reflect.defineMetadata(
        ReflectionKeys.MIDDLEWARE,
        <IMiddleware>{
          method: 'PUT',
          type: RouterTypes.HTTP,
          endpoint: path || method,
        },
        target,
        method,
      );
    };
  }
  /**
   * @function HEAD
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This function will decorate a HEAD Middleware
   */
  export function Head(path?: string) {
    return function(
      target: object,
      method: string,
      descriptior: TypedPropertyDescriptor<IRouteHandler>,
    ) {
      Reflect.defineMetadata(
        ReflectionKeys.MIDDLEWARE,
        <IMiddleware>{
          method: 'HEAD',
          type: RouterTypes.HTTP,
          endpoint: path || method,
        },
        target,
        method,
      );
    };
  }
  /**
   * @function DELETE
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This function will decorate a DELETE Middleware
   */
  export function Delete(path?: string) {
    return function(
      target: object,
      method: string,
      descriptior: TypedPropertyDescriptor<IRouteHandler>,
    ) {
      Reflect.defineMetadata(
        ReflectionKeys.MIDDLEWARE,
        <IMiddleware>{
          method: 'DELETE',
          type: RouterTypes.HTTP,
          endpoint: path || method,
        },
        target,
        method,
      );
    };
  }
  /**
   * @function USE
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This function will decorate a USE Middleware
   */
  export function Use(path?: string) {
    return function(
      target: object,
      method: string,
      descriptior: TypedPropertyDescriptor<IRouteHandler>,
    ) {
      Reflect.defineMetadata(
        ReflectionKeys.MIDDLEWARE,
        <IMiddleware>{
          method: 'USE',
          type: RouterTypes.USE,
          endpoint: path,
        },
        target,
        method,
      );
    };
  }
  /**
   * @function ALL
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This function will decorate a ALL Middleware
   */
  export function All() {
    return function(
      target: object,
      method: string,
      descriptior: TypedPropertyDescriptor<IRouteHandler>,
    ) {
      Reflect.defineMetadata(
        ReflectionKeys.MIDDLEWARE,
        <IMiddleware>{
          method: 'ALL',
          type: RouterTypes.ALL,
        },
        target,
        method,
      );
    };
  }
  /**
   * @function Param
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This function will decorate a PARAM Middleware
   */
  export function Param(param: IRouterParamConfig) {
    return function(
      target: object,
      method: string,
      descriptior: TypedPropertyDescriptor<IRouteHandler>,
    ) {
      Reflect.defineMetadata(
        ReflectionKeys.MIDDLEWARE,
        <IMiddleware>{
          method: 'PARAM',
          type: RouterTypes.PARAM,
          param,
        },
        target,
        method,
      );
    };
  }
  /**
   * @function Static
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This function will decorate a STATIC Middleware
   */
  export function Static(path: string) {
    return function(
      target: object,
      method: string,
      descriptior: TypedPropertyDescriptor<IViewHandler>,
    ) {
      Reflect.defineMetadata(
        ReflectionKeys.MIDDLEWARE,
        <IMiddleware>{
          method: 'STATIC',
          type: RouterTypes.STATIC,
          endpoint: path,
        },
        target,
        method,
      );
    };
  }
  /**
   * @function View
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This decorator will define model
   * View type.
   */
  export function View(config: IViewConfig) {
    return function(
      target: object,
      method: string,
      descriptor: TypedPropertyDescriptor<IViewHandler>,
    ) {
      // Define View metadata
      Reflect.defineMetadata(
        ReflectionKeys.MIDDLEWARE,
        Object.assign(
          <IMiddleware>{
            method: 'GET',
            type: RouterTypes.VIEW,
            file: config.file,
          },
          config,
        ),
        target,
        method,
      );
    };
  }
}
