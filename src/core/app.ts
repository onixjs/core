import {IApp, IAppConfig, IModuleDirectory} from '../index';
/**
 * @class App
 * @author Jonathan Casarrubias
 * @license MIT
 * @description App class that creates a context wrapper for specified
 * components and modules. Since a project might have multiple Apps in
 * a service oriented architecture pattern (SOA), each app will have
 * isolated components and modules.
 **/
export class Application implements IApp {
  modules: IModuleDirectory = {};

  isAlive(): boolean {
    return true;
  }
  /**
   * @access IAppConfig
   * @description
   * Current configuration for this App instance.
   */
  readonly config: IAppConfig;
  /**
   * @method constructor
   * @param config
   * @description
   * Receives optional configurations as parameter.
   * Otherwise will use platform default configuration.
   */
  constructor() {}
  /**
   * @method start
   * @description Mock start method, this might be replaced
   * by custom App level functionality
   */
  async start(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      Object.keys(this.modules).forEach((moduleName: string) => {
        Object.keys(this.modules[moduleName]).forEach(
          (componentName: string) => {
            if (
              typeof this.modules[moduleName][componentName].init === 'function'
            ) {
              this.modules[moduleName][componentName].init();
            }
          },
        );
      });
      resolve(true);
    });
  }
  /**
   * @method stop
   * @description Mock stop method, this might be replaced
   * by custom App level functionality
   */
  async stop(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      Object.keys(this.modules).forEach((moduleName: string) => {
        Object.keys(this.modules[moduleName]).forEach(
          (componentName: string) => {
            if (
              typeof this.modules[moduleName][componentName].destroy ===
              'function'
            ) {
              this.modules[moduleName][componentName].destroy();
            }
          },
        );
      });
      resolve(true);
    });
  }
}
