import { x as push, G as store_get, U as head, I as unsubscribe_stores, z as pop, K as sanitize_props, M as spread_props, V as fallback, S as copy_payload, T as assign_payload, W as bind_props, P as ensure_array_like, Q as escape_html, J as attr, O as stringify, F as attr_class, N as slot, X as attr_style, Z as clsx } from './index2-B8O15wye.js';
import { a as apiCategories } from './api-transactions-DyZ55f-T.js';
import { t } from './i18n-CbN1nHkj.js';
import { a as currencies, c as currentCurrency } from './currency-DPERcOp2.js';
import { I as Icon, X } from './x-B7nPYFlb.js';
import { P as Plus } from './plus-iHoSA9h6.js';
import { C as Check } from './check-B91ryIov.js';
import { C as Circle_alert, T as Trash_2 } from './trash-2-AqKLMNn-.js';
import { a as Trending_up, T as Trending_down, W as Wallet } from './wallet-By832IsK.js';
import './index-CMV7aPAw.js';

function Arrow_right_left($$payload, $$props) {
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
    ["path", { "d": "m16 3 4 4-4 4" }],
    ["path", { "d": "M20 7H4" }],
    ["path", { "d": "m8 21-4-4 4-4" }],
    ["path", { "d": "M4 17h16" }]
  ];
  Icon($$payload, spread_props([
    { name: "arrow-right-left" },
    $$sanitized_props,
    {
      /**
       * @component @name ArrowRightLeft
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTYgMyA0IDQtNCA0IiAvPgogIDxwYXRoIGQ9Ik0yMCA3SDQiIC8+CiAgPHBhdGggZD0ibTggMjEtNC00IDQtNCIgLz4KICA8cGF0aCBkPSJNNCAxN2gxNiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/arrow-right-left
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
function Coins($$payload, $$props) {
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
    ["circle", { "cx": "8", "cy": "8", "r": "6" }],
    ["path", { "d": "M18.09 10.37A6 6 0 1 1 10.34 18" }],
    ["path", { "d": "M7 6h1v4" }],
    ["path", { "d": "m16.71 13.88.7.71-2.82 2.82" }]
  ];
  Icon($$payload, spread_props([
    { name: "coins" },
    $$sanitized_props,
    {
      /**
       * @component @name Coins
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSI4IiBjeT0iOCIgcj0iNiIgLz4KICA8cGF0aCBkPSJNMTguMDkgMTAuMzdBNiA2IDAgMSAxIDEwLjM0IDE4IiAvPgogIDxwYXRoIGQ9Ik03IDZoMXY0IiAvPgogIDxwYXRoIGQ9Im0xNi43MSAxMy44OC43LjcxLTIuODIgMi44MiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/coins
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
function Info($$payload, $$props) {
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
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    ["path", { "d": "M12 16v-4" }],
    ["path", { "d": "M12 8h.01" }]
  ];
  Icon($$payload, spread_props([
    { name: "info" },
    $$sanitized_props,
    {
      /**
       * @component @name Info
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KICA8cGF0aCBkPSJNMTIgMTZ2LTQiIC8+CiAgPHBhdGggZD0iTTEyIDhoLjAxIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/info
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
function Pen($$payload, $$props) {
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
        "d": "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "pen" },
    $$sanitized_props,
    {
      /**
       * @component @name Pen
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjEuMTc0IDYuODEyYTEgMSAwIDAgMC0zLjk4Ni0zLjk4N0wzLjg0MiAxNi4xNzRhMiAyIDAgMCAwLS41LjgzbC0xLjMyMSA0LjM1MmEuNS41IDAgMCAwIC42MjMuNjIybDQuMzUzLTEuMzJhMiAyIDAgMCAwIC44My0uNDk3eiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/pen
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
function SectionHeader($$payload, $$props) {
  push();
  let title = $$props["title"];
  let icon = $$props["icon"];
  let categoryCount = fallback($$props["categoryCount"], 0);
  let showAddButton = fallback($$props["showAddButton"], true);
  let showHelper = fallback($$props["showHelper"], false);
  let helperText = fallback($$props["helperText"], "");
  $$payload.out.push(`<div class="section-header svelte-fkb8iw"><div class="section-title svelte-fkb8iw"><!---->`);
  icon?.($$payload, { size: 16 });
  $$payload.out.push(`<!----> <h2 class="svelte-fkb8iw">${escape_html(title)}</h2> <span class="category-count svelte-fkb8iw">${escape_html(categoryCount)}</span> `);
  if (showHelper) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="helper-tooltip svelte-fkb8iw"><button class="helper-button svelte-fkb8iw" aria-label="Show help information">`);
    Info($$payload, { size: 14 });
    $$payload.out.push(`<!----></button></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  if (showAddButton) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button class="add-button svelte-fkb8iw"${attr("aria-label", `Add new ${stringify(title.toLowerCase())} category`)}>`);
    Plus($$payload, { size: 14 });
    $$payload.out.push(`<!----></button>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  bind_props($$props, {
    title,
    icon,
    categoryCount,
    showAddButton,
    showHelper,
    helperText
  });
  pop();
}
function CategoryIcon($$payload, $$props) {
  push();
  let iconClass;
  let icon = $$props["icon"];
  let color = fallback($$props["color"], "#7ABAA5");
  let size = fallback($$props["size"], "md");
  let clickable = fallback($$props["clickable"], false);
  let selected = fallback($$props["selected"], false);
  const sizeClasses = {
    sm: "w-6 h-6 text-sm",
    md: "w-10 h-10 text-xl",
    lg: "w-12 h-12 text-2xl"
  };
  iconClass = [
    "category-icon",
    sizeClasses[size],
    clickable && "clickable",
    selected && "selected"
  ].filter(Boolean).join(" ");
  $$payload.out.push(`<div${attr_class(clsx(iconClass), "svelte-1q4nuoe")}${attr_style(`background-color: ${stringify(color)}20`)}${attr("role", clickable ? "button" : void 0)}${attr("tabindex", clickable ? 0 : void 0)}>${escape_html(icon)}</div>`);
  bind_props($$props, { icon, color, size, clickable, selected });
  pop();
}
function ColorPicker($$payload, $$props) {
  push();
  let selectedColor = fallback($$props["selectedColor"], "#7ABAA5");
  let availableColors = fallback(
    $$props["availableColors"],
    () => [
      "#7ABAA5",
      // acapulco
      "#FC8181",
      // froly
      "#63B3ED",
      // blue
      "#68D391",
      // green
      "#F6AD55",
      // orange
      "#A78BFA",
      // purple
      "#FBB6CE",
      // pink
      "#9CA3AF"
      // gray
    ],
    true
  );
  const each_array = ensure_array_like(availableColors);
  $$payload.out.push(`<div class="color-picker svelte-1ijw1q8"><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let color = each_array[$$index];
    $$payload.out.push(`<button${attr_class("color-option svelte-1ijw1q8", void 0, { "selected": selectedColor === color })}${attr_style(`background-color: ${stringify(color)}`)}${attr("aria-label", `Select color ${stringify(color)}`)}></button>`);
  }
  $$payload.out.push(`<!--]--></div>`);
  bind_props($$props, { selectedColor, availableColors });
  pop();
}
function BudgetInput($$payload, $$props) {
  push();
  let value = fallback($$props["value"], 0);
  let currencySymbol = fallback($$props["currencySymbol"], "€");
  let placeholder = fallback($$props["placeholder"], "0");
  let label = fallback($$props["label"], "Presupuesto anual");
  $$payload.out.push(`<div class="budget-section svelte-1v89c5a"><label class="budget-label svelte-1v89c5a">${escape_html(label)}</label> <div class="budget-input-group svelte-1v89c5a"><span class="currency-symbol svelte-1v89c5a">${escape_html(currencySymbol)}</span> <input type="number" class="budget-input svelte-1v89c5a"${attr("placeholder", placeholder)}${attr("value", value)}/> <span class="budget-period svelte-1v89c5a">/ año</span></div></div>`);
  bind_props($$props, { value, currencySymbol, placeholder, label });
  pop();
}
function IconPicker($$payload, $$props) {
  push();
  let show = fallback($$props["show"], false);
  let selectedIcon = fallback($$props["selectedIcon"], "📄");
  let availableIcons = fallback(
    $$props["availableIcons"],
    () => [
      "🏠",
      "🍽️",
      "🚗",
      "🎮",
      "💰",
      "📚",
      "🏥",
      "🛒",
      "✈️",
      "🎬",
      "☕",
      "🎯",
      "💡",
      "🏋️",
      "🎨",
      "🛍️",
      "👔",
      "⚡",
      "💊",
      "🔧",
      "📱",
      "🎵",
      "🌮",
      "🍕",
      "🏦",
      "⛽",
      "🚇",
      "🚌",
      "🏪",
      "💻",
      "📺",
      "👟",
      "🍺",
      "🍎",
      "🥬",
      "🧘",
      "📊",
      "💳",
      "🏆",
      "🎊",
      "🌍",
      "📸",
      "🎪",
      "🏖️",
      "🎂",
      "🍔",
      "🌟",
      "🔥"
    ],
    true
  );
  let position = fallback($$props["position"], () => ({ top: 0, left: 0, maxHeight: "none" }), true);
  function focusFirstOption() {
    setTimeout(
      () => {
        const firstOption = document.querySelector(".icon-option");
        if (firstOption) {
          firstOption.focus();
        }
      },
      50
    );
  }
  if (show) {
    focusFirstOption();
  }
  if (show) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(availableIcons);
    $$payload.out.push(`<div class="icon-picker-backdrop svelte-1el26sj"></div> <div class="icon-picker-overlay svelte-1el26sj"${attr_style(` top: ${stringify(position.top)}px; left: ${stringify(position.left)}px; max-height: ${stringify(position.maxHeight)}; `)} role="dialog" aria-modal="true" aria-label="Select icon"><div class="icon-picker-header svelte-1el26sj"><span class="icon-picker-title svelte-1el26sj">Seleccionar icono</span> <button class="icon-picker-close svelte-1el26sj" aria-label="Close icon selector">`);
    X($$payload, { size: 14 });
    $$payload.out.push(`<!----></button></div> <div class="icon-picker-content svelte-1el26sj" role="listbox"><!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let icon = each_array[$$index];
      $$payload.out.push(`<button${attr_class("icon-option svelte-1el26sj", void 0, { "selected": selectedIcon === icon })} role="option"${attr("aria-selected", selectedIcon === icon)}${attr("aria-label", `Select icon ${stringify(icon)}`)}>${escape_html(icon)}</button>`);
    }
    $$payload.out.push(`<!--]--></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  bind_props($$props, { show, selectedIcon, availableIcons, position });
  pop();
}
function CategoryCard($$payload, $$props) {
  push();
  let category = fallback($$props["category"], null);
  let isEditing = fallback($$props["isEditing"], false);
  let isNew = fallback($$props["isNew"], false);
  let currencySymbol = fallback($$props["currencySymbol"], "€");
  let formatCurrency = $$props["formatCurrency"];
  let editForm = fallback(
    $$props["editForm"],
    () => ({
      name: "",
      icon: "📄",
      color: "#7ABAA5",
      annualBudget: 0,
      type: "essential"
    }),
    true
  );
  let showIconPicker = false;
  let iconPickerPosition = { top: 0, left: 0, maxHeight: "none" };
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out.push(`<div${attr_class("category-card svelte-1vt4lp8", void 0, { "editing": isEditing || isNew })}>`);
    if (isEditing || isNew) {
      $$payload2.out.push("<!--[-->");
      $$payload2.out.push(`<div class="category-icon-container svelte-1vt4lp8">`);
      CategoryIcon($$payload2, {
        icon: editForm.icon,
        color: editForm.color,
        size: "md",
        clickable: true
      });
      $$payload2.out.push(`<!----></div> <div class="category-details svelte-1vt4lp8"><input type="text" class="category-name-input svelte-1vt4lp8" placeholder="Nombre de la categoría"${attr("value", editForm.name)}${attr("autofocus", isNew, true)}/> `);
      BudgetInput($$payload2, { value: editForm.annualBudget, currencySymbol });
      $$payload2.out.push(`<!----> `);
      ColorPicker($$payload2, { selectedColor: editForm.color });
      $$payload2.out.push(`<!----></div> <div class="category-actions svelte-1vt4lp8"><button class="save-btn svelte-1vt4lp8" aria-label="Save category">`);
      Check($$payload2, { size: 14 });
      $$payload2.out.push(`<!----></button> <button class="cancel-btn svelte-1vt4lp8" aria-label="Cancel editing">`);
      X($$payload2, { size: 14 });
      $$payload2.out.push(`<!----></button></div>`);
    } else {
      $$payload2.out.push("<!--[!-->");
      if (category) {
        $$payload2.out.push("<!--[-->");
        CategoryIcon($$payload2, { icon: category.icon, color: category.color, size: "md" });
        $$payload2.out.push(`<!----> <div class="category-info svelte-1vt4lp8"><h3 class="category-name svelte-1vt4lp8">${escape_html(category.name)}</h3> `);
        if (category.annualBudget) {
          $$payload2.out.push("<!--[-->");
          $$payload2.out.push(`<span class="category-budget svelte-1vt4lp8">${escape_html(formatCurrency(category.annualBudget))} / año</span>`);
        } else {
          $$payload2.out.push("<!--[!-->");
          $$payload2.out.push(`<span class="category-budget no-budget svelte-1vt4lp8">Sin presupuesto</span>`);
        }
        $$payload2.out.push(`<!--]--></div> <div class="category-actions svelte-1vt4lp8"><button class="action-btn svelte-1vt4lp8"${attr("aria-label", `Edit category ${stringify(category.name)}`)}>`);
        Pen($$payload2, { size: 14 });
        $$payload2.out.push(`<!----></button> <button class="action-btn delete svelte-1vt4lp8"${attr("aria-label", `Delete category ${stringify(category.name)}`)}>`);
        Trash_2($$payload2, { size: 14 });
        $$payload2.out.push(`<!----></button></div>`);
      } else {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]-->`);
    }
    $$payload2.out.push(`<!--]--></div> `);
    IconPicker($$payload2, {
      selectedIcon: editForm.icon,
      position: iconPickerPosition,
      get show() {
        return showIconPicker;
      },
      set show($$value) {
        showIconPicker = $$value;
        $$settled = false;
      }
    });
    $$payload2.out.push(`<!---->`);
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  bind_props($$props, {
    category,
    isEditing,
    isNew,
    currencySymbol,
    formatCurrency,
    editForm
  });
  pop();
}
function CategorySection($$payload, $$props) {
  push();
  let title = $$props["title"];
  let icon = $$props["icon"];
  let categories = fallback($$props["categories"], () => [], true);
  let showHelper = fallback($$props["showHelper"], false);
  let helperText = fallback($$props["helperText"], "");
  let currencySymbol = fallback($$props["currencySymbol"], "€");
  let formatCurrency = $$props["formatCurrency"];
  let categoryType = $$props["categoryType"];
  let editingCategoryId = null;
  let editForm = {
    name: "",
    icon: "",
    color: "",
    annualBudget: 0,
    type: categoryType
  };
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    const each_array = ensure_array_like(categories);
    $$payload2.out.push(`<section class="category-section svelte-1wys565">`);
    SectionHeader($$payload2, {
      title,
      icon,
      categoryCount: categories.length,
      showAddButton: true,
      showHelper,
      helperText
    });
    $$payload2.out.push(`<!----> <div class="category-list svelte-1wys565">`);
    {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]--> <!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let category = each_array[$$index];
      CategoryCard($$payload2, {
        category,
        isEditing: editingCategoryId === category.id,
        currencySymbol,
        formatCurrency,
        get editForm() {
          return editForm;
        },
        set editForm($$value) {
          editForm = $$value;
          $$settled = false;
        }
      });
    }
    $$payload2.out.push(`<!--]--></div></section>`);
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  bind_props($$props, {
    title,
    icon,
    categories,
    showHelper,
    helperText,
    currencySymbol,
    formatCurrency,
    categoryType
  });
  pop();
}
function Modal($$payload, $$props) {
  push();
  let show = fallback($$props["show"], false);
  let title = fallback($$props["title"], "");
  let size = fallback($$props["size"], "md");
  let closable = fallback($$props["closable"], true);
  let backdrop = fallback($$props["backdrop"], true);
  const sizeClasses = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };
  {
    if (show) {
      document.body.style.overflow;
      document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
  }
  if (show) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="modal-backdrop svelte-17e0w4c"><div${attr_class(`modal-container ${stringify(sizeClasses[size])}`, "svelte-17e0w4c")} role="dialog" aria-modal="true"${attr("aria-labelledby", title ? "modal-title" : void 0)}>`);
    if (title || closable) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="modal-header svelte-17e0w4c">`);
      if (title) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<h3 id="modal-title" class="modal-title svelte-17e0w4c">${escape_html(title)}</h3>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> `);
      if (closable) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<button class="close-button svelte-17e0w4c" aria-label="Close modal">`);
        X($$payload, { size: 20 });
        $$payload.out.push(`<!----></button>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> <div class="modal-body svelte-17e0w4c"><!---->`);
    slot($$payload, $$props, "default", {}, null);
    $$payload.out.push(`<!----></div> <div class="modal-footer svelte-17e0w4c"><!---->`);
    slot($$payload, $$props, "footer", {}, null);
    $$payload.out.push(`<!----></div></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  bind_props($$props, { show, title, size, closable, backdrop });
  pop();
}
function DeleteConfirmModal($$payload, $$props) {
  push();
  let show = fallback($$props["show"], false);
  let category = fallback($$props["category"], null);
  let transactionCount = fallback($$props["transactionCount"], 0);
  let alternativeCategories = fallback($$props["alternativeCategories"], () => [], true);
  let recategorizeTarget = "none";
  if (show) {
    recategorizeTarget = "none";
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    Modal($$payload2, {
      title: "Eliminar categoría",
      get show() {
        return show;
      },
      set show($$value) {
        show = $$value;
        $$settled = false;
      },
      children: ($$payload3) => {
        if (category) {
          $$payload3.out.push("<!--[-->");
          $$payload3.out.push(`<div class="delete-content svelte-1ku0enw"><p class="delete-warning svelte-1ku0enw">¿Estás seguro de eliminar la categoría <strong class="svelte-1ku0enw">${escape_html(category.name)}</strong>?</p> `);
          if (transactionCount > 0) {
            $$payload3.out.push("<!--[-->");
            const each_array = ensure_array_like(alternativeCategories);
            $$payload3.out.push(`<div class="recategorize-section svelte-1ku0enw"><div class="transaction-count svelte-1ku0enw">`);
            Circle_alert($$payload3, { size: 16 });
            $$payload3.out.push(`<!----> <span>Hay ${escape_html(transactionCount)} transacción${escape_html(transactionCount !== 1 ? "es" : "")} con esta categoría</span></div> <p class="recategorize-label svelte-1ku0enw">¿Qué deseas hacer con ellas?</p> <div class="recategorize-options svelte-1ku0enw"><label class="recategorize-option svelte-1ku0enw"><input type="radio" name="recategorize" value="remove"${attr("checked", recategorizeTarget === "remove", true)} class="svelte-1ku0enw"/> <span>Dejar sin categoría</span></label> <!--[-->`);
            for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
              let altCategory = each_array[$$index];
              $$payload3.out.push(`<label class="recategorize-option svelte-1ku0enw"><input type="radio" name="recategorize"${attr("value", altCategory.id)}${attr("checked", recategorizeTarget === altCategory.id, true)} class="svelte-1ku0enw"/> <span class="category-option-display svelte-1ku0enw"><span class="category-icon-small svelte-1ku0enw">${escape_html(altCategory.icon)}</span> <span>${escape_html(altCategory.name)}</span></span></label>`);
            }
            $$payload3.out.push(`<!--]--></div></div>`);
          } else {
            $$payload3.out.push("<!--[!-->");
            $$payload3.out.push(`<p class="no-transactions svelte-1ku0enw">Esta categoría no tiene transacciones asociadas.</p>`);
          }
          $$payload3.out.push(`<!--]--></div>`);
        } else {
          $$payload3.out.push("<!--[!-->");
        }
        $$payload3.out.push(`<!--]-->`);
      },
      $$slots: {
        default: true,
        footer: ($$payload3) => {
          $$payload3.out.push(`<div slot="footer" class="modal-footer svelte-1ku0enw"><button class="cancel-button svelte-1ku0enw">Cancelar</button> <button class="delete-button svelte-1ku0enw">Eliminar</button></div>`);
        }
      }
    });
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  bind_props($$props, { show, category, transactionCount, alternativeCategories });
  pop();
}
function CategoriesPageTemplate($$payload, $$props) {
  push();
  let categoryTypes = fallback($$props["categoryTypes"], () => [], true);
  let categoriesByType = fallback(
    $$props["categoriesByType"],
    () => ({
      income: [],
      essential: [],
      discretionary: [],
      investment: [],
      debt_payment: [],
      no_compute: []
    }),
    true
  );
  let currencySymbol = fallback($$props["currencySymbol"], "€");
  let formatCurrency = $$props["formatCurrency"];
  let showDeleteModal = false;
  let categoryToDelete = null;
  let transactionCount = 0;
  let alternativeCategories = [];
  function setTransactionCount(count) {
    transactionCount = count;
  }
  function setAlternativeCategories(categories) {
    alternativeCategories = categories;
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    const each_array = ensure_array_like(categoryTypes);
    $$payload2.out.push(`<div class="categories-page svelte-17kgxv3"><header class="page-header svelte-17kgxv3"><div class="header-content svelte-17kgxv3"><h1 class="page-title svelte-17kgxv3">Configuración de Categorías</h1> <p class="page-subtitle svelte-17kgxv3">Gestiona tus categorías y presupuestos anuales</p></div></header> <main class="categories-container svelte-17kgxv3"><!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let categoryType = each_array[$$index];
      const categories = categoriesByType[categoryType.value] || [];
      CategorySection($$payload2, {
        title: categoryType.label,
        icon: categoryType.icon,
        categories,
        categoryType: categoryType.value,
        showHelper: categoryType.showHelper || false,
        helperText: categoryType.helperText || "",
        currencySymbol,
        formatCurrency
      });
    }
    $$payload2.out.push(`<!--]--></main></div> `);
    DeleteConfirmModal($$payload2, {
      category: categoryToDelete,
      transactionCount,
      alternativeCategories,
      get show() {
        return showDeleteModal;
      },
      set show($$value) {
        showDeleteModal = $$value;
        $$settled = false;
      }
    });
    $$payload2.out.push(`<!---->`);
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  bind_props($$props, {
    categoryTypes,
    categoriesByType,
    currencySymbol,
    formatCurrency,
    setTransactionCount,
    setAlternativeCategories
  });
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let categoriesByType = () => {
    const grouped = {
      income: [],
      essential: [],
      discretionary: [],
      investment: [],
      debt_payment: [],
      no_compute: []
    };
    store_get($$store_subs ??= {}, "$apiCategories", apiCategories).forEach((cat) => {
      if (grouped[cat.type]) {
        grouped[cat.type].push(cat);
      }
    });
    return grouped;
  };
  let categoryTypes = [
    {
      value: "income",
      label: store_get($$store_subs ??= {}, "$t", t)("categories.types.income"),
      icon: Trending_up
    },
    {
      value: "investment",
      label: store_get($$store_subs ??= {}, "$t", t)("categories.types.investment"),
      icon: Trending_down
    },
    {
      value: "essential",
      label: store_get($$store_subs ??= {}, "$t", t)("categories.types.essential"),
      icon: Wallet
    },
    {
      value: "discretionary",
      label: store_get($$store_subs ??= {}, "$t", t)("categories.types.discretionary"),
      icon: Coins
    },
    {
      value: "debt_payment",
      label: store_get($$store_subs ??= {}, "$t", t)("categories.types.debt_payment"),
      icon: Circle_alert
    },
    {
      value: "no_compute",
      label: store_get($$store_subs ??= {}, "$t", t)("categories.types.no_compute"),
      icon: Arrow_right_left,
      showHelper: true,
      helperText: store_get($$store_subs ??= {}, "$t", t)("categories.helpers.no_compute")
    }
  ];
  function formatCurrency(amount) {
    const currency = currencies[store_get($$store_subs ??= {}, "$currentCurrency", currentCurrency)];
    return new Intl.NumberFormat(currency.locale, { style: "currency", currency: currency.code }).format(amount);
  }
  function getCurrencySymbol() {
    return currencies[store_get($$store_subs ??= {}, "$currentCurrency", currentCurrency)].symbol;
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Categorías - Happy Balance</title>`;
  });
  CategoriesPageTemplate($$payload, {
    categoryTypes,
    categoriesByType,
    currencySymbol: getCurrencySymbol(),
    formatCurrency
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CnJjgunt.js.map
