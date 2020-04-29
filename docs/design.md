# Design of quibble-es

* I use the `transformSource` hook:
  * If the path is not relevant, defer to the `defaultGetTransformSource`
  * Otherwise, read the source of the original file
  * autogenerate a file that exports the same exports, but those exports are somehow proxies
    that return either the test doubles or the original exports.

Some questions:

1. How do I know what the exports are?
   * Answer: some AST parser. Shouldn't be difficult
   * Answer: await import the original and figure out the exports from that. Even easier, but
     means we load the original, which is not a good thing. But we can _start_ with that, for a POC.
2. How do I load the original?
   Answer: I can't `await import` it, because then I'll be in an infinite loop. But I _can_ await
   import(same file but with a query parameter), and have `transformSource` ignore _that_.
3. How do I proxy sometimes to the testdouble, sometimes to the original?
   Answer: in case of named export, since we're binding to a variable, I can replace the value of
   the variable. In the case of default export?
   * If the default export is a function, no problem. function can proxy to original or double.
   * If the default export is an object, use Proxy
   * If the default export is a primitve, then there's nothing we an do. Just return original value,
     because it's not a useful scenario.
4. How do I know I have to reset or not?
   Answer: a global variable? `globalThis.__quibbleEsReset`?
