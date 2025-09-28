import { G as sanitize_props, I as spread_props, J as slot, A as push, R as fallback, K as store_get, E as attr_class, Q as escape_html, N as unsubscribe_stores, S as bind_props, D as pop, F as stringify } from "./index2.js";
import { t } from "./i18n.js";
import { I as Icon, X } from "./x.js";
import { C as Check } from "./check.js";
function Triangle_alert($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.542.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2025.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * ---
   *
   * The MIT License (MIT) (for portions derived from Feather)
   *
   * Copyright (c) 2013-2023 Cole Bemis
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in all
   * copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   * SOFTWARE.
   *
   */
  const iconNode = [
    [
      "path",
      {
        "d": "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
      }
    ],
    ["path", { "d": "M12 9v4" }],
    ["path", { "d": "M12 17h.01" }]
  ];
  Icon($$payload, spread_props([
    { name: "triangle-alert" },
    $$sanitized_props,
    {
      /**
       * @component @name TriangleAlert
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMjEuNzMgMTgtOC0xNGEyIDIgMCAwIDAtMy40OCAwbC04IDE0QTIgMiAwIDAgMCA0IDIxaDE2YTIgMiAwIDAgMCAxLjczLTMiIC8+CiAgPHBhdGggZD0iTTEyIDl2NCIgLz4KICA8cGF0aCBkPSJNMTIgMTdoLjAxIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/triangle-alert
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$payload2) => {
        $$payload2.out.push(`<!---->`);
        slot($$payload2, $$props, "default", {}, null);
        $$payload2.out.push(`<!---->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function ConfirmModal($$payload, $$props) {
  push();
  var $$store_subs;
  let finalTitle, finalMessage, finalConfirmText, finalCancelText;
  let isOpen = fallback($$props["isOpen"], false);
  let title = fallback($$props["title"], "");
  let message = fallback($$props["message"], "");
  let confirmText = fallback($$props["confirmText"], "");
  let cancelText = fallback($$props["cancelText"], "");
  let type = fallback($$props["type"], "warning");
  let onConfirm = fallback($$props["onConfirm"], () => {
  });
  let onCancel = fallback($$props["onCancel"], () => {
  });
  finalTitle = title || store_get($$store_subs ??= {}, "$t", t)("modal.confirm_action");
  finalMessage = message || store_get($$store_subs ??= {}, "$t", t)("modal.are_you_sure");
  finalConfirmText = confirmText || store_get($$store_subs ??= {}, "$t", t)("common.confirm");
  finalCancelText = cancelText || store_get($$store_subs ??= {}, "$t", t)("common.cancel");
  if (isOpen) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="modal modal-open svelte-mrlnh3" role="dialog"><div class="modal-box relative max-w-md svelte-mrlnh3"><button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 svelte-mrlnh3">`);
    X($$payload, { size: 18 });
    $$payload.out.push(`<!----></button> <div class="flex justify-center mb-4 svelte-mrlnh3"><div${attr_class(`icon-container ${stringify(type)}`, "svelte-mrlnh3")}>`);
    if (type === "danger") {
      $$payload.out.push("<!--[-->");
      Triangle_alert($$payload, { size: 32 });
    } else {
      $$payload.out.push("<!--[!-->");
      if (type === "warning") {
        $$payload.out.push("<!--[-->");
        Triangle_alert($$payload, { size: 32 });
      } else {
        $$payload.out.push("<!--[!-->");
        Check($$payload, { size: 32 });
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]--></div></div> <h3 class="font-bold text-lg text-center mb-2 svelte-mrlnh3">${escape_html(finalTitle)}</h3> <p class="text-center text-base-content/80 mb-6 svelte-mrlnh3">${escape_html(finalMessage)}</p> <div class="modal-action flex gap-3 justify-center svelte-mrlnh3"><button class="btn btn-outline svelte-mrlnh3">${escape_html(finalCancelText)}</button> <button${attr_class(
      `btn ${stringify(type === "danger" ? "btn-error" : type === "warning" ? "btn-warning" : "btn-primary")}`,
      "svelte-mrlnh3"
    )}>${escape_html(finalConfirmText)}</button></div></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, {
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    type,
    onConfirm,
    onCancel
  });
  pop();
}
export {
  ConfirmModal as C
};
