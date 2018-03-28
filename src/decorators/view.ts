import {ReflectionKeys, IViewConfig, IViewHandler} from '../index';
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
