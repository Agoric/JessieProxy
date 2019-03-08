/*global harden getOwnPropertyDescriptors create getPrototypeOf makeSet*/

const goodProtos = makeSet([
  null, Object.prototype, Array.prototype, Function.prototype
]);

function revocable(target, handler) {

  const descs = getOwnPropertyDescriptors(target);

  const newDescs = {};

  for (const [name, desc] of Object.entries(descs)) {
    if (desc.configurable !== false) {
      throw new TypeError(
        `Standalone Jessie assumes all properties non-configurable: ${name}`);
    }
    if (desc.writable === true) {
      throw new TypeError(
        `Standalone Jessue assumes all data properties non-writable: ${name}`);
    }
    
    newDescs[name] = harden({
      get() { return handler.get(target, name, proxy); },
      set(newVal) { handler.set(target, name, newVal, proxy); },
      enumerable: desc.enumerable,
      configurable: false
    });
  }

  const proto = getPrototypeOf(target);
  if (!(goodProtos.has(proto))) {
    throw new TypeError(
      `Standablone Jessie assumes direct objects, arrays, or functions`);
  }

  const proxy = create(proto, newDescs);
  
  return harden({
    proxy,
    revoke() {target = null; handler = null;}
  });
}

const JessieProxy = {
  revocable,
  makeProxy(target, handler) {
    return revocable(target, handler).proxy;
  }
};

export default JessieProxy;
