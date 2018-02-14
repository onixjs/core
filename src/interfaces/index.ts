import {ChildProcess} from 'child_process';
import {OnixRPC} from '../index';
/**
 * @interface IConfig
 * @author Jonathan Casarrubias <gh: mean-expert-official>
 * @description This interface will provida configuration features
 * for the Onix platform
 */
export interface IConfig {
  host: string;
  port: number;
  modules: Constructable[];
}
/**
 * @interface IModule
 * @author Jonathan Casarrubias
 * @description Interface that works as a development
 * contract to define which methods must be defined
 * within any module.
 */
export interface IModule {
  /**
   * @property components
   * @description Module components, these components
   * will be exposed through RPC API.
   */
  components: Constructable[];
  /**
   * @property models
   * @description Models are injectables, decoupled from the
   * framework can be a model from any type of orm.
   * Not directly accessible through RPC API.
   */
  models: Constructable[];
  /**
   * @property services
   * @description Services are injectables, provides shared
   * functionalities within a module context.
   * Not directly accessible through RPC API.
   */
  services: Constructable[];
}
/**
 * @interface ModuleDirectory
 * @description This interface defines an open
 * directory used for persisting module instances
 * on memory while the app is running.
 */
export interface ModuleDirectory {
  [name: string]: IModule;
}
/**
 * @interface IModel
 */
export interface IModel {
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
  rpc: OnixRPC;
  start(): Promise<null>;
  stop(): Promise<null>;
  isAlive(): boolean;
}
/**
 * @author Jonathan Casarrubias
 * @interface IAppOperation
 * @description Internal system operation, executed when
 * RPC calls are made.
 */
export interface IAppOperation {
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
  [key: string]: ChildProcess;
}
/**
 * @interface IRequest
 * @author Jonathan Casarrubias
 * @description IRequest inteface (TODO IMPLEMENT WHEN CREATING SDK)
 */
export interface IRequest {
  [key: string]: any;
}
/**
 * @interface ICall
 * @author Jonathan Casarrubias
 * @description ICALL inteface (TODO IMPLEMENT WHEN CREATING SDK)
 * add headers / options
 */
export interface ICall {
  rpc: string;
  request: IRequest;
}
/**
 * @interface Constructable
 * @author Jonathan Casarrubias
 * @description Interface used as generic Constructable class.
 */
export interface Constructable {
  new (...args: any[]): void;
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
  register(name: string, schema: any);
}
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
  /*12*/ ONIX_REMOTE_CALL_PROCEDURE,
  /*13*/ ONIX_REMOTE_CALL_PROCEDURE_RESPONSE,
}
/**
 * @author Jonathan Casarrubias
 * @enum ReflectionKeys
 * @description Enum used for reflection purposes,
 */
export enum ReflectionKeys {
  /*0*/ MODULE_CONFIG,
  /*1*/ DATA_SOURCE,
}
