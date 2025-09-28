import { G as sanitize_props, I as spread_props, J as slot, A as push, R as fallback, P as ensure_array_like, E as attr_class, M as attr, Q as escape_html, S as bind_props, D as pop, T as maybe_selected, F as stringify, U as attr_style, K as store_get, N as unsubscribe_stores, V as copy_payload, W as assign_payload, X as head } from "../../chunks/index2.js";
import { t } from "../../chunks/i18n.js";
import { c as currentCurrency, a as currencies, f as formatCurrency } from "../../chunks/currency.js";
import { T as Trending_down, a as Trending_up, W as Wallet } from "../../chunks/wallet.js";
import { I as Icon, X } from "../../chunks/x.js";
import { o as onDestroy } from "../../chunks/index-server.js";
import "chart.js/auto";
import "clsx";
function html(value) {
  var html2 = String(value ?? "");
  var open = "<!---->";
  return open + html2 + "<!---->";
}
function Calendar_range($$payload, $$props) {
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
      { "width": "18", "height": "18", "x": "3", "y": "4", "rx": "2" }
    ],
    ["path", { "d": "M16 2v4" }],
    ["path", { "d": "M3 10h18" }],
    ["path", { "d": "M8 2v4" }],
    ["path", { "d": "M17 14h-6" }],
    ["path", { "d": "M13 18H7" }],
    ["path", { "d": "M7 14h.01" }],
    ["path", { "d": "M17 18h.01" }]
  ];
  Icon($$payload, spread_props([
    { name: "calendar-range" },
    $$sanitized_props,
    {
      /**
       * @component @name CalendarRange
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHg9IjMiIHk9IjQiIHJ4PSIyIiAvPgogIDxwYXRoIGQ9Ik0xNiAydjQiIC8+CiAgPHBhdGggZD0iTTMgMTBoMTgiIC8+CiAgPHBhdGggZD0iTTggMnY0IiAvPgogIDxwYXRoIGQ9Ik0xNyAxNGgtNiIgLz4KICA8cGF0aCBkPSJNMTMgMThINyIgLz4KICA8cGF0aCBkPSJNNyAxNGguMDEiIC8+CiAgPHBhdGggZD0iTTE3IDE4aC4wMSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/calendar-range
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
function Calendar($$payload, $$props) {
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
    ["path", { "d": "M8 2v4" }],
    ["path", { "d": "M16 2v4" }],
    [
      "rect",
      { "width": "18", "height": "18", "x": "3", "y": "4", "rx": "2" }
    ],
    ["path", { "d": "M3 10h18" }]
  ];
  Icon($$payload, spread_props([
    { name: "calendar" },
    $$sanitized_props,
    {
      /**
       * @component @name Calendar
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNOCAydjQiIC8+CiAgPHBhdGggZD0iTTE2IDJ2NCIgLz4KICA8cmVjdCB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHg9IjMiIHk9IjQiIHJ4PSIyIiAvPgogIDxwYXRoIGQ9Ik0zIDEwaDE4IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/calendar
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
function Chevron_down($$payload, $$props) {
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
  const iconNode = [["path", { "d": "m6 9 6 6 6-6" }]];
  Icon($$payload, spread_props([
    { name: "chevron-down" },
    $$sanitized_props,
    {
      /**
       * @component @name ChevronDown
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtNiA5IDYgNiA2LTYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/chevron-down
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
function Piggy_bank($$payload, $$props) {
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
        "d": "M11 17h3v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a3.16 3.16 0 0 0 2-2h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1a5 5 0 0 0-2-4V3a4 4 0 0 0-3.2 1.6l-.3.4H11a6 6 0 0 0-6 6v1a5 5 0 0 0 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z"
      }
    ],
    ["path", { "d": "M16 10h.01" }],
    ["path", { "d": "M2 8v1a2 2 0 0 0 2 2h1" }]
  ];
  Icon($$payload, spread_props([
    { name: "piggy-bank" },
    $$sanitized_props,
    {
      /**
       * @component @name PiggyBank
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTEgMTdoM3YyYTEgMSAwIDAgMCAxIDFoMmExIDEgMCAwIDAgMS0xdi0zYTMuMTYgMy4xNiAwIDAgMCAyLTJoMWExIDEgMCAwIDAgMS0xdi0yYTEgMSAwIDAgMC0xLTFoLTFhNSA1IDAgMCAwLTItNFYzYTQgNCAwIDAgMC0zLjIgMS42bC0uMy40SDExYTYgNiAwIDAgMC02IDZ2MWE1IDUgMCAwIDAgMiA0djNhMSAxIDAgMCAwIDEgMWgyYTEgMSAwIDAgMCAxLTF6IiAvPgogIDxwYXRoIGQ9Ik0xNiAxMGguMDEiIC8+CiAgPHBhdGggZD0iTTIgOHYxYTIgMiAwIDAgMCAyIDJoMSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/piggy-bank
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
function PeriodSelector($$payload, $$props) {
  push();
  let periods = fallback($$props["periods"], () => [], true);
  let selectedPeriod = fallback($$props["selectedPeriod"], "");
  let loading = fallback($$props["loading"], false);
  let customDateRangeLabel = fallback($$props["customDateRangeLabel"], "");
  const each_array = ensure_array_like(periods);
  $$payload.out.push(`<div class="period-selector svelte-3flww6"><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let period = each_array[$$index];
    $$payload.out.push(`<button${attr_class("period-button svelte-3flww6", void 0, {
      "active": selectedPeriod === period.value,
      "loading": loading && selectedPeriod === period.value
    })}${attr("disabled", loading, true)}>`);
    if (loading && selectedPeriod === period.value) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="button-spinner svelte-3flww6"></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
      if (period.icon) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<!---->`);
        period.icon?.($$payload, { size: 16 });
        $$payload.out.push(`<!---->`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]--> <span class="svelte-3flww6">${escape_html(period.value === "custom" && customDateRangeLabel ? customDateRangeLabel : period.label)}</span></button>`);
  }
  $$payload.out.push(`<!--]--></div>`);
  bind_props($$props, { periods, selectedPeriod, loading, customDateRangeLabel });
  pop();
}
function PeriodNavigation($$payload, $$props) {
  push();
  let periodOptions = fallback($$props["periodOptions"], () => [], true);
  let currentOffset = fallback($$props["currentOffset"], 0);
  let currentPeriodLabel = fallback($$props["currentPeriodLabel"], "");
  let loading = fallback($$props["loading"], false);
  const each_array = ensure_array_like(periodOptions);
  $$payload.out.push(`<div class="period-navigation svelte-18ix2j3"><div class="period-selector-dropdown svelte-18ix2j3"><select${attr("disabled", loading, true)} class="period-select svelte-18ix2j3">`);
  $$payload.select_value = currentOffset;
  $$payload.out.push(`<!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let option = each_array[$$index];
    $$payload.out.push(`<option${attr("value", option.offset)}${maybe_selected($$payload, option.offset)}>${escape_html(option.label)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></div> <div class="period-nav-buttons svelte-18ix2j3"><button class="nav-button svelte-18ix2j3"${attr("disabled", loading, true)} title="Período anterior">←</button> <span class="current-period-label svelte-18ix2j3">${escape_html(currentPeriodLabel)}</span> <button class="nav-button svelte-18ix2j3"${attr("disabled", loading || currentOffset === 0, true)} title="Período siguiente">→</button></div></div>`);
  bind_props($$props, { periodOptions, currentOffset, currentPeriodLabel, loading });
  pop();
}
function DashboardHeader($$payload, $$props) {
  push();
  let title = $$props["title"];
  let periods = fallback($$props["periods"], () => [], true);
  let selectedPeriod = fallback($$props["selectedPeriod"], "");
  let periodOptions = fallback($$props["periodOptions"], () => [], true);
  let currentOffset = fallback($$props["currentOffset"], 0);
  let currentPeriodLabel = fallback($$props["currentPeriodLabel"], "");
  let customDateRangeLabel = fallback($$props["customDateRangeLabel"], "");
  let loading = fallback($$props["loading"], false);
  $$payload.out.push(`<header class="dashboard-header svelte-2jcqbr"><div class="header-top svelte-2jcqbr"><h1 class="dashboard-title svelte-2jcqbr">${escape_html(title)}</h1> `);
  PeriodSelector($$payload, { periods, selectedPeriod, loading, customDateRangeLabel });
  $$payload.out.push(`<!----></div> `);
  if (selectedPeriod !== "custom") {
    $$payload.out.push("<!--[-->");
    PeriodNavigation($$payload, { periodOptions, currentOffset, currentPeriodLabel, loading });
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></header>`);
  bind_props($$props, {
    title,
    periods,
    selectedPeriod,
    periodOptions,
    currentOffset,
    currentPeriodLabel,
    customDateRangeLabel,
    loading
  });
  pop();
}
function MetricCard($$payload, $$props) {
  let label = $$props["label"];
  let value = $$props["value"];
  let icon = $$props["icon"];
  let iconVariant = fallback($$props["iconVariant"], "income");
  let trend = fallback($$props["trend"], null);
  let trendColor = fallback($$props["trendColor"], "var(--success)");
  let subtext = fallback($$props["subtext"], null);
  let loading = fallback($$props["loading"], false);
  const iconClasses = {
    income: "income",
    expenses: "expenses",
    investments: "investments",
    balance: "balance"
  };
  $$payload.out.push(`<article class="metric-card svelte-vp1h6f"><div class="metric-header svelte-vp1h6f"><div${attr_class(`metric-icon ${stringify(iconClasses[iconVariant])}`, "svelte-vp1h6f")}><!---->`);
  icon?.($$payload, { size: 18, strokeWidth: 2 });
  $$payload.out.push(`<!----></div> <span class="metric-label svelte-vp1h6f">${escape_html(label)}</span></div> <div class="metric-body svelte-vp1h6f"><div class="metric-value svelte-vp1h6f">`);
  if (loading) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="metric-skeleton svelte-vp1h6f"></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`${escape_html(value)}`);
  }
  $$payload.out.push(`<!--]--></div> `);
  if (!loading && trend) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="metric-trend svelte-vp1h6f"${attr_style(`color: ${stringify(trendColor)}`)}>${escape_html(trend)}</div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  if (!loading && subtext) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="metric-subtext svelte-vp1h6f">${html(subtext)}</div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></article>`);
  bind_props($$props, {
    label,
    value,
    icon,
    iconVariant,
    trend,
    trendColor,
    subtext,
    loading
  });
}
function ExpensesCard($$payload, $$props) {
  push();
  var $$store_subs;
  let {
    totalExpenses,
    trend,
    loading = false,
    formatCurrency: formatCurrency2,
    formatTrend,
    getTrendColor
  } = $$props;
  $$payload.out.push(`<article class="metric-card expenses-card svelte-1edklab"><div class="metric-header svelte-1edklab"><div class="metric-icon expenses svelte-1edklab">`);
  Trending_down($$payload, { size: 18, strokeWidth: 2 });
  $$payload.out.push(`<!----></div> <span class="metric-label svelte-1edklab">${escape_html(store_get($$store_subs ??= {}, "$t", t)("dashboard.metrics.expenses"))}</span> <button class="expand-button svelte-1edklab"${attr("aria-label", "Ver desglose")}>`);
  {
    $$payload.out.push("<!--[!-->");
    Chevron_down($$payload, { size: 16 });
  }
  $$payload.out.push(`<!--]--></button></div> <div class="metric-body svelte-1edklab"><div class="metric-value svelte-1edklab">`);
  if (loading) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="metric-skeleton svelte-1edklab"></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`${escape_html(formatCurrency2(totalExpenses))}`);
  }
  $$payload.out.push(`<!--]--></div> `);
  if (!loading) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="metric-trend svelte-1edklab"${attr_style(`color: ${stringify(getTrendColor(trend, "expenses"))}`)}>${escape_html(formatTrend(trend))}</div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  {
    $$payload.out.push("<!--[!-->");
    {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></article>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function MetricsGrid($$payload, $$props) {
  push();
  let income = fallback($$props["income"], 0);
  let expenses = fallback($$props["expenses"], 0);
  let investments = fallback($$props["investments"], 0);
  let balance = fallback($$props["balance"], 0);
  let savingsRate = fallback($$props["savingsRate"], 0);
  let essentialExpenses = fallback($$props["essentialExpenses"], 0);
  let discretionaryExpenses = fallback($$props["discretionaryExpenses"], 0);
  let debtPayments = fallback($$props["debtPayments"], 0);
  let incomeTrend = fallback($$props["incomeTrend"], 0);
  let expensesTrend = fallback($$props["expensesTrend"], 0);
  let investmentsTrend = fallback($$props["investmentsTrend"], 0);
  let loading = fallback($$props["loading"], false);
  let formatCurrency2 = $$props["formatCurrency"];
  let formatTrend = $$props["formatTrend"];
  let getTrendColor = $$props["getTrendColor"];
  let t2 = $$props["t"];
  $$payload.out.push(`<section class="metrics-section svelte-1s8ilij"><div class="metrics-grid svelte-1s8ilij">`);
  MetricCard($$payload, {
    label: t2("dashboard.metrics.income"),
    value: formatCurrency2(income),
    icon: Trending_up,
    iconVariant: "income",
    trend: formatTrend(incomeTrend),
    trendColor: getTrendColor(incomeTrend, "income"),
    loading
  });
  $$payload.out.push(`<!----> `);
  ExpensesCard($$payload, {
    totalExpenses: expenses,
    trend: expensesTrend,
    loading,
    formatCurrency: formatCurrency2,
    formatTrend,
    getTrendColor
  });
  $$payload.out.push(`<!----> `);
  MetricCard($$payload, {
    label: t2("dashboard.metrics.investments"),
    value: formatCurrency2(investments),
    icon: Piggy_bank,
    iconVariant: "investments",
    trend: formatTrend(investmentsTrend),
    trendColor: getTrendColor(investmentsTrend, "investments"),
    loading
  });
  $$payload.out.push(`<!----> `);
  MetricCard($$payload, {
    label: t2("dashboard.metrics.balance"),
    value: formatCurrency2(balance),
    icon: Wallet,
    iconVariant: "balance",
    subtext: t2("dashboard.metrics.saved_percentage", { percentage: savingsRate.toFixed(1) }),
    loading
  });
  $$payload.out.push(`<!----></div></section>`);
  bind_props($$props, {
    income,
    expenses,
    investments,
    balance,
    savingsRate,
    essentialExpenses,
    discretionaryExpenses,
    debtPayments,
    incomeTrend,
    expensesTrend,
    investmentsTrend,
    loading,
    formatCurrency: formatCurrency2,
    formatTrend,
    getTrendColor,
    t: t2
  });
  pop();
}
function CategoryProgressCard($$payload, $$props) {
  let name = $$props["name"];
  let amount = $$props["amount"];
  let percentage = $$props["percentage"];
  let icon = fallback($$props["icon"], "📊");
  let color = fallback($$props["color"], "var(--primary)");
  $$payload.out.push(`<div class="category-card svelte-rwfjyu"><div class="category-header svelte-rwfjyu"><div class="category-info svelte-rwfjyu"><span class="category-icon svelte-rwfjyu"${attr_style(`background-color: ${stringify(color)}20; color: ${stringify(color)}`)}>${escape_html(icon)}</span> <span class="category-name svelte-rwfjyu">${escape_html(name)}</span></div> <span class="category-amount svelte-rwfjyu">${escape_html(amount)}</span></div> <div class="category-bar svelte-rwfjyu"><div class="category-progress svelte-rwfjyu"${attr_style(`width: ${stringify(percentage)}%; background-color: ${stringify(color)}`)}></div></div> <span class="category-percentage svelte-rwfjyu">${escape_html(percentage)}%</span></div>`);
  bind_props($$props, { name, amount, percentage, icon, color });
}
function CategoriesGrid($$payload, $$props) {
  push();
  let categories = fallback($$props["categories"], () => [], true);
  let formatCurrency2 = $$props["formatCurrency"];
  let t2 = $$props["t"];
  const each_array = ensure_array_like(categories);
  $$payload.out.push(`<section class="categories-section svelte-1tvzh0u"><h2 class="section-title svelte-1tvzh0u">${escape_html(t2("dashboard.categories.title"))}</h2> <div class="categories-grid svelte-1tvzh0u"><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let category = each_array[$$index];
    CategoryProgressCard($$payload, {
      name: category.name,
      amount: formatCurrency2(category.amount),
      percentage: category.percentage,
      icon: category.icon || "📊",
      color: category.color || "var(--primary)"
    });
  }
  $$payload.out.push(`<!--]--></div></section>`);
  bind_props($$props, { categories, formatCurrency: formatCurrency2, t: t2 });
  pop();
}
function SpendingIndicator($$payload, $$props) {
  push();
  var $$store_subs;
  let { income, expenses } = $$props;
  let spendingRate = income > 0 ? Math.round(expenses / income * 10) : 0;
  let spendingStatus = (() => {
    if (spendingRate <= 5) return "good";
    if (spendingRate <= 8) return "medium";
    return "regular";
  })();
  let spendingSummaryText = (() => {
    const currencyCode = store_get($$store_subs ??= {}, "$currentCurrency", currentCurrency);
    const rate = spendingRate;
    const currency = currencies[currencyCode];
    if (!currency) return "Loading...";
    const formatCurrencyAmount = (amount) => {
      return new Intl.NumberFormat(currency.locale, {
        style: "currency",
        currency: currency.code,
        minimumFractionDigits: currency.code === "JPY" ? 0 : 0,
        maximumFractionDigits: currency.code === "JPY" ? 0 : 0
      }).format(amount);
    };
    const template = store_get($$store_subs ??= {}, "$t", t)("dashboard.spending_summary");
    return template.replace("{amount}", `<strong>${formatCurrencyAmount(rate)}</strong>`);
  })();
  $$payload.out.push(`<div${attr_class(`spending-summary ${stringify(spendingStatus)}`, "svelte-zz5ba3")}><div class="spending-indicator svelte-zz5ba3"><span class="spending-dot svelte-zz5ba3"></span> <span class="spending-text svelte-zz5ba3">${html(spendingSummaryText)}</span></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function FinancialChart($$payload, $$props) {
  push();
  let { data = [], height = 280, loading = false } = $$props;
  onDestroy(() => {
  });
  $$payload.out.push(`<div class="financial-chart svelte-1e4vmfh"${attr_style(`height: ${stringify(height)}px;`)}>`);
  if (loading) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="chart-loading svelte-1e4vmfh"><div class="loading-spinner svelte-1e4vmfh"></div> <span class="svelte-1e4vmfh">Loading chart data...</span></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    if (!data?.length) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="chart-empty svelte-1e4vmfh"><span class="svelte-1e4vmfh">No data available for the selected period</span></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<canvas class="svelte-1e4vmfh"></canvas>`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
function FinancialBarCharts($$payload, $$props) {
  push();
  var $$store_subs;
  let { data = [], height = 250, loading = false } = $$props;
  onDestroy(() => {
  });
  $$payload.out.push(`<section class="financial-bar-charts svelte-t8o6uh"><h2 class="section-title svelte-t8o6uh">${escape_html(store_get($$store_subs ??= {}, "$t", t)("dashboard.charts.expense_distribution"))}</h2> <p class="chart-subtitle svelte-t8o6uh">${escape_html(store_get($$store_subs ??= {}, "$t", t)("dashboard.charts.expense_distribution_subtitle"))}</p> <div class="chart-wrapper svelte-t8o6uh"${attr_style(`height: ${stringify(height)}px;`)}>`);
  if (loading) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="chart-loading svelte-t8o6uh"><div class="loading-spinner svelte-t8o6uh"></div> <span class="svelte-t8o6uh">Loading chart data...</span></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    if (!data?.length) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="chart-empty svelte-t8o6uh"><span class="svelte-t8o6uh">No data available for the selected period</span></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<canvas class="svelte-t8o6uh"></canvas>`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div></section>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function DateRangePicker($$payload, $$props) {
  push();
  var $$store_subs;
  let startDate = fallback($$props["startDate"], "");
  let endDate = fallback($$props["endDate"], "");
  let isOpen = fallback($$props["isOpen"], false);
  let tempStartDate = startDate;
  let tempEndDate = endDate;
  if (isOpen) {
    tempStartDate = startDate;
    tempEndDate = endDate;
  }
  if (isOpen) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="modal-backdrop svelte-szyxw5"><div class="modal-content svelte-szyxw5"><div class="modal-header svelte-szyxw5"><h3 class="svelte-szyxw5">${escape_html(store_get($$store_subs ??= {}, "$t", t)("dashboard.dateRange.title"))}</h3> <button class="close-button svelte-szyxw5">`);
    X($$payload, { size: 20 });
    $$payload.out.push(`<!----></button></div> <div class="modal-body svelte-szyxw5"><div class="date-inputs svelte-szyxw5"><div class="date-field svelte-szyxw5"><label for="start-date" class="svelte-szyxw5">${escape_html(store_get($$store_subs ??= {}, "$t", t)("dashboard.dateRange.startDate"))}</label> <div class="input-wrapper svelte-szyxw5">`);
    Calendar($$payload, { size: 16 });
    $$payload.out.push(`<!----> <input id="start-date" type="date"${attr("value", tempStartDate)}${attr("max", tempEndDate || void 0)} class="date-input svelte-szyxw5"/></div></div> <div class="date-field svelte-szyxw5"><label for="end-date" class="svelte-szyxw5">${escape_html(store_get($$store_subs ??= {}, "$t", t)("dashboard.dateRange.endDate"))}</label> <div class="input-wrapper svelte-szyxw5">`);
    Calendar($$payload, { size: 16 });
    $$payload.out.push(`<!----> <input id="end-date" type="date"${attr("value", tempEndDate)}${attr("min", tempStartDate || void 0)} class="date-input svelte-szyxw5"/></div></div></div></div> <div class="modal-footer svelte-szyxw5"><button class="btn-secondary svelte-szyxw5">${escape_html(store_get($$store_subs ??= {}, "$t", t)("common.cancel"))}</button> <button class="btn-primary svelte-szyxw5"${attr("disabled", !tempStartDate || !tempEndDate, true)}>${escape_html(store_get($$store_subs ??= {}, "$t", t)("common.apply"))}</button></div></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { startDate, endDate, isOpen });
  pop();
}
function DashboardPageTemplate($$payload, $$props) {
  push();
  let title = $$props["title"];
  let periods = fallback($$props["periods"], () => [], true);
  let selectedPeriod = fallback($$props["selectedPeriod"], "");
  let periodOptions = fallback($$props["periodOptions"], () => [], true);
  let currentOffset = fallback($$props["currentOffset"], 0);
  let currentPeriodLabel = fallback($$props["currentPeriodLabel"], "");
  let customDateRangeLabel = fallback($$props["customDateRangeLabel"], "");
  let income = fallback($$props["income"], 0);
  let expenses = fallback($$props["expenses"], 0);
  let investments = fallback($$props["investments"], 0);
  let balance = fallback($$props["balance"], 0);
  let savingsRate = fallback($$props["savingsRate"], 0);
  let essentialExpenses = fallback($$props["essentialExpenses"], 0);
  let discretionaryExpenses = fallback($$props["discretionaryExpenses"], 0);
  let debtPayments = fallback($$props["debtPayments"], 0);
  let incomeTrend = fallback($$props["incomeTrend"], 0);
  let expensesTrend = fallback($$props["expensesTrend"], 0);
  let investmentsTrend = fallback($$props["investmentsTrend"], 0);
  let categories = fallback($$props["categories"], () => [], true);
  let chartData = fallback($$props["chartData"], () => [], true);
  let barChartData = fallback($$props["barChartData"], () => [], true);
  let loading = fallback($$props["loading"], false);
  let showDateRangePicker = fallback($$props["showDateRangePicker"], false);
  let customStartDate = fallback($$props["customStartDate"], "");
  let customEndDate = fallback($$props["customEndDate"], "");
  let formatCurrency2 = $$props["formatCurrency"];
  let formatTrend = $$props["formatTrend"];
  let getTrendColor = $$props["getTrendColor"];
  let t2 = $$props["t"];
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out.push(`<main class="dashboard svelte-128j3x9">`);
    DashboardHeader($$payload2, {
      title,
      periods,
      selectedPeriod,
      periodOptions,
      currentOffset,
      currentPeriodLabel,
      customDateRangeLabel,
      loading
    });
    $$payload2.out.push(`<!----> `);
    SpendingIndicator($$payload2, { income, expenses });
    $$payload2.out.push(`<!----> `);
    MetricsGrid($$payload2, {
      income,
      expenses,
      investments,
      balance,
      savingsRate,
      essentialExpenses,
      discretionaryExpenses,
      debtPayments,
      incomeTrend,
      expensesTrend,
      investmentsTrend,
      loading,
      formatCurrency: formatCurrency2,
      formatTrend,
      getTrendColor,
      t: t2
    });
    $$payload2.out.push(`<!----> `);
    CategoriesGrid($$payload2, { categories, formatCurrency: formatCurrency2, t: t2 });
    $$payload2.out.push(`<!----> <section class="chart-section svelte-128j3x9"><h2 class="section-title svelte-128j3x9">${escape_html(t2("dashboard.charts.temporal_evolution"))}</h2> <p class="chart-subtitle svelte-128j3x9">${escape_html(t2("dashboard.charts.temporal_evolution_subtitle"))}</p> <div class="chart-wrapper svelte-128j3x9">`);
    FinancialChart($$payload2, {
      data: chartData,
      height: 280,
      loading
    });
    $$payload2.out.push(`<!----></div></section> `);
    FinancialBarCharts($$payload2, {
      data: barChartData,
      height: 250,
      loading
    });
    $$payload2.out.push(`<!----></main> `);
    DateRangePicker($$payload2, {
      startDate: customStartDate,
      endDate: customEndDate,
      get isOpen() {
        return showDateRangePicker;
      },
      set isOpen($$value) {
        showDateRangePicker = $$value;
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
    title,
    periods,
    selectedPeriod,
    periodOptions,
    currentOffset,
    currentPeriodLabel,
    customDateRangeLabel,
    income,
    expenses,
    investments,
    balance,
    savingsRate,
    essentialExpenses,
    discretionaryExpenses,
    debtPayments,
    incomeTrend,
    expensesTrend,
    investmentsTrend,
    categories,
    chartData,
    barChartData,
    loading,
    showDateRangePicker,
    customStartDate,
    customEndDate,
    formatCurrency: formatCurrency2,
    formatTrend,
    getTrendColor,
    t: t2
  });
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let selectedPeriod = "month";
  let periodOffset = 0;
  let customStartDate = "";
  let customEndDate = "";
  let showDateRangePicker = false;
  let loading = false;
  let realData = { monthlyTrend: [], monthlyBarData: [], categories: [] };
  let periods = [
    {
      value: "week",
      label: store_get($$store_subs ??= {}, "$t", t)("dashboard.periods.week")
    },
    {
      value: "month",
      label: store_get($$store_subs ??= {}, "$t", t)("dashboard.periods.month")
    },
    {
      value: "quarter",
      label: store_get($$store_subs ??= {}, "$t", t)("dashboard.periods.quarter")
    },
    {
      value: "year",
      label: store_get($$store_subs ??= {}, "$t", t)("dashboard.periods.year")
    },
    {
      value: "custom",
      label: store_get($$store_subs ??= {}, "$t", t)("dashboard.periods.custom"),
      icon: Calendar_range
    }
  ];
  let filteredMetrics = () => {
    {
      return {
        income: 0,
        expenses: 0,
        investments: 0,
        balance: 0,
        spendingRate: 0,
        savingsRate: 0
      };
    }
  };
  let trends = realData.monthlyTrend.length >= 2 ? {
    income: calculateTrendPercentage(realData.monthlyTrend, "income"),
    expenses: calculateTrendPercentage(realData.monthlyTrend, "expenses"),
    investments: calculateTrendPercentage(realData.monthlyTrend, "balance")
  } : { income: 0, expenses: 0, investments: 0 };
  function calculateTrendPercentage(data, field) {
    if (data.length < 2) return 0;
    const current = data[data.length - 1][field] || 0;
    const previous = data[data.length - 2][field] || 0;
    if (previous === 0) return current > 0 ? 100 : 0;
    return (current - previous) / previous * 100;
  }
  function formatCurrencyAmount(amount) {
    return formatCurrency(amount, store_get($$store_subs ??= {}, "$currentCurrency", currentCurrency));
  }
  function formatTrend(value) {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  }
  function getTrendColor(value, type) {
    if (type === "expenses") {
      return value <= 0 ? "var(--success)" : "var(--accent)";
    }
    return value >= 0 ? "var(--success)" : "var(--accent)";
  }
  function getCustomDateRangeLabel() {
    return store_get($$store_subs ??= {}, "$t", t)("dashboard.periods.custom");
  }
  function getPeriodNavigationOptions() {
    const now = /* @__PURE__ */ new Date();
    const options = [];
    switch (selectedPeriod) {
      case "week":
        for (let i = 0; i < 12; i++) {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay() - i * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          options.push({
            offset: i,
            label: i === 0 ? "Esta semana" : `S${i + 1}`,
            fullLabel: `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`
          });
        }
        break;
      case "month":
        for (let i = 0; i < 12; i++) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = monthDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
          options.push({
            offset: i,
            label: i === 0 ? "Este mes" : monthName,
            fullLabel: monthName
          });
        }
        break;
      case "quarter":
        for (let i = 0; i < 8; i++) {
          const quarterDate = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
          const quarter = Math.floor(quarterDate.getMonth() / 3) + 1;
          const year = quarterDate.getFullYear();
          options.push({
            offset: i,
            label: i === 0 ? "Este trimestre" : `Q${quarter} ${year}`,
            fullLabel: `Q${quarter} ${year}`
          });
        }
        break;
      case "year":
        for (let i = 0; i < 5; i++) {
          const year = now.getFullYear() - i;
          options.push({
            offset: i,
            label: i === 0 ? "Este año" : year.toString(),
            fullLabel: year.toString()
          });
        }
        break;
    }
    return options;
  }
  function getCurrentPeriodLabel() {
    const options = getPeriodNavigationOptions();
    const current = options.find((opt) => opt.offset === periodOffset);
    return current?.fullLabel || options[0]?.fullLabel || "";
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    head($$payload2, ($$payload3) => {
      $$payload3.title = `<title>${escape_html(store_get($$store_subs ??= {}, "$t", t)("dashboard.title"))} - Expense Tracker</title>`;
    });
    DashboardPageTemplate($$payload2, {
      title: store_get($$store_subs ??= {}, "$t", t)("dashboard.title"),
      periods,
      selectedPeriod,
      periodOptions: getPeriodNavigationOptions(),
      currentOffset: periodOffset,
      currentPeriodLabel: getCurrentPeriodLabel(),
      customDateRangeLabel: getCustomDateRangeLabel(),
      income: filteredMetrics().income,
      expenses: filteredMetrics().expenses,
      investments: filteredMetrics().investments,
      balance: filteredMetrics().balance,
      savingsRate: filteredMetrics().savingsRate,
      essentialExpenses: 0,
      discretionaryExpenses: 0,
      debtPayments: 0,
      incomeTrend: trends.income,
      expensesTrend: trends.expenses,
      investmentsTrend: trends.investments,
      categories: realData.categories,
      chartData: realData.monthlyTrend,
      barChartData: realData.monthlyBarData,
      loading,
      customStartDate,
      customEndDate,
      formatCurrency: formatCurrencyAmount,
      formatTrend,
      getTrendColor,
      t: store_get($$store_subs ??= {}, "$t", t),
      get showDateRangePicker() {
        return showDateRangePicker;
      },
      set showDateRangePicker($$value) {
        showDateRangePicker = $$value;
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
export {
  _page as default
};
