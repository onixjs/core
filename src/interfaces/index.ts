import {ChildProcess} from 'child_process';
import * as http from 'http';
import * as https from 'https';
import {AppNotifier} from '..';
import {OnixMessage, IRequest, IMetaData} from '@onixjs/sdk';
/**
 * @interface IAppConfig
 * @author Jonathan Casarrubias <gh: mean-expert-official>
 * @description This interface will provida configuration for
 * a given application.
 */
export interface IAppConfig {
  cwd?: string;
  // Port if network enabled
  port?: number;
  // If network enabled, a HTTP server will be created
  network?: {
    disabled: boolean;
    ssl?: ISSlConfig;
  };
  // Modules to be loaded for this application
  modules: Constructor[];
}
/**
 * @interface AppConstructor
 * @description Internal use, declares an app constructor
 * that receives a OnixRPC class.
 */
export interface AppConstructor {
  new (): IApp;
}
/**
 * @interface IModuleConfig
 * @author Jonathan Casarrubias
 * @description Interface that works as a development
 * contract to define which methods must be defined
 * within any module.
 */
export interface IModuleConfig {
  /**
   * @property components
   * @description Module components, these components
   * will be exposed through RPC API.
   */
  components: Constructor[];
  /**
   * @property renderers
   * @description renderers are injectables, decoupled from the
   * framework can be any javascript template render
   */
  renderers: (new () => IViewRenderer)[];
  /**
   * @property models
   * @description Models are injectables, decoupled from the
   * framework can be a model from any type of orm.
   * Not directly accessible through RPC API.
   */
  models: Constructor[];
  /**
   * @property services
   * @description Services are injectables, provides shared
   * functionalities within a module context.
   * Not directly accessible through RPC API.
   */
  services: Constructor[];
  /**
   * @property lifecycle
   * @description Custom module level lifecycle, it will execute
   * on any RPC call for any component living in this component.
   */
  lifecycle?: (
    models: ModelProvider,
    message: OnixMessage,
    method: OnixMethod,
  ) => Promise<any>;
  /**
   * @property models
   * @description This is an app level event emmiter, that will
   * be injected for app level notifications.
   */
  notifier?: AppNotifier;
}
/**
 * @interface ModuleDirectory
 * @description This interface defines an open
 * directory used for persisting module instances
 * on memory while the app is running.
 */
export interface IModuleDirectory {
  [name: string]: any;
}
/**
 * @interface IModel
 */
export interface IModel {
  [name: string]: any;
}
/**
 * @interface IModel
 */
export interface IModelDirectory {
  [name: string]: any;
}
/**
 * @interface IComponent
 * @author Jonathan Casarrubias
 * @description Interface that works as a development
 * contract to define which methods must be defined
 * within any component.
 */
export interface IComponent {
  init(): void;
  destroy(): void;
}
/**
 * @interface IDependency
 * @author Jonathan Casarrubias
 * @description Interface that works as a development
 * contract to define which methods must be defined
 * within any injectable.
 */
export interface IInjectable {
  provide: new () => void;
}
/**
 * @author Jonathan Casarrubias
 * @interface IApp
 * @description This interface is a contract that will
 * be used when creating new Application classes.
 */
export interface IApp {
  modules: IModuleDirectory;
  start(): Promise<boolean>;
  stop(): Promise<boolean>;
  isAlive(): boolean;
}
/**
 * @interface ICallConfig
 * @author Jonathan Casarrubias
 * @description ICallConfig inteface will
 * be used to establish connection between
 * services within the same broker
 */
export interface ICallConfig {
  app: string;
  module: string;
  component: string;
  method: string;
  broker: {
    host?: string;
    port: number;
  };
}
/**
 * @interface ICallConfig
 * @author Jonathan Casarrubias
 * @description IOnixSchema provides an
 * interface for a schema published by an OnixBroker.
 */
export interface IOnixSchema {
  [key: string]: {
    modules: {
      [key: string]: {
        [key: string]: {
          [key: string]: string;
        };
      };
    };
  };
}
/**
 * @author Jonathan Casarrubias
 * @interface IAppDirectory
 * @description Child process directory for the onix
 * process manager. This directory is used for signaling
 * purposes on each RPC Call.
 */
export interface IAppDirectory {
  [key: string]: {
    config?: IAppConfig;
    process: ChildProcess;
  };
}
/**
 * @interface IComponentDirectory
 * @author Jonathan Casarrubias
 * @description IComponentDirectory inteface (TODO IMPLEMENT WHEN CREATING SDK)
 */
export interface IComponentDirectory {
  [key: string]: any;
}
/**
 * @interface Constructor
 * @author Jonathan Casarrubias
 * @description Interface used as generic Constructor class.
 */
export interface Constructor {
  new (...args: any[]): any;
}
/**
 * @interface IDataSource
 * @author Jonathan Casarrubias
 * @description Interface used as contract when declaring
 * DataSources.
 */
export interface IDataSource {
  connect();
  disconnect();
  register(register: IModelRegister): Promise<IModelRegister>;
}
/**
 * @interface IModelConfig
 * @author Jonathan Casarrubias
 * @description Interface used as contract when declaring
 * models.
 */
export interface IModelConfig {
  datasource: new () => IDataSource;
  hooks?: {
    before?: (register: IModelRegister) => Promise<IModelRegister>;
    after?: (register: IModelRegister) => Promise<IModelRegister>;
  };
}

export interface IModelRegister {
  class: Constructor;
  model;
  schema;
}
/**
 * @interface AccessType
 * @author Jonathan Casarrubias
 * @description Interface used as contract when declaring
 * acl.
 */
export enum AccessType {
  /*0*/ ALLOW,
  /*1*/ DENY,
}
/**
 * @interface IACL
 * @author Jonathan Casarrubias
 * @description Interface used as contract when declaring
 * acl.
 */
export interface IACL extends Array<new () => IACLRule> {}
/**
 * @interface IACLRule
 * @author Jonathan Casarrubias
 * @description Interface used as contract when declaring
 * acl.
 */
export interface IACLRule {
  access: number;
  methods: string[];
  groups: GroupList;
}
export interface GroupList extends Array<new () => IGroup> {}
export interface IGroup {
  access(request: IRequest, rule: AccessType): Promise<boolean> | boolean;
}
/**
 * @interface IComponentConfig
 * @author Jonathan Casarrubias
 * @description Interface used as contract when declaring
 * acl.
 */
export interface IComponentConfig {
  // Optional Access Control List
  // If not ACL is provided, then all methods wont
  // be public, by default all of them are closed
  acl?: IACL;
  // Optional route path, will be used as base
  // For any HTTP endpoint declared within a component
  route?: string;
  /* Optional lifecycle, if defined it will be executed
  after the module lifecycle, it won't override but
  it will execute after the module's one */
  lifecycle?: (
    models: ModelProvider,
    message: OnixMessage,
    method: OnixMethod,
  ) => Promise<any>;
}

export interface OnixMethod {
  (): Promise<any>;
}

export interface ModelProvider {
  <T>(name: string): T;
}

export interface IMiddleware extends IViewConfig {
  param?: IRouterParamConfig;
  method: string;
  type: RouterTypes;
}

export interface IViewConfig {
  endpoint?: string;
  file?: string;
  method?: string;
}

export interface ISSlConfig {
  key?: string;
  cert?: string;
  // Serve SSL Activation File (OnixJS Host)
  // will usually serve .well-knon/activationfile.txt
  activation?: {
    endpoint: string;
    path: string;
  };
}

export interface DomainConfig {
  host?: string;
  port?: number;
}

export interface OnixConfig extends DomainConfig {
  cwd?: string;
  // If network enabled, a HTTP server will be created
  network?: {
    ssl?: ISSlConfig;
  };
  // WebSocket Adapter
  adapters: {
    websocket: new () => WebSocketAdapter;
  };
}

export interface WebSocketAdapter {
  WebSocket(server: http.Server | https.Server);
}

export interface BootConfig {
  apps: string[];
  identityProvider?: DomainConfig;
}
export interface HTTPMethodsDirectory {
  get: {[key: string]: HttpRequestHandler};
  post: {[key: string]: HttpRequestHandler};
  patch: {[key: string]: HttpRequestHandler};
  put: {[key: string]: HttpRequestHandler};
  update: {[key: string]: HttpRequestHandler};
  delete: {[key: string]: HttpRequestHandler};
}
export interface HttpRequestHandler {
  (req: http.IncomingMessage, res: http.ServerResponse): void;
}

export interface IRESTConfig {
  uri: string;
  method?: string;
}

export interface IRESTArgument {
  name: string;
  type: object;
  source: string;
}

export interface IPropertyConfig {
  name: string;
  type: object;
}

export interface Directory {
  [key: string]: any;
}

export interface IErrorResponse {
  code: number;
  message: string;
  stack?: string;
}

export interface IOnixStatus {}

export interface IRouterParamConfig {
  name: string;
  as: string;
}

export interface IView {
  file: string;
  handler: IViewHandler;
}

export interface IViewHandler {
  (req: OnixHTTPRequest, buffer: Buffer): Promise<string>;
}

export interface IRouteHandler {
  (req: OnixHTTPRequest, res: http.ServerResponse, next: () => void): Promise<
    any
  > | void;
}

export interface IRouteParamHandler {
  (req: OnixHTTPRequest, param): Promise<any> | void;
}

export interface IViewDirectory {
  [key: string]: IView;
}

export interface OnixHTTPRequest extends http.IncomingMessage {
  query: {[key: string]: any};
  post: {[key: string]: any} | string;
}

export interface IViewRenderer {
  process(view: string, args: Directory): string;
}

export interface RPCMethod {
  (payload: any, metadata: IMetaData);
}

export interface StreamMethod {
  <T>(payload: T, metadata: IMetaData, uuid: string): Promise<T>;
}

/**
 * @author Jonathan Casarrubias
 * @enum ReflectionKeys
 * @description Enum used for reflection purposes,
 */
export enum ReflectionKeys {
  /*0*/ MODULE_CONFIG,
  /*1*/ DATA_SOURCE,
  /*2*/ MODEL_SCHEMA,
  /*3*/ COMPONENT_CONFIG,
  /*4*/ MODULE_COMPONENTS,
  /*5*/ APP_MODULES,
  /*6*/ MODULE_REFERENCE,
  /*6*/ COMPONENT_LIFECYCLE,
  /*7*/ RPC_METHOD,
  /*8*/ STREAM_METHOD,
  /*9*/ MODULE_NAME,
  /*10*/ IDENTITY_PROVIDER_CONFIG,
  /*11*/ REST_METHOD,
  /*12*/ MODEL_PROPERTY,
  /*13*/ INJECT_REQUEST,
  /*14*/ INJECTABLE_MODEL,
  /*15*/ INJECTABLE_SERVICE,
  /*16*/ INJECTABLE_DATASOURCE,
  /*17*/ MIDDLEWARE,
  /*18*/ INJECTABLE_RENDERER,
  /*18*/ INJECTABLE_NOTIFIER,
}

export enum HTTPMethods {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export enum RouterTypes {
  USE,
  ALL,
  HTTP,
  VIEW,
  PARAM,
  STATIC,
}
