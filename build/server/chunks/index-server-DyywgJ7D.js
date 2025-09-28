import { a2 as current_component, a1 as noop } from './index2-B8O15wye.js';

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

export { createEventDispatcher as c, onDestroy as o };
//# sourceMappingURL=index-server-DyywgJ7D.js.map
