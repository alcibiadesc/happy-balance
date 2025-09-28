import { a1 as current_component, a0 as noop } from "./index2.js";
function onDestroy(fn) {
  var context = (
    /** @type {Component} */
    current_component
  );
  (context.d ??= []).push(fn);
}
function createEventDispatcher() {
  return noop;
}
export {
  createEventDispatcher as c,
  onDestroy as o
};
