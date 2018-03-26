import {ChildProcess} from 'child_process';
import * as http from 'http';
/**
 * @interface IAppConfig
 * @author Jonathan Casarrubias <gh: mean-expert-official>
 * @description This interface will provida configuration for
 * a given application.
 */
export interface IAppConfig extends DomainConfig {
  // If network enabled, an HTTP server will be created
  // Else only OS IO Streams will be used.
  disableNetwork?: boolean;
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
    app: IApp,
    metadata: IMetaData,
    method: () => Promise<any>,
  ) => Promise<any>;
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
 * @author Jonathan Casarrubias
 * @interface IAppOperation
 * @description Internal system operation, executed when
 * RPC calls are made.
 */
export interface IAppOperation {
  uuid: string;
  type: OperationType;
  message: any;
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
 * @interface IRequest
 * @author Jonathan Casarrubias
 * @description IRequest inteface (TODO IMPLEMENT WHEN CREATING SDK)
 */
export interface IRequest {
  metadata: {[key: string]: any; stream: boolean};
  payload: any;
}
/**
 * @interface OnixMessage
 * @author Jonathan Casarrubias
 * @description OnixMessage inteface for internal (OS Event communication)
 */
export interface OnixMessage {
  uuid: string;
  rpc: string;
  request: IRequest;
}
/**
 * @interface IMetaData
 * @author Jonathan Casarrubias
 * @description Interface used as generic IMetaData class.
 */
export interface IMetaData {
  [key: string]: any;
  token?: string;
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
  connect(): void;
  disconnect(): void;
  register(name: string, model: any, schema: IModel);
}
/**
 * @interface IModelConfig
 * @author Jonathan Casarrubias
 * @description Interface used as contract when declaring
 * models.
 */
export interface IModelConfig {
  datasource: new () => IDataSource;
  schema?: {[key: string]: any};
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
export interface IACL {
  [key: string]: IACLRule;
}
/**
 * @interface IComponentConfig
 * @author Jonathan Casarrubias
 * @description Interface used as contract when declaring
 * acl.
 */
export interface IComponentConfig {
  ACL?: IACLRule[];
  /* Optional lifecycle, if defined it will be executed
  after the module lifecycle, it won't override but
  it will execute after the module's one */
  lifecycle?: (
    app: IApp,
    metadata: IMetaData,
    method: () => Promise<any>,
  ) => Promise<any>;
}

/**
 * @interface IACLRule
 * @author Jonathan Casarrubias
 * @description Interface used as contract when declaring
 * acl.
 */
export interface IACLRule {
  access: number;
  methods: string[];
  roles: (new () => IRole)[];
}
/**
 * @interface IRole
 * @author Jonathan Casarrubias
 * @description Interface used as contract when declaring
 * acl.
 */
export interface IRole {
  access(name: string, request: any): Promise<boolean>;
}

export interface ISSlConfig {
  key: string;
  cert: string;
}

export interface DomainConfig {
  host?: string;
  port?: number;
}

export interface OnixConfig extends DomainConfig {
  cwd?: string;
  ssl?: ISSlConfig;
}

export interface BootConfig {
  apps: string[];
  identityProvider?: DomainConfig;
}

export interface EndpointDirectory {
  [key: string]: HttpRequestHandler;
}
export interface HttpRequestHandler {
  (req: http.IncomingMessage, res: http.ServerResponse): void;
}

export interface IRESTConfig {
  uri: string;
  method?: string;
  args: IRESTArgument[];
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

export interface ErrorResponse {
  code: number;
  message: string;
  stack?: string;
}

export interface IOnixStatus {}
/**
 * @author Jonathan Casarrubias
 * @enum OperationType
 * @description Enum used for system level operations.
 */
export enum OperationType {
  /*0*/ APP_CREATE,
  /*1*/ APP_CREATE_RESPONSE,
  /*2*/ APP_PING,
  /*3*/ APP_PING_RESPONSE,
  /*4*/ APP_START,
  /*5*/ APP_START_RESPONSE,
  /*6*/ APP_STOP,
  /*7*/ APP_STOP_RESPONSE,
  /*8*/ APP_DESTROY,
  /*9*/ APP_DESTROY_RESPONSE,
  /*10*/ APP_GREET,
  /*11*/ APP_GREET_RESPONSE,
  /*12*/ ONIX_REMOTE_CALL_STREAM,
  /*13*/ ONIX_REMOTE_CALL_PROCEDURE,
  /*14*/ ONIX_REMOTE_CALL_PROCEDURE_RESPONSE,
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
}
