export * from './seal';

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
