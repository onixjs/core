import 'reflect-metadata';
import {Injector} from '../core';
import {Constructor} from '../interfaces';
/**
 * @author Jonathan Casarrubias
 * @param Class
 * @license MIT
 * @description Decorator used to inject models
 */
export function Inject(Class: Constructor) {
  return (target: any, property: string) => {
    let attempts: number = 0;
    // Inject instance into the target class
    const interval = setInterval(() => {
      if (attempts > 100) {
        console.log(`Unable to load ${Class.name} model within 10 attempts`);
        clearInterval(interval);
      } else {
        if (Injector.has(Class.name)) {
          target[property] = Injector.get(Class.name);
          clearInterval(interval);
        } else {
          attempts += 1;
        }
      }
    }, 10);
  };
}
