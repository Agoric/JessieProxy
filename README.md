# JessieProxy
A subset of the Proxy API as applicable to a standalone Jessie implementation

We assume a standalone Jessie implementation supports only non-mutable
properties and non-extensible objects, as well as only a very weak
notion of inheritance. `JessieProxy` is intended to act like the
subset of `Proxy` applicable only to such constrained objects.

