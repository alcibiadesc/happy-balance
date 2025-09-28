import { E as attr_class, F as stringify, G as sanitize_props, I as spread_props, J as slot, K as store_get, M as attr, N as unsubscribe_stores, D as pop, A as push, O as getContext, P as ensure_array_like, Q as escape_html } from "../../chunks/index2.js";
import "clsx";
import { e as effectiveTheme, U as Upload } from "../../chunks/user-preferences.js";
import { I as Icon, X } from "../../chunks/x.js";
import { t } from "../../chunks/i18n.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import "../../chunks/state.svelte.js";
import { w as writable, d as derived } from "../../chunks/index.js";
function Brand($$payload, $$props) {
  let { showText = true, size = "md" } = $$props;
  const sizeClasses = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" };
  const textSizes = { sm: "text-sm", md: "text-base", lg: "text-lg" };
  $$payload.out.push(`<div class="flex items-center gap-3"><div${attr_class(`brand-icon ${stringify(sizeClasses[size])}`, "svelte-1lkfz9o")}><img src="/logo/happy-balance-logo-without-text.png" alt="Happy Balance Logo"${attr_class(`logo-image ${stringify(sizeClasses[size])}`, "svelte-1lkfz9o")}/></div> `);
  if (showText) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="brand-text svelte-1lkfz9o"><div${attr_class(`brand-name ${stringify(textSizes[size])}`, "svelte-1lkfz9o")}>Happy Balance</div> <div class="brand-tagline text-xs text-subtle svelte-1lkfz9o">Financial harmony</div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
}
function Chevron_left($$payload, $$props) {
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
  const iconNode = [["path", { "d": "m15 18-6-6 6-6" }]];
  Icon($$payload, spread_props([
    { name: "chevron-left" },
    $$sanitized_props,
    {
      /**
       * @component @name ChevronLeft
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTUgMTgtNi02IDYtNiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/chevron-left
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
function Chevron_right($$payload, $$props) {
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
  const iconNode = [["path", { "d": "m9 18 6-6-6-6" }]];
  Icon($$payload, spread_props([
    { name: "chevron-right" },
    $$sanitized_props,
    {
      /**
       * @component @name ChevronRight
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtOSAxOCA2LTYtNi02IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/chevron-right
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
function Layout_dashboard($$payload, $$props) {
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
      "rect",
      { "width": "7", "height": "9", "x": "3", "y": "3", "rx": "1" }
    ],
    [
      "rect",
      { "width": "7", "height": "5", "x": "14", "y": "3", "rx": "1" }
    ],
    [
      "rect",
      { "width": "7", "height": "9", "x": "14", "y": "12", "rx": "1" }
    ],
    [
      "rect",
      { "width": "7", "height": "5", "x": "3", "y": "16", "rx": "1" }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "layout-dashboard" },
    $$sanitized_props,
    {
      /**
       * @component @name LayoutDashboard
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI5IiB4PSIzIiB5PSIzIiByeD0iMSIgLz4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI1IiB4PSIxNCIgeT0iMyIgcng9IjEiIC8+CiAgPHJlY3Qgd2lkdGg9IjciIGhlaWdodD0iOSIgeD0iMTQiIHk9IjEyIiByeD0iMSIgLz4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI1IiB4PSIzIiB5PSIxNiIgcng9IjEiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/layout-dashboard
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
function Menu($$payload, $$props) {
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
    ["path", { "d": "M4 12h16" }],
    ["path", { "d": "M4 18h16" }],
    ["path", { "d": "M4 6h16" }]
  ];
  Icon($$payload, spread_props([
    { name: "menu" },
    $$sanitized_props,
    {
      /**
       * @component @name Menu
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNCAxMmgxNiIgLz4KICA8cGF0aCBkPSJNNCAxOGgxNiIgLz4KICA8cGF0aCBkPSJNNCA2aDE2IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/menu
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
function Receipt($$payload, $$props) {
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
        "d": "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"
      }
    ],
    ["path", { "d": "M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" }],
    ["path", { "d": "M12 17.5v-11" }]
  ];
  Icon($$payload, spread_props([
    { name: "receipt" },
    $$sanitized_props,
    {
      /**
       * @component @name Receipt
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNCAydjIwbDItMSAyIDEgMi0xIDIgMSAyLTEgMiAxIDItMSAyIDFWMmwtMiAxLTItMS0yIDEtMi0xLTIgMS0yLTEtMiAxWiIgLz4KICA8cGF0aCBkPSJNMTYgOGgtNmEyIDIgMCAxIDAgMCA0aDRhMiAyIDAgMSAxIDAgNEg4IiAvPgogIDxwYXRoIGQ9Ik0xMiAxNy41di0xMSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/receipt
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
function Settings($$payload, $$props) {
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
        "d": "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"
      }
    ],
    ["circle", { "cx": "12", "cy": "12", "r": "3" }]
  ];
  Icon($$payload, spread_props([
    { name: "settings" },
    $$sanitized_props,
    {
      /**
       * @component @name Settings
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNOS42NzEgNC4xMzZhMi4zNCAyLjM0IDAgMCAxIDQuNjU5IDAgMi4zNCAyLjM0IDAgMCAwIDMuMzE5IDEuOTE1IDIuMzQgMi4zNCAwIDAgMSAyLjMzIDQuMDMzIDIuMzQgMi4zNCAwIDAgMCAwIDMuODMxIDIuMzQgMi4zNCAwIDAgMS0yLjMzIDQuMDMzIDIuMzQgMi4zNCAwIDAgMC0zLjMxOSAxLjkxNSAyLjM0IDIuMzQgMCAwIDEtNC42NTkgMCAyLjM0IDIuMzQgMCAwIDAtMy4zMi0xLjkxNSAyLjM0IDIuMzQgMCAwIDEtMi4zMy00LjAzMyAyLjM0IDIuMzQgMCAwIDAgMC0zLjgzMUEyLjM0IDIuMzQgMCAwIDEgNi4zNSA2LjA1MWEyLjM0IDIuMzQgMCAwIDAgMy4zMTktMS45MTUiIC8+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/settings
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
function Tag($$payload, $$props) {
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
        "d": "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"
      }
    ],
    [
      "circle",
      { "cx": "7.5", "cy": "7.5", "r": ".5", "fill": "currentColor" }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "tag" },
    $$sanitized_props,
    {
      /**
       * @component @name Tag
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIuNTg2IDIuNTg2QTIgMiAwIDAgMCAxMS4xNzIgMkg0YTIgMiAwIDAgMC0yIDJ2Ny4xNzJhMiAyIDAgMCAwIC41ODYgMS40MTRsOC43MDQgOC43MDRhMi40MjYgMi40MjYgMCAwIDAgMy40MiAwbDYuNTgtNi41OGEyLjQyNiAyLjQyNiAwIDAgMCAwLTMuNDJ6IiAvPgogIDxjaXJjbGUgY3g9IjcuNSIgY3k9IjcuNSIgcj0iLjUiIGZpbGw9ImN1cnJlbnRDb2xvciIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/tag
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
function ThemeToggle($$payload, $$props) {
  push();
  var $$store_subs;
  let { size = "md", collapsed = false } = $$props;
  let isDark = store_get($$store_subs ??= {}, "$effectiveTheme", effectiveTheme) === "dark";
  $$payload.out.push(`<button${attr_class(`theme-toggle theme-toggle--${stringify(size)}`, "svelte-whvnjs", { "theme-toggle--collapsed": collapsed })}${attr("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode")}${attr("title", isDark ? "Switch to light mode" : "Switch to dark mode")}${attr("disabled", true, true)}><div class="theme-toggle__icon svelte-whvnjs">`);
  {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="theme-toggle__loading svelte-whvnjs"></div>`);
  }
  $$payload.out.push(`<!--]--></div></button>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function SidebarToggle($$payload, $$props) {
  let { collapsed, onclick, size = "md" } = $$props;
  const sizeClasses = { sm: "w-8 h-8", md: "w-10 h-10" };
  $$payload.out.push(`<button${attr_class(`sidebar-toggle ${stringify(sizeClasses[size])}`, "svelte-9cegbt")}${attr("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar")}${attr("title", collapsed ? "Expand sidebar" : "Collapse sidebar")}>`);
  if (collapsed) {
    $$payload.out.push("<!--[-->");
    Chevron_right($$payload, { size: size === "sm" ? 16 : 18, strokeWidth: 2 });
  } else {
    $$payload.out.push("<!--[!-->");
    Chevron_left($$payload, { size: size === "sm" ? 16 : 18, strokeWidth: 2 });
  }
  $$payload.out.push(`<!--]--></button>`);
}
function SidebarHeader($$payload, $$props) {
  let { collapsed, onToggle } = $$props;
  $$payload.out.push(`<header${attr_class("sidebar-header svelte-1f4vrzv", void 0, { "sidebar-header--collapsed": collapsed })}>`);
  if (!collapsed) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="sidebar-brand svelte-1f4vrzv">`);
    Brand($$payload, { size: "md" });
    $$payload.out.push(`<!----></div> <div class="sidebar-controls svelte-1f4vrzv">`);
    ThemeToggle($$payload, { size: "sm" });
    $$payload.out.push(`<!----> `);
    SidebarToggle($$payload, { collapsed, onclick: onToggle, size: "sm" });
    $$payload.out.push(`<!----></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="sidebar-collapsed-header svelte-1f4vrzv">`);
    SidebarToggle($$payload, { collapsed, onclick: onToggle, size: "md" });
    $$payload.out.push(`<!----> `);
    ThemeToggle($$payload, { size: "sm", collapsed: true });
    $$payload.out.push(`<!----></div>`);
  }
  $$payload.out.push(`<!--]--></header>`);
}
function NavItem($$payload, $$props) {
  push();
  let {
    href,
    icon,
    children,
    isActive = false,
    isImportant = false
  } = $$props;
  const iconMap = {
    "layout-dashboard": Layout_dashboard,
    "receipt": Receipt,
    "tag": Tag,
    "settings": Settings
  };
  const IconComponent = iconMap[icon];
  $$payload.out.push(`<a${attr("href", href)}${attr_class("nav-item svelte-1612dzz", void 0, {
    "nav-item--active": isActive,
    "nav-item--important": isImportant
  })}${attr("aria-current", isActive ? "page" : void 0)}><div class="nav-item__icon svelte-1612dzz">`);
  if (IconComponent) {
    $$payload.out.push("<!--[-->");
    IconComponent($$payload, { size: 18, strokeWidth: 2 });
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> <span class="nav-item__label svelte-1612dzz">`);
  children?.($$payload);
  $$payload.out.push(`<!----></span> `);
  if (isImportant) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="nav-item__badge svelte-1612dzz"></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></a>`);
  pop();
}
const getStores = () => {
  const stores$1 = getContext("__svelte__");
  return {
    /** @type {typeof page} */
    page: {
      subscribe: stores$1.page.subscribe
    },
    /** @type {typeof navigating} */
    navigating: {
      subscribe: stores$1.navigating.subscribe
    },
    /** @type {typeof updated} */
    updated: stores$1.updated
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
function NavList($$payload, $$props) {
  push();
  var $$store_subs;
  let { isMobile = false, collapsed = false, onItemClick } = $$props;
  const navItems = [
    {
      href: "/",
      icon: "layout-dashboard",
      labelKey: "navigation.dashboard"
    },
    {
      href: "/transactions",
      icon: "receipt",
      labelKey: "navigation.transactions"
    },
    {
      href: "/categories",
      icon: "tag",
      labelKey: "navigation.categories"
    },
    {
      href: "/settings",
      icon: "settings",
      labelKey: "navigation.settings"
    }
  ];
  let currentPath = store_get($$store_subs ??= {}, "$page", page).url.pathname;
  const each_array = ensure_array_like(navItems);
  $$payload.out.push(`<nav${attr_class("nav-list svelte-1jp01bf", void 0, {
    "nav-list--mobile": isMobile,
    "nav-list--collapsed": collapsed
  })}><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let item = each_array[$$index];
    NavItem($$payload, {
      href: item.href,
      icon: item.icon,
      isActive: currentPath === item.href,
      children: ($$payload2) => {
        $$payload2.out.push(`<!---->${escape_html(collapsed ? "" : store_get($$store_subs ??= {}, "$t", t)(item.labelKey))}`);
      }
    });
  }
  $$payload.out.push(`<!--]--> `);
  if (!collapsed) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="import-section svelte-1jp01bf"><div class="import-divider svelte-1jp01bf"></div> <button class="import-btn svelte-1jp01bf"${attr("title", store_get($$store_subs ??= {}, "$t", t)("navigation.import"))}><svg class="import-icon svelte-1jp01bf" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg> <span class="import-text svelte-1jp01bf">${escape_html(store_get($$store_subs ??= {}, "$t", t)("navigation.import"))}</span></button></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></nav>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function SidebarNavigation($$payload, $$props) {
  let { collapsed } = $$props;
  $$payload.out.push(`<nav${attr_class("sidebar-navigation svelte-1o11pgg", void 0, { "sidebar-navigation--collapsed": collapsed })}>`);
  NavList($$payload, { collapsed });
  $$payload.out.push(`<!----></nav>`);
}
function SidebarFooter($$payload, $$props) {
  push();
  let { collapsed } = $$props;
  if (collapsed) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<footer class="sidebar-footer sidebar-footer--collapsed svelte-1lc1c15"><button class="import-button import-button--icon svelte-1lc1c15" aria-label="Import transactions" title="Import transactions">`);
    Upload($$payload, { size: 18, strokeWidth: 2 });
    $$payload.out.push(`<!----></button></footer>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
const sidebarCollapsed = writable(false);
function toggleSidebar() {
  sidebarCollapsed.update((collapsed) => {
    const newState = !collapsed;
    return newState;
  });
}
function Sidebar($$payload, $$props) {
  push();
  var $$store_subs;
  $$payload.out.push(`<aside${attr_class("sidebar svelte-1nwtzae", void 0, {
    "sidebar--collapsed": store_get($$store_subs ??= {}, "$sidebarCollapsed", sidebarCollapsed)
  })}><div class="sidebar-container svelte-1nwtzae">`);
  SidebarHeader($$payload, {
    collapsed: store_get($$store_subs ??= {}, "$sidebarCollapsed", sidebarCollapsed),
    onToggle: toggleSidebar
  });
  $$payload.out.push(`<!----> `);
  SidebarNavigation($$payload, {
    collapsed: store_get($$store_subs ??= {}, "$sidebarCollapsed", sidebarCollapsed)
  });
  $$payload.out.push(`<!----> `);
  SidebarFooter($$payload, {
    collapsed: store_get($$store_subs ??= {}, "$sidebarCollapsed", sidebarCollapsed)
  });
  $$payload.out.push(`<!----></div></aside>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function MobileSidebar($$payload, $$props) {
  push();
  let { isOpen, onClose } = $$props;
  if (isOpen) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="mobile-overlay svelte-6ew3r8" aria-hidden="true"></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <aside${attr_class("mobile-sidebar svelte-6ew3r8", void 0, { "mobile-sidebar--open": isOpen })}${attr("aria-hidden", !isOpen)}><div class="mobile-sidebar-container svelte-6ew3r8"><header class="mobile-sidebar-header svelte-6ew3r8">`);
  Brand($$payload, { size: "md" });
  $$payload.out.push(`<!----> <button class="mobile-sidebar-close svelte-6ew3r8" aria-label="Close menu">`);
  X($$payload, { size: 20, strokeWidth: 2 });
  $$payload.out.push(`<!----></button></header> <nav class="mobile-sidebar-navigation svelte-6ew3r8">`);
  NavList($$payload, { collapsed: false, onItemClick: onClose });
  $$payload.out.push(`<!----></nav></div></aside>`);
  pop();
}
function MobileHeader($$payload, $$props) {
  let { isMenuOpen } = $$props;
  $$payload.out.push(`<header${attr_class("mobile-header svelte-c8w1m7", void 0, { "mobile-header--blur": isMenuOpen })}><div class="mobile-header-content svelte-c8w1m7"><div class="mobile-header-start svelte-c8w1m7"><button class="mobile-menu-toggle svelte-c8w1m7"${attr("aria-label", isMenuOpen ? "Close menu" : "Open menu")}${attr("aria-expanded", isMenuOpen)}>`);
  Menu($$payload, { size: 22, strokeWidth: 2 });
  $$payload.out.push(`<!----></button> `);
  Brand($$payload, { showText: false, size: "sm" });
  $$payload.out.push(`<!----></div> <div class="mobile-header-end svelte-c8w1m7">`);
  ThemeToggle($$payload, { size: "sm" });
  $$payload.out.push(`<!----></div></div></header>`);
}
function NewNavbar($$payload, $$props) {
  push();
  let isMobileSidebarOpen = false;
  function closeMobileSidebar() {
    isMobileSidebarOpen = false;
  }
  Sidebar($$payload);
  $$payload.out.push(`<!----> `);
  MobileHeader($$payload, {
    isMenuOpen: isMobileSidebarOpen
  });
  $$payload.out.push(`<!----> `);
  MobileSidebar($$payload, { isOpen: isMobileSidebarOpen, onClose: closeMobileSidebar });
  $$payload.out.push(`<!---->`);
  pop();
}
function createTransactionStore() {
  const { subscribe, set, update } = writable([]);
  return {
    subscribe,
    // Load transactions from localStorage
    async load() {
      return;
    },
    // Add new transaction
    async add(transaction) {
      const newTransaction = {
        ...transaction,
        id: crypto.randomUUID?.() || `tx-${Date.now()}-${Math.random()}`,
        createdAt: /* @__PURE__ */ new Date()
      };
      try {
        const existing = JSON.parse(
          localStorage.getItem("transactions") || "[]"
        );
        const updated = [newTransaction, ...existing];
        localStorage.setItem("transactions", JSON.stringify(updated));
        update((transactions2) => [newTransaction, ...transactions2]);
        return newTransaction;
      } catch (error) {
        console.warn("Failed to save to localStorage:", error);
        update((transactions2) => [newTransaction, ...transactions2]);
        return newTransaction;
      }
    },
    // Update transaction
    async update(id, updates) {
      update((transactions2) => {
        const updated = transactions2.map(
          (t2) => t2.id === id ? { ...t2, ...updates } : t2
        );
        try {
          localStorage.setItem("transactions", JSON.stringify(updated));
        } catch (error) {
          console.warn("Failed to save to localStorage:", error);
        }
        return updated;
      });
    },
    // Delete transaction
    async delete(id) {
      update((transactions2) => {
        const updated = transactions2.filter((t2) => t2.id !== id);
        try {
          localStorage.setItem("transactions", JSON.stringify(updated));
        } catch (error) {
          console.warn("Failed to save to localStorage:", error);
        }
        return updated;
      });
    },
    // Bulk actions
    async bulkUpdate(ids, updates) {
      update((transactions2) => {
        const updated = transactions2.map(
          (t2) => ids.includes(t2.id) ? { ...t2, ...updates } : t2
        );
        try {
          localStorage.setItem("transactions", JSON.stringify(updated));
        } catch (error) {
          console.warn("Failed to save to localStorage:", error);
        }
        return updated;
      });
    },
    // Apply category to all similar transactions
    async applyCategoryToPattern(transaction, categoryId) {
      const patternHash = generatePatternHash(transaction);
      update((transactions2) => {
        const updated = transactions2.map(
          (t2) => generatePatternHash(t2) === patternHash ? { ...t2, categoryId } : t2
        );
        try {
          localStorage.setItem("transactions", JSON.stringify(updated));
        } catch (error) {
          console.warn("Failed to save to localStorage:", error);
        }
        return updated;
      });
    }
  };
}
function createCategoryStore() {
  const { subscribe, set, update } = writable([
    // Default categories
    {
      id: "1",
      name: "Food & Groceries",
      type: "essential",
      color: "#f5796c",
      icon: "🍽️"
    },
    {
      id: "2",
      name: "Transport",
      type: "essential",
      color: "#7abaa5",
      icon: "🚇"
    },
    {
      id: "3",
      name: "Entertainment",
      type: "discretionary",
      color: "#fecd2c",
      icon: "🎬"
    },
    {
      id: "4",
      name: "Utilities",
      type: "essential",
      color: "#023c46",
      icon: "⚡"
    },
    { id: "5", name: "Income", type: "income", color: "#7abaa5", icon: "💰" },
    {
      id: "6",
      name: "Investment",
      type: "investment",
      color: "#023c46",
      icon: "📈"
    }
  ]);
  return {
    subscribe,
    async add(category) {
      const newCategory = {
        ...category,
        id: crypto.randomUUID?.() || `cat-${Date.now()}-${Math.random()}`
      };
      update((categories2) => [...categories2, newCategory]);
      return newCategory;
    },
    async update(id, updates) {
      update(
        (categories2) => categories2.map((c) => c.id === id ? { ...c, ...updates } : c)
      );
    }
  };
}
function createCategoryRulesStore() {
  const { subscribe, set, update } = writable([]);
  return {
    subscribe,
    async load() {
      set([]);
    },
    async add(rule) {
      const newRule = {
        ...rule,
        id: crypto.randomUUID?.() || `rule-${Date.now()}-${Math.random()}`
      };
      update((rules) => [...rules, newRule]);
      return newRule;
    }
  };
}
function generatePatternHash(transaction) {
  const normalized = `${transaction.merchant.toLowerCase()}_${transaction.description.toLowerCase().replace(/\d+/g, "").replace(/\s+/g, "_").trim()}`;
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}
const transactions = createTransactionStore();
createCategoryStore();
createCategoryRulesStore();
const selectedTransactions = writable(/* @__PURE__ */ new Set());
derived(
  [transactions, selectedTransactions],
  ([$transactions, $selected]) => {
    return {
      all: $transactions,
      selected: $transactions.filter((t2) => $selected.has(t2.id))
    };
  }
);
derived(transactions, ($transactions) => {
  const income = $transactions.filter((t2) => t2.amount > 0).reduce((sum, t2) => sum + t2.amount, 0);
  const expenses = $transactions.filter((t2) => t2.amount < 0).reduce((sum, t2) => sum + Math.abs(t2.amount), 0);
  const balance = income - expenses;
  return {
    income,
    expenses,
    balance,
    transactionCount: $transactions.length
  };
});
function _layout($$payload, $$props) {
  push();
  var $$store_subs;
  let { children } = $$props;
  $$payload.out.push(`<div class="app-shell svelte-12qhfyh">`);
  NewNavbar($$payload);
  $$payload.out.push(`<!----> <main${attr_class("main-content svelte-12qhfyh", void 0, {
    "main-content--collapsed": store_get($$store_subs ??= {}, "$sidebarCollapsed", sidebarCollapsed)
  })}><div class="content-container svelte-12qhfyh">`);
  children?.($$payload);
  $$payload.out.push(`<!----></div></main></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _layout as default
};
