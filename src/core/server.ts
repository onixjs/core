import 'reflect-metadata';
import {
  OperationType,
  IApp,
  ICall,
  OnixRPC,
  LifeCycle,
  IAppOperation,
  IModule,
  IComponent,
  IConfig,
  ReflectionKeys,
  IDataSource,
  Injector,
} from '../index';
import * as grpc from 'grpc';
/**
 * @function Gateway
 * @author Jonathan Casarrubias
 * @param operation
 * @license MIT
 * @description This function will handle process communication
 * between the Onix app and every booted application.
 */
export class OnixServer {
  /**
   * @property server
   * @description grpc server
   */
  private server: grpc.Server = new grpc.Server();
  /**
   * @property lifecycle
   * @description default lifecycle
   */
  private lifecycle: LifeCycle = new LifeCycle();
  /**
   * @property app
   * @description Current process application reference
   */
  private app: IApp;
  /**
   * @constructor
   * @param config
   * @author Jonathan Casarrubias
   * @license MIT
   * @description Gateway constructor, it will
   */
  constructor(
    private Class: new (rpc: OnixRPC) => IApp,
    private config: IConfig,
  ) {
    // Setup Node Process
    process.on('message', (operation: IAppOperation) =>
      this.operation(operation),
    );
  }
  /**
   * @method operation
   * @param operation
   * @author Jonathan Casarrubias
   * @license MIT
   * @description Handles operation between processes.
   * Each application boots a gateway instance in order
   * to be coordinated with other onix applications.
   */
  private async operation(operation: IAppOperation) {
    // Verify we got a valid operation
    if (process.send && (typeof operation !== 'object' || !operation.type))
      process.send('Onix app: unable to get child operation type');
    // Switch case valid operations
    switch (operation.type) {
      case OperationType.APP_CREATE:
        this.app = new this.Class(new OnixRPC(this.Class));
        this.config.modules.forEach((Module: new () => IModule) => {
          this.app[Module.name] = new Module();
          const config: IModule = Reflect.getMetadata(
            ReflectionKeys.MODULE_CONFIG,
            this.app[Module.name],
          );
          if (config.models)
            // Create Components Instances
            config.models.forEach((Model: new () => void) => {
              console.log('Initializing Model: ', Model.name);
              const datasource: IDataSource = Injector.get(
                Reflect.getMetadata(ReflectionKeys.DATA_SOURCE, Model),
              );
              Injector.set(
                Model.name,
                datasource.register(Model.name, new Model()),
              );
            });
          if (config.services)
            // Create Components Instances
            config.services.forEach((Service: new () => void) => {
              console.log('Initializing Service: ', Service.name);
              if (!Injector.get(Service.name))
                Injector.set(Service.name, new Service());
            });
          if (config.components)
            // Create Components Instances
            config.components.forEach((Component: new () => IComponent) => {
              console.log('Initializing Component: ', Component.name);
              this.app[Module.name][Component.name] = new Component();
              this.app[Module.name][Component.name].init(); // Might be migrated to other point
            });
        });
        if (process.send)
          process.send({type: OperationType.APP_CREATE_RESPONSE});
        break;
      case OperationType.APP_PING:
        if (process.send)
          process.send({
            type: OperationType.APP_PING_RESPONSE,
            message: this.config,
          });
        break;
      case OperationType.APP_START:
        console.log(
          'Loading Proto Server: ',
          `${this.config.host}:${this.config.port}`,
        );
        this.server.bind(
          `${this.config.host}:${this.config.port}`,
          grpc.ServerCredentials.createInsecure(),
        );
        this.server.start();
        await this.app.start();
        if (process.send)
          process.send({type: OperationType.APP_START_RESPONSE});
        break;
      case OperationType.APP_STOP:
        await this.app.stop();
        this.server.forceShutdown();
        if (process.send) process.send({type: OperationType.APP_STOP_RESPONSE});
        break;
      case OperationType.ONIX_REMOTE_CALL_PROCEDURE:
        console.log(
          `Onix callee app ${this.Class.name} got remote call procedure`,
        );
        const message: ICall = <ICall>operation.message;
        console.log(
          `Onix callee app ${this.Class.name} processing rpc ${message.rpc}`,
        );
        const segments: string[] = message.rpc.split('.');
        let result;
        result = await this.lifecycle[
          segments.length === 2
            ? 'onAppMethodCall'
            : segments.length === 3
              ? 'onModuleMethodCall'
              : 'onComponentMethodCall'
        ](this.app, async (): Promise<any> => {
          if (segments.length === 2) {
            return this.app[segments[1]](message.request);
          }
          if (segments.length === 3)
            return this.app[segments[1]][segments[2]](message.request);
          if (segments.length === 4)
            return this.app[segments[1]][segments[2]][segments[3]](
              message.request,
            );
          console.log(
            `Onix callee app ${this.Class.name} unable to find rpc method ${
              message.rpc
            }`,
          );
        });
        console.log(
          `Onix callee app ${this.Class.name} sending rpc result`,
          result,
        );
        if (process.send)
          process.send({
            type: OperationType.ONIX_REMOTE_CALL_PROCEDURE_RESPONSE,
            message: result,
          });
        break;
      case OperationType.APP_GREET:
        let apps: string[] = <string[]>operation.message;
        apps = apps.filter((name: string) => this.Class.name !== name);
        const results: boolean[] = await this.greet(apps);
        if (process.send)
          process.send({
            type: OperationType.APP_GREET_RESPONSE,
            message: results,
          });
        break;
    }
  }
  /**
   * @method greet
   * @param apps
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This method will coordinate every loaded
   * application within this server in order to confirm all
   * off the applications are up and running.
   */
  private async greet(apps: string[]): Promise<boolean[]> {
    return Promise.all(
      apps.map(
        (name: string) =>
          new Promise<boolean>(async (resolve, reject) => {
            const result: boolean = await this.app.rpc
              .topic(`${name}.isAlive`)
              .call();
            resolve(result);
          }),
      ),
    );
  }
}
