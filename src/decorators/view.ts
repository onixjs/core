import {ReflectionKeys, IViewRenderer} from '../index';
/**
 * @function ViewRenderer
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This decorator will request.
 */
export function ViewRenderer(Class: new () => IViewRenderer) {
  // Define View metadata
  Reflect.defineMetadata(
    ReflectionKeys.INJECTABLE_RENDERER,
    true,
    Class.prototype,
  );
}
