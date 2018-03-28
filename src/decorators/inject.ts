import {Constructor, ReflectionKeys, IViewRenderer} from '../interfaces';
import {AppNotifier} from '../core/app.notifier';
export namespace Inject {
  /**
   * @function Render
   * @author Jonathan Casarrubias
   * @param Class
   * @license MIT
   * @description Decorator used to inject an app notifier
   */
  export function Renderer(Class: new () => IViewRenderer) {
    return (target: any, property: string) => {
      // Verify the class is actually a model class
      if (
        !Reflect.hasMetadata(
          ReflectionKeys.INJECTABLE_RENDERER,
          Class.prototype,
        )
      ) {
        throw new Error(
          `ONIXJS Error: Invalid injectable render class ${
            Class.name
          }, it is not a valid view renderer.`,
        );
      }
      // Temporaly intialize the property otherwise will be "invisible"
      // By the moment we iterate over these properties in a future
      target[property] = true;
      // Adding this class as possible injectable class.
      // System will verify if this class is actually installed within the module.
      // It is a request because not necessarily an instance will be injected.
      Reflect.defineMetadata(
        ReflectionKeys.INJECT_REQUEST,
        {Class, type: 'renderer'},
        target,
        property,
      );
    };
  }
  /**
   * @function Notifier
   * @author Jonathan Casarrubias
   * @param Class
   * @license MIT
   * @description Decorator used to inject an app notifier
   */
  export function Notifier() {
    return (target: any, property: string) => {
      // Temporaly intialize the property otherwise will be "invisible"
      // By the moment we iterate over these properties in a future
      target[property] = true;
      // Adding this class as possible injectable class.
      // System will verify if this class is actually installed within the module.
      // It is a request because not necessarily an instance will be injected.
      Reflect.defineMetadata(
        ReflectionKeys.INJECT_REQUEST,
        {Class: AppNotifier, type: 'notifier'},
        target,
        property,
      );
    };
  }
  /**
   * @function Model
   * @author Jonathan Casarrubias
   * @param Class
   * @license MIT
   * @description Decorator used to inject models
   */
  export function Model(Class: Constructor) {
    return (target: any, property: string) => {
      // Verify the class is actually a model class
      if (
        !Reflect.hasMetadata(ReflectionKeys.INJECTABLE_MODEL, Class.prototype)
      ) {
        throw new Error(
          `ONIXJS Error: Invalid injectable model class ${
            Class.name
          }, it is not a valid model.`,
        );
      }
      // Temporaly intialize the property otherwise will be "invisible"
      // By the moment we iterate over these properties in a future
      target[property] = true;
      // Adding this class as possible injectable class.
      // System will verify if this class is actually installed within the module.
      // It is a request because not necessarily an instance will be injected.
      Reflect.defineMetadata(
        ReflectionKeys.INJECT_REQUEST,
        {Class, type: 'model'},
        target,
        property,
      );
    };
  }
  /**
   * @function Service
   * @author Jonathan Casarrubias
   * @param Class
   * @license MIT
   * @description Decorator used to inject services
   */
  export function Service(Class: Constructor) {
    return (target: any, property: string) => {
      // Verify the class is actually a model class
      if (
        !Reflect.hasMetadata(ReflectionKeys.INJECTABLE_SERVICE, Class.prototype)
      ) {
        throw new Error(
          `ONIXJS Error: Invalid injectable service class ${
            Class.name
          }, it is not a valid service.`,
        );
      }
      // Temporaly intialize the property otherwise will be "invisible"
      // By the moment we iterate over these properties in a future
      target[property] = true;
      // Adding this class as possible injectable class.
      // System will verify if this class is actually installed within the module.
      // It is a request because not necessarily an instance will be injected.
      Reflect.defineMetadata(
        ReflectionKeys.INJECT_REQUEST,
        {Class, type: 'service'},
        target,
        property,
      );
    };
  }
}
