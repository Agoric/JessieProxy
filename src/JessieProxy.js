/*global harden makeSet getOwnPropertyDescriptors create getPrototypeOf*/

// This is written in SES to express the subset of Proxy-like behavior
// made available to Jessie. An open question is whether this should
// appear in Jessie simply as the Jessie-whitelisted subset of full
// Proxy, which would remain full when Jessie is run as a subset of
// SES.

// For a standalone Jessie implementation, currently neither
// Object.getOwnPropertyDescriptors, Object.create, nor
// Object.getPrototypeOf are on the Jessie whitelist. By using these,
// this implementation is not in Jessie. Otherwise, the intention is
// that this implementation be in conforming Jessie.

// For standalone Jessie, one idea is that the following Proxy-like
// behavior be provided primitively in Jessie as `Proxy`.
// Alternatively, we could go lower level whitelist
// Object.getOwnPropertyDescriptors, Object.create, and
// Object.getPrototypeOf instead. Or we could go higher level and add
// a membrane library to the Jessie and SES runtime.

// harden and makeSet are part of the Jessie runtime. This code will
// include the proper import statements to obtain these from a
// sensible source, once these bootstrap-module-design issues settle
// down.

// Note that we have recently decided that `Object.entries` is on the
// Jessie whitelist, and so may be used directly below. However, in
// order to be defensive in non-SES environments to
// post-initialization corruption, we sample `Object.entries` early.
const {entries} = Object;

const goodProtos = makeSet([
  null, Object.prototype, Array.prototype, Function.prototype
]);

function revocable(target, handler) {

  const descs = getOwnPropertyDescriptors(target);

  const newDescs = {};

  function doGet(target, name, receiver) {
    const getTrap = target.get;
    if (getTrap) {
      // TODO Should use the getTrap already obtained, but this would
      // require use of reflection that we have not yet decided to put
      // on the Jessie whitelist. However, the current code, which
      // gets the trap twice, is non-conforming.
      return handler.get(target, name, receiver);
    }
    return target[name];
  }

  function doSet(target, name, newVal, receiver) {
    const setTrap = target.set;
    if (setTrap) {
      // TODO use the setTrap already obtained. See above.
      return handler.set(target, name, newVal, receiver);
    }
    target[name] = newVal;
    return true;
  }

  for (const [name, desc] of entries(descs)) {
    if (desc.configurable !== false) {
      throw new TypeError(
        `Standalone Jessie assumes all properties non-configurable: ${name}`);
    }
    if (desc.writable === true) {
      throw new TypeError(
        `Standalone Jessue assumes all data properties non-writable: ${name}`);
    }
    
    newDescs[name] = harden({
      get() { return doGet(target, name, proxy); },
      set(newVal) { doSet(target, name, newVal, proxy); },
      enumerable: desc.enumerable,
      configurable: false
    });
  }

  const proto = getPrototypeOf(target);
  if (!(goodProtos.has(proto))) {
    throw new TypeError(
      `Standalone Jessie assumes direct objects, arrays, or functions`);
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
