import { x as push, G as store_get, S as copy_payload, T as assign_payload, I as unsubscribe_stores, z as pop, V as fallback, W as bind_props, U as head, Q as escape_html, O as stringify, F as attr_class, N as slot, K as sanitize_props, M as spread_props, J as attr, E as BROWSER, P as ensure_array_like, Y as maybe_selected } from './index2-B8O15wye.js';
import { t, c as currentLanguage, s as setLanguage } from './i18n-CbN1nHkj.js';
import { a as currencies, c as currentCurrency, s as setCurrency } from './currency-DPERcOp2.js';
import { e as effectiveTheme, U as Upload, u as userPreferences, s as setTheme, t as theme } from './user-preferences-BUTTkBlW.js';
import { a as apiCategories } from './api-transactions-DyZ55f-T.js';
import { C as ConfirmModal } from './ConfirmModal-D3uLSXb1.js';
import { I as Icon } from './x-B7nPYFlb.js';
import { C as Circle_alert, T as Trash_2 } from './trash-2-AqKLMNn-.js';
import './index-CMV7aPAw.js';
import './check-B91ryIov.js';

const browser = BROWSER;
function Circle_check_big($$payload, $$props) {
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
    ["path", { "d": "M21.801 10A10 10 0 1 1 17 3.335" }],
    ["path", { "d": "m9 11 3 3L22 4" }]
  ];
  Icon($$payload, spread_props([
    { name: "circle-check-big" },
    $$sanitized_props,
    {
      /**
       * @component @name CircleCheckBig
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjEuODAxIDEwQTEwIDEwIDAgMSAxIDE3IDMuMzM1IiAvPgogIDxwYXRoIGQ9Im05IDExIDMgM0wyMiA0IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/circle-check-big
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
function Dollar_sign($$payload, $$props) {
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
    ["line", { "x1": "12", "x2": "12", "y1": "2", "y2": "22" }],
    [
      "path",
      { "d": "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "dollar-sign" },
    $$sanitized_props,
    {
      /**
       * @component @name DollarSign
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8bGluZSB4MT0iMTIiIHgyPSIxMiIgeTE9IjIiIHkyPSIyMiIgLz4KICA8cGF0aCBkPSJNMTcgNUg5LjVhMy41IDMuNSAwIDAgMCAwIDdoNWEzLjUgMy41IDAgMCAxIDAgN0g2IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/dollar-sign
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
function Download($$payload, $$props) {
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
    ["path", { "d": "M12 15V3" }],
    ["path", { "d": "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
    ["path", { "d": "m7 10 5 5 5-5" }]
  ];
  Icon($$payload, spread_props([
    { name: "download" },
    $$sanitized_props,
    {
      /**
       * @component @name Download
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgMTVWMyIgLz4KICA8cGF0aCBkPSJNMjEgMTV2NGEyIDIgMCAwIDEtMiAySDVhMiAyIDAgMCAxLTItMnYtNCIgLz4KICA8cGF0aCBkPSJtNyAxMCA1IDUgNS01IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/download
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
function File_text($$payload, $$props) {
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
        "d": "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
      }
    ],
    ["path", { "d": "M14 2v4a2 2 0 0 0 2 2h4" }],
    ["path", { "d": "M10 9H8" }],
    ["path", { "d": "M16 13H8" }],
    ["path", { "d": "M16 17H8" }]
  ];
  Icon($$payload, spread_props([
    { name: "file-text" },
    $$sanitized_props,
    {
      /**
       * @component @name FileText
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTUgMkg2YTIgMiAwIDAgMC0yIDJ2MTZhMiAyIDAgMCAwIDIgMmgxMmEyIDIgMCAwIDAgMi0yVjdaIiAvPgogIDxwYXRoIGQ9Ik0xNCAydjRhMiAyIDAgMCAwIDIgMmg0IiAvPgogIDxwYXRoIGQ9Ik0xMCA5SDgiIC8+CiAgPHBhdGggZD0iTTE2IDEzSDgiIC8+CiAgPHBhdGggZD0iTTE2IDE3SDgiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/file-text
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
function Globe($$payload, $$props) {
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
    [
      "path",
      { "d": "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }
    ],
    ["path", { "d": "M2 12h20" }]
  ];
  Icon($$payload, spread_props([
    { name: "globe" },
    $$sanitized_props,
    {
      /**
       * @component @name Globe
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KICA8cGF0aCBkPSJNMTIgMmExNC41IDE0LjUgMCAwIDAgMCAyMCAxNC41IDE0LjUgMCAwIDAgMC0yMCIgLz4KICA8cGF0aCBkPSJNMiAxMmgyMCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/globe
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
function Palette($$payload, $$props) {
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
        "d": "M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"
      }
    ],
    [
      "circle",
      { "cx": "13.5", "cy": "6.5", "r": ".5", "fill": "currentColor" }
    ],
    [
      "circle",
      {
        "cx": "17.5",
        "cy": "10.5",
        "r": ".5",
        "fill": "currentColor"
      }
    ],
    [
      "circle",
      { "cx": "6.5", "cy": "12.5", "r": ".5", "fill": "currentColor" }
    ],
    [
      "circle",
      { "cx": "8.5", "cy": "7.5", "r": ".5", "fill": "currentColor" }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "palette" },
    $$sanitized_props,
    {
      /**
       * @component @name Palette
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgMjJhMSAxIDAgMCAxIDAtMjAgMTAgOSAwIDAgMSAxMCA5IDUgNSAwIDAgMS01IDVoLTIuMjVhMS43NSAxLjc1IDAgMCAwLTEuNCAyLjhsLjMuNGExLjc1IDEuNzUgMCAwIDEtMS40IDIuOHoiIC8+CiAgPGNpcmNsZSBjeD0iMTMuNSIgY3k9IjYuNSIgcj0iLjUiIGZpbGw9ImN1cnJlbnRDb2xvciIgLz4KICA8Y2lyY2xlIGN4PSIxNy41IiBjeT0iMTAuNSIgcj0iLjUiIGZpbGw9ImN1cnJlbnRDb2xvciIgLz4KICA8Y2lyY2xlIGN4PSI2LjUiIGN5PSIxMi41IiByPSIuNSIgZmlsbD0iY3VycmVudENvbG9yIiAvPgogIDxjaXJjbGUgY3g9IjguNSIgY3k9IjcuNSIgcj0iLjUiIGZpbGw9ImN1cnJlbnRDb2xvciIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/palette
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
function Rotate_ccw($$payload, $$props) {
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
      { "d": "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }
    ],
    ["path", { "d": "M3 3v5h5" }]
  ];
  Icon($$payload, spread_props([
    { name: "rotate-ccw" },
    $$sanitized_props,
    {
      /**
       * @component @name RotateCcw
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMyAxMmE5IDkgMCAxIDAgOS05IDkuNzUgOS43NSAwIDAgMC02Ljc0IDIuNzRMMyA4IiAvPgogIDxwYXRoIGQ9Ik0zIDN2NWg1IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/rotate-ccw
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
function StatusMessage($$payload, $$props) {
  let displayIcon;
  let message = fallback($$props["message"], "");
  let type = fallback($$props["type"], "info");
  let visible = fallback($$props["visible"], true);
  let icon = fallback($$props["icon"], null);
  const defaultIcons = { success: Circle_check_big, error: Circle_alert, info: File_text };
  displayIcon = icon || defaultIcons[type];
  if (visible && message) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div${attr_class(`status-message ${stringify(type)}`, "svelte-1qa3mgs")}><!---->`);
    displayIcon?.($$payload, { size: 20, strokeWidth: 2 });
    $$payload.out.push(`<!----> <span>${escape_html(message)}</span></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  bind_props($$props, { message, type, visible, icon });
}
function SettingsCard($$payload, $$props) {
  let title = $$props["title"];
  let icon = $$props["icon"];
  let iconVariant = fallback($$props["iconVariant"], "appearance");
  $$payload.out.push(`<div class="settings-card svelte-12ngydb"><div class="card-header svelte-12ngydb"><div${attr_class(`card-icon ${stringify(iconVariant)}`, "svelte-12ngydb")}><!---->`);
  icon?.($$payload, { size: 20, strokeWidth: 2 });
  $$payload.out.push(`<!----></div> <h2 class="card-title svelte-12ngydb">${escape_html(title)}</h2></div> <div class="card-content svelte-12ngydb"><!---->`);
  slot($$payload, $$props, "default", {}, null);
  $$payload.out.push(`<!----></div></div>`);
  bind_props($$props, { title, icon, iconVariant });
}
function SettingItem($$payload, $$props) {
  let label = $$props["label"];
  let description = fallback($$props["description"], "");
  $$payload.out.push(`<div class="setting-item svelte-fjddc1"><div class="setting-info svelte-fjddc1"><span class="setting-label svelte-fjddc1">${escape_html(label)}</span> `);
  if (description) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<span class="setting-desc svelte-fjddc1">${escape_html(description)}</span>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> <div class="setting-control svelte-fjddc1"><!---->`);
  slot($$payload, $$props, "default", {}, null);
  $$payload.out.push(`<!----></div></div>`);
  bind_props($$props, { label, description });
}
function ToggleSwitch($$payload, $$props) {
  let checked = fallback($$props["checked"], false);
  let onToggle = fallback($$props["onToggle"], () => {
  });
  let disabled = fallback($$props["disabled"], false);
  let leftIcon = fallback($$props["leftIcon"], "");
  let rightIcon = fallback($$props["rightIcon"], "");
  let leftLabel = fallback($$props["leftLabel"], "");
  let rightLabel = fallback($$props["rightLabel"], "");
  let size = fallback($$props["size"], "lg");
  $$payload.out.push(`<div class="toggle-container svelte-11upsh5">`);
  if (leftIcon || leftLabel) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div${attr_class(`toggle-option ${stringify(!checked ? "active" : "")}`, "svelte-11upsh5")}>${escape_html(leftIcon)}${escape_html(leftLabel)}</div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <input type="checkbox"${attr("checked", checked, true)}${attr("disabled", disabled, true)}${attr_class(`toggle toggle-primary toggle-${stringify(size)}`, "svelte-11upsh5")}/> `);
  if (rightIcon || rightLabel) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div${attr_class(`toggle-option ${stringify(checked ? "active" : "")}`, "svelte-11upsh5")}>${escape_html(rightIcon)}${escape_html(rightLabel)}</div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  bind_props($$props, {
    checked,
    onToggle,
    disabled,
    leftIcon,
    rightIcon,
    leftLabel,
    rightLabel,
    size
  });
}
function ThemeSelector($$payload, $$props) {
  push();
  let isDark = fallback($$props["isDark"], false);
  let onToggle = $$props["onToggle"];
  let t2 = $$props["t"];
  SettingItem($$payload, {
    label: t2("settings.theme"),
    description: isDark ? t2("settings.themes.dark") : t2("settings.themes.light"),
    children: ($$payload2) => {
      ToggleSwitch($$payload2, { checked: isDark, onToggle, leftIcon: "☀️", rightIcon: "🌙" });
    },
    $$slots: { default: true }
  });
  bind_props($$props, { isDark, onToggle, t: t2 });
  pop();
}
function SelectInput($$payload, $$props) {
  let options = fallback($$props["options"], () => [], true);
  let value = fallback($$props["value"], "");
  let onchange = fallback($$props["onchange"], () => {
  });
  let icon = fallback($$props["icon"], null);
  let placeholder = fallback($$props["placeholder"], "");
  let disabled = fallback($$props["disabled"], false);
  let withIcon = fallback($$props["withIcon"], false);
  const each_array = ensure_array_like(options);
  $$payload.out.push(`<div${attr_class(`select-container ${stringify(withIcon ? "with-icon" : "")}`, "svelte-1kkwge1")}>`);
  if (withIcon && icon) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="select-icon svelte-1kkwge1"><!---->`);
    icon?.($$payload, { size: 16, strokeWidth: 2 });
    $$payload.out.push(`<!----></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <select class="select-input svelte-1kkwge1"${attr("disabled", disabled, true)}>`);
  $$payload.select_value = value;
  if (placeholder) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<option value=""${maybe_selected($$payload, "")} disabled>${escape_html(placeholder)}</option>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let option = each_array[$$index];
    $$payload.out.push(`<option${attr("value", option.value)}${maybe_selected($$payload, option.value)}>`);
    if (option.icon) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`${escape_html(option.icon)}`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]-->${escape_html(option.label)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div>`);
  bind_props($$props, {
    options,
    value,
    onchange,
    icon,
    placeholder,
    disabled,
    withIcon
  });
}
function LanguageSelector($$payload, $$props) {
  push();
  let languageOptions, currentLanguageName;
  let languages = fallback($$props["languages"], () => [], true);
  let currentLanguage2 = fallback($$props["currentLanguage"], "");
  let onchange = $$props["onchange"];
  let t2 = $$props["t"];
  languageOptions = languages.map((lang) => ({ value: lang.code, label: lang.name, icon: lang.flag }));
  currentLanguageName = languages.find((l) => l.code === currentLanguage2)?.name || "English";
  SettingItem($$payload, {
    label: t2("settings.language"),
    description: currentLanguageName,
    children: ($$payload2) => {
      SelectInput($$payload2, {
        options: languageOptions,
        value: currentLanguage2,
        onchange,
        icon: Globe,
        withIcon: true
      });
    },
    $$slots: { default: true }
  });
  bind_props($$props, { languages, currentLanguage: currentLanguage2, onchange, t: t2 });
  pop();
}
function CurrencySelector($$payload, $$props) {
  push();
  let currentCurrencyLabel;
  let currencyOptions = fallback($$props["currencyOptions"], () => [], true);
  let currentCurrency2 = fallback($$props["currentCurrency"], "");
  let onchange = $$props["onchange"];
  let t2 = $$props["t"];
  currentCurrencyLabel = currencyOptions.find((c) => c.value === currentCurrency2)?.label || "EUR";
  SettingItem($$payload, {
    label: t2("settings.currency"),
    description: currentCurrencyLabel,
    children: ($$payload2) => {
      SelectInput($$payload2, { options: currencyOptions, value: currentCurrency2, onchange });
    },
    $$slots: { default: true }
  });
  bind_props($$props, { currencyOptions, currentCurrency: currentCurrency2, onchange, t: t2 });
  pop();
}
function DataActions($$payload, $$props) {
  push();
  let importing = fallback($$props["importing"], false);
  let onExport = $$props["onExport"];
  let onImport = $$props["onImport"];
  let onReset = $$props["onReset"];
  let onDeleteAll = $$props["onDeleteAll"];
  let t2 = $$props["t"];
  $$payload.out.push(`<div class="data-actions svelte-oixc39"><button class="action-button export svelte-oixc39">`);
  Download($$payload, { size: 16, strokeWidth: 2 });
  $$payload.out.push(`<!----> ${escape_html(t2("settings.export_data"))}</button> <label${attr_class(`action-button import ${stringify(importing ? "loading" : "")}`, "svelte-oixc39")}><input type="file" accept=".json" style="display: none;"${attr("disabled", importing, true)} class="svelte-oixc39"/> `);
  if (importing) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="import-spinner svelte-oixc39"></div> Importing...`);
  } else {
    $$payload.out.push("<!--[!-->");
    Upload($$payload, { size: 16, strokeWidth: 2 });
    $$payload.out.push(`<!----> Import Data`);
  }
  $$payload.out.push(`<!--]--></label> <button class="action-button reset svelte-oixc39">`);
  Rotate_ccw($$payload, { size: 16, strokeWidth: 2 });
  $$payload.out.push(`<!----> ${escape_html(t2("settings.reset_data"))}</button> <button class="action-button delete svelte-oixc39">`);
  Trash_2($$payload, { size: 16, strokeWidth: 2 });
  $$payload.out.push(`<!----> ${escape_html(t2("settings.clear_data"))}</button></div>`);
  bind_props($$props, { importing, onExport, onImport, onReset, onDeleteAll, t: t2 });
  pop();
}
function SettingsPageTemplate($$payload, $$props) {
  push();
  let isDark = fallback($$props["isDark"], false);
  let onToggleTheme = $$props["onToggleTheme"];
  let languages = fallback($$props["languages"], () => [], true);
  let currentLanguage2 = fallback($$props["currentLanguage"], "");
  let onLanguageChange = $$props["onLanguageChange"];
  let currencyOptions = fallback($$props["currencyOptions"], () => [], true);
  let currentCurrency2 = fallback($$props["currentCurrency"], "");
  let onCurrencyChange = $$props["onCurrencyChange"];
  let importing = fallback($$props["importing"], false);
  let onExportData = $$props["onExportData"];
  let onImportFile = $$props["onImportFile"];
  let onResetData = $$props["onResetData"];
  let onDeleteAllData = $$props["onDeleteAllData"];
  let importStatus = fallback($$props["importStatus"], "");
  let importError = fallback($$props["importError"], "");
  let importSuccess = fallback($$props["importSuccess"], false);
  let showImportModal = fallback($$props["showImportModal"], false);
  let showDeleteAllModal = fallback($$props["showDeleteAllModal"], false);
  let showResetModal = fallback($$props["showResetModal"], false);
  let pendingImportData = fallback($$props["pendingImportData"], null);
  let onConfirmImport = $$props["onConfirmImport"];
  let onCancelImport = $$props["onCancelImport"];
  let onConfirmReset = $$props["onConfirmReset"];
  let onConfirmDeleteAll = $$props["onConfirmDeleteAll"];
  let t2 = $$props["t"];
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    head($$payload2, ($$payload3) => {
      $$payload3.title = `<title>${escape_html(t2("settings.title"))} - Happy Balance</title>`;
    });
    $$payload2.out.push(`<main class="settings-page svelte-1vtrhe0"><div class="settings-header svelte-1vtrhe0"><h1 class="page-title svelte-1vtrhe0">${escape_html(t2("settings.title"))}</h1></div> `);
    StatusMessage($$payload2, {
      message: importStatus,
      type: importSuccess ? "success" : "info",
      visible: !!importStatus
    });
    $$payload2.out.push(`<!----> `);
    StatusMessage($$payload2, { message: importError, type: "error", visible: !!importError });
    $$payload2.out.push(`<!----> <div class="settings-grid svelte-1vtrhe0">`);
    SettingsCard($$payload2, {
      title: t2("settings.theme"),
      icon: Palette,
      iconVariant: "appearance",
      children: ($$payload3) => {
        ThemeSelector($$payload3, { isDark, onToggle: onToggleTheme, t: t2 });
      },
      $$slots: { default: true }
    });
    $$payload2.out.push(`<!----> `);
    SettingsCard($$payload2, {
      title: "Localization",
      icon: Globe,
      iconVariant: "localization",
      children: ($$payload3) => {
        LanguageSelector($$payload3, { languages, currentLanguage: currentLanguage2, onchange: onLanguageChange, t: t2 });
        $$payload3.out.push(`<!----> `);
        CurrencySelector($$payload3, {
          currencyOptions,
          currentCurrency: currentCurrency2,
          onchange: onCurrencyChange,
          t: t2
        });
        $$payload3.out.push(`<!---->`);
      },
      $$slots: { default: true }
    });
    $$payload2.out.push(`<!----> `);
    SettingsCard($$payload2, {
      title: t2("settings.data"),
      icon: Dollar_sign,
      iconVariant: "data",
      children: ($$payload3) => {
        DataActions($$payload3, {
          importing,
          onExport: onExportData,
          onImport: onImportFile,
          onReset: onResetData,
          onDeleteAll: onDeleteAllData,
          t: t2
        });
      },
      $$slots: { default: true }
    });
    $$payload2.out.push(`<!----></div></main> `);
    ConfirmModal($$payload2, {
      title: "Import Data",
      message: `Are you sure you want to import ${stringify(pendingImportData?.transactions?.length || 0)} transactions from ${stringify(pendingImportData?.settings?.exportDate ? new Date(pendingImportData.settings.exportDate).toLocaleDateString() : "Unknown date")}? This will merge with your existing data.`,
      confirmText: "Import",
      cancelText: "Cancel",
      type: "info",
      onConfirm: onConfirmImport,
      onCancel: onCancelImport,
      get isOpen() {
        return showImportModal;
      },
      set isOpen($$value) {
        showImportModal = $$value;
        $$settled = false;
      }
    });
    $$payload2.out.push(`<!----> `);
    ConfirmModal($$payload2, {
      title: t2("modal.reset_title"),
      message: t2("modal.reset_message"),
      confirmText: t2("modal.reset_everything"),
      cancelText: t2("common.cancel"),
      type: "warning",
      onConfirm: onConfirmReset,
      onCancel: () => {
      },
      get isOpen() {
        return showResetModal;
      },
      set isOpen($$value) {
        showResetModal = $$value;
        $$settled = false;
      }
    });
    $$payload2.out.push(`<!----> `);
    ConfirmModal($$payload2, {
      title: t2("modal.delete_all_title"),
      message: t2("modal.delete_all_message"),
      confirmText: t2("modal.delete_everything"),
      cancelText: t2("common.cancel"),
      type: "danger",
      onConfirm: onConfirmDeleteAll,
      onCancel: () => {
      },
      get isOpen() {
        return showDeleteAllModal;
      },
      set isOpen($$value) {
        showDeleteAllModal = $$value;
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
    isDark,
    onToggleTheme,
    languages,
    currentLanguage: currentLanguage2,
    onLanguageChange,
    currencyOptions,
    currentCurrency: currentCurrency2,
    onCurrencyChange,
    importing,
    onExportData,
    onImportFile,
    onResetData,
    onDeleteAllData,
    importStatus,
    importError,
    importSuccess,
    showImportModal,
    showDeleteAllModal,
    showResetModal,
    pendingImportData,
    onConfirmImport,
    onCancelImport,
    onConfirmReset,
    onConfirmDeleteAll,
    t: t2
  });
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let isDark;
  const API_BASE = "http://localhost:3008/api";
  const currencyOptions = Object.values(currencies).map((curr) => ({
    value: curr.code,
    label: `${curr.symbol} ${curr.name}`,
    symbol: curr.symbol
  }));
  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Español", flag: "🇪🇸" }
  ];
  let importStatus = "";
  let importError = "";
  let importSuccess = false;
  let importing = false;
  let showImportModal = false;
  let showDeleteAllModal = false;
  let showResetModal = false;
  let pendingImportData = null;
  async function toggleTheme() {
    const newTheme = isDark ? "light" : "dark";
    setTheme(newTheme);
    await userPreferences.updateTheme(newTheme);
  }
  async function handleLanguageChange(event) {
    const target = event.target;
    setLanguage(target.value);
    await userPreferences.updateLanguage(target.value);
  }
  async function handleCurrencyChange(event) {
    const target = event.target;
    setCurrency(target.value);
    await userPreferences.updateCurrency(target.value);
  }
  function handleExportData() {
    const data = {
      transactions: JSON.parse(localStorage.getItem("transactions") || "[]"),
      transactionHashes: JSON.parse(localStorage.getItem("transaction-hashes") || "[]"),
      categories: JSON.parse(localStorage.getItem("categories") || "[]"),
      settings: {
        currency: store_get($$store_subs ??= {}, "$currentCurrency", currentCurrency),
        language: store_get($$store_subs ??= {}, "$currentLanguage", currentLanguage),
        theme: store_get($$store_subs ??= {}, "$theme", theme),
        exportDate: (/* @__PURE__ */ new Date()).toISOString(),
        version: "1.0.0"
      },
      metadata: {
        appName: "Happy Balance",
        exportedBy: "Settings Export",
        totalTransactions: JSON.parse(localStorage.getItem("transactions") || "[]").length
      }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `happy-balance-backup-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    importStatus = store_get($$store_subs ??= {}, "$t", t)("settings.export_success");
    importSuccess = true;
    setTimeout(
      () => {
        importStatus = "";
        importSuccess = false;
      },
      3e3
    );
  }
  function handleFileImport(event) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    importError = "";
    importStatus = "";
    importSuccess = false;
    importing = true;
    if (!file.name.toLowerCase().endsWith(".json")) {
      importError = store_get($$store_subs ??= {}, "$t", t)("settings.import_invalid_file");
      importing = false;
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      importError = store_get($$store_subs ??= {}, "$t", t)("settings.import_file_too_large");
      importing = false;
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        const data = JSON.parse(content);
        if (!validateImportData(data)) {
          importError = store_get($$store_subs ??= {}, "$t", t)("settings.import_invalid_format");
          importing = false;
          return;
        }
        pendingImportData = data;
        showImportModal = true;
        importing = false;
        importStatus = store_get($$store_subs ??= {}, "$t", t)("settings.import_success", { count: data.transactions?.length || 0 });
        importSuccess = true;
        importing = false;
        setTimeout(
          () => {
            importStatus = "";
            importSuccess = false;
          },
          5e3
        );
      } catch (error) {
        console.error("Import error:", error);
        importError = store_get($$store_subs ??= {}, "$t", t)("settings.import_parse_error");
        importing = false;
      }
    };
    reader.onerror = () => {
      importError = store_get($$store_subs ??= {}, "$t", t)("settings.import_read_error");
      importing = false;
    };
    reader.readAsText(file);
    input.value = "";
  }
  function validateImportData(data) {
    if (!data || typeof data !== "object") return false;
    if (!Array.isArray(data.transactions)) return false;
    if (data.settings && typeof data.settings !== "object") return false;
    if (data.metadata && typeof data.metadata !== "object") return false;
    return true;
  }
  async function importData(data) {
    return;
  }
  async function confirmImport() {
    if (!pendingImportData) return;
    importing = true;
    try {
      await importData(pendingImportData);
      importStatus = store_get($$store_subs ??= {}, "$t", t)("settings.import_success", { count: pendingImportData.transactions?.length || 0 });
      importSuccess = true;
      setTimeout(
        () => {
          importStatus = "";
          importSuccess = false;
        },
        5e3
      );
    } catch (error) {
      console.error("Import error:", error);
      importError = store_get($$store_subs ??= {}, "$t", t)("settings.import_error");
    } finally {
      importing = false;
      pendingImportData = null;
    }
  }
  function cancelImport() {
    pendingImportData = null;
  }
  function handleDeleteAllData() {
    showDeleteAllModal = true;
  }
  function handleResetData() {
    showResetModal = true;
  }
  async function confirmReset() {
    try {
      try {
        const response = await fetch(`${API_BASE}/seed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        if (!response.ok) {
          console.warn("Failed to reset data from database, falling back to localStorage reset");
        }
      } catch (apiError) {
        console.warn("API not available, proceeding with localStorage reset");
      }
      if (browser) ;
      await userPreferences.updateCurrency("EUR");
      await userPreferences.updateLanguage("en");
      await userPreferences.updateTheme("light");
      setCurrency("EUR");
      setLanguage("en");
      setTheme("light");
      await apiCategories.load();
      importStatus = "Data has been successfully reset to defaults";
      importSuccess = true;
      setTimeout(
        () => {
          importStatus = "";
          importSuccess = false;
        },
        3e3
      );
      setTimeout(
        () => {
          window.location.reload();
        },
        2e3
      );
    } catch (error) {
      console.error("Error resetting data:", error);
      importError = "Failed to reset data to defaults";
    }
  }
  async function confirmDeleteAll() {
    try {
      if (browser) ;
      try {
        const transactionsResponse = await fetch(`${API_BASE}/transactions`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" }
        });
        if (!transactionsResponse.ok) {
          console.warn("Failed to delete transactions from database, but localStorage was cleared");
        }
        const categoriesResponse = await fetch(`${API_BASE}/categories`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" }
        });
        if (!categoriesResponse.ok) {
          console.warn("Failed to delete categories from database, but localStorage was cleared");
        }
      } catch (apiError) {
        console.warn("API not available, but localStorage was cleared");
      }
      importStatus = "All data has been successfully deleted";
      importSuccess = true;
      setTimeout(
        () => {
          importStatus = "";
          importSuccess = false;
        },
        3e3
      );
      setTimeout(
        () => {
          window.location.reload();
        },
        2e3
      );
    } catch (error) {
      console.error("Error deleting data:", error);
      importError = "Failed to delete all data";
    }
  }
  isDark = store_get($$store_subs ??= {}, "$effectiveTheme", effectiveTheme) === "dark";
  if (importError) {
    setTimeout(
      () => {
        importError = "";
      },
      5e3
    );
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    SettingsPageTemplate($$payload2, {
      isDark,
      onToggleTheme: toggleTheme,
      languages,
      currentLanguage: store_get($$store_subs ??= {}, "$currentLanguage", currentLanguage),
      onLanguageChange: handleLanguageChange,
      currencyOptions,
      currentCurrency: store_get($$store_subs ??= {}, "$currentCurrency", currentCurrency),
      onCurrencyChange: handleCurrencyChange,
      importing,
      onExportData: handleExportData,
      onImportFile: handleFileImport,
      onResetData: handleResetData,
      onDeleteAllData: handleDeleteAllData,
      importStatus,
      importError,
      importSuccess,
      pendingImportData,
      onConfirmImport: confirmImport,
      onCancelImport: cancelImport,
      onConfirmReset: confirmReset,
      onConfirmDeleteAll: confirmDeleteAll,
      t: store_get($$store_subs ??= {}, "$t", t),
      get showImportModal() {
        return showImportModal;
      },
      set showImportModal($$value) {
        showImportModal = $$value;
        $$settled = false;
      },
      get showDeleteAllModal() {
        return showDeleteAllModal;
      },
      set showDeleteAllModal($$value) {
        showDeleteAllModal = $$value;
        $$settled = false;
      },
      get showResetModal() {
        return showResetModal;
      },
      set showResetModal($$value) {
        showResetModal = $$value;
        $$settled = false;
      }
    });
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-B6oLoNwe.js.map
