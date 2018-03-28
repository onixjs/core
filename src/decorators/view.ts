import {
  ReflectionKeys,
  IViewConfig,
  IViewHandler,
  IViewRenderer,
} from '../index';
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
    name: string,
    descriptor: TypedPropertyDescriptor<IViewHandler>,
  ) {
    // Initialize view property
    target[name] = null;
    // Define View metadata
    Reflect.defineMetadata(ReflectionKeys.ROUTE_VIEW, config, target, name);
  };
}
/**
 * @function ViewRenderer
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This decorator will request.
 */
export function ViewRenderer(renderer: new () => IViewRenderer) {
  // Define View metadata
  Reflect.defineMetadata(
    ReflectionKeys.INJECTABLE_RENDERER,
    true,
    renderer.prototype,
  );
}
