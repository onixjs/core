export * from './seal';
import * as fs from 'fs';

function hasMethod(obj, name) {
  const desc = Object.getOwnPropertyDescriptor(obj, name);
  return !!desc && typeof desc.value === 'function';
}

function hasProperty(obj, name) {
  const desc = Object.getOwnPropertyDescriptor(obj, name);
  return !!desc && typeof desc.value !== 'function';
}

export function getObjectMethods(obj) {
  const array: string[] = [];
  iterateObject(obj, (p, n) => {
    if (hasMethod(p, n)) {
      array.push(n);
    }
  });
  return array;
}

export function getObjectProperties(obj) {
  const array: string[] = [];
  iterateObject(obj, (p, n) => {
    if (hasProperty(p, n)) {
      array.push(n);
    }
  });
  return array;
}

function iterateObject(obj, next) {
  let proto = Object.getPrototypeOf(obj);
  while (proto) {
    Object.getOwnPropertyNames(proto).forEach(name => {
      if (name !== 'constructor') {
        next(proto, name);
      }
    });
    proto = Object.getPrototypeOf(proto);
  }
}

export function walk(dir, done) {
  let results: string[] = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let i = 0;
    (function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = dir + '/' + file;
      fs.stat(file, function(e1, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(e2, res) {
            results = results.concat(res);
            next();
          });
        } else {
          results.push(file);
          next();
        }
      });
    })();
  });
}
