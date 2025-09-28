import { J as slot } from "../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "clsx";
import "../../../chunks/state.svelte.js";
function _layout($$payload, $$props) {
  $$payload.out.push(`<div class="transactions-layout svelte-wo5qeh"><!---->`);
  slot($$payload, $$props, "default", {}, null);
  $$payload.out.push(`<!----></div>`);
}
export {
  _layout as default
};
