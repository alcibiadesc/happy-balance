import { K as sanitize_props, $ as rest_props, x as push, V as fallback, a0 as spread_attributes, Z as clsx, Q as escape_html, N as slot, W as bind_props, z as pop, _ as sanitize_slots, F as attr_class, O as stringify, P as ensure_array_like, J as attr } from './index2-B8O15wye.js';

function AmountDisplay($$payload, $$props) {
  push();
  let formattedAmount, isPositive, isNegative, sizeClass, colorClass;
  let amount = $$props["amount"];
  let currency = fallback($$props["currency"], "EUR");
  let showSign = fallback($$props["showSign"], true);
  let colorized = fallback($$props["colorized"], true);
  let size = fallback($$props["size"], "md");
  formattedAmount = new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(showSign ? amount : Math.abs(amount));
  isPositive = amount > 0;
  isNegative = amount < 0;
  sizeClass = `amount-${size}`;
  colorClass = colorized ? isPositive ? "positive" : isNegative ? "negative" : "neutral" : "";
  $$payload.out.push(`<span${attr_class(`amount-display ${stringify(sizeClass)} ${stringify(colorClass)}`, "svelte-kiqnmb")}>${escape_html(formattedAmount)}</span>`);
  bind_props($$props, { amount, currency, showSign, colorized, size });
  pop();
}
function StatCard($$payload, $$props) {
  const $$slots = sanitize_slots($$props);
  push();
  let cardClass, trendIcon, trendClass;
  let label = $$props["label"];
  let value = $$props["value"];
  let currency = fallback($$props["currency"], "EUR");
  let trend = fallback($$props["trend"], void 0);
  let trendValue = fallback($$props["trendValue"], void 0);
  let variant = fallback($$props["variant"], "default");
  let size = fallback($$props["size"], "md");
  let loading = fallback($$props["loading"], false);
  cardClass = [
    "stat-card",
    `variant-${variant}`,
    `size-${size}`,
    loading && "loading"
  ].filter(Boolean).join(" ");
  trendIcon = trend === "up" ? "↗️" : trend === "down" ? "↘️" : "";
  trendClass = trend === "up" ? "trend-up" : trend === "down" ? "trend-down" : "trend-neutral";
  $$payload.out.push(`<div${attr_class(clsx(cardClass), "svelte-9ldn2q")}>`);
  if (loading) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="loading-skeleton svelte-9ldn2q"><div class="skeleton-label svelte-9ldn2q"></div> <div class="skeleton-value svelte-9ldn2q"></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="stat-header svelte-9ldn2q"><h3 class="stat-label svelte-9ldn2q">${escape_html(label)}</h3> `);
    if (trend && trendValue !== void 0) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div${attr_class(`trend ${stringify(trendClass)}`, "svelte-9ldn2q")}><span class="trend-icon svelte-9ldn2q">${escape_html(trendIcon)}</span> `);
      AmountDisplay($$payload, { amount: trendValue, currency, size: "sm", colorized: false });
      $$payload.out.push(`<!----></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div> <div class="stat-value svelte-9ldn2q">`);
    AmountDisplay($$payload, {
      amount: value,
      currency,
      size: size === "lg" ? "lg" : "md",
      colorized: variant !== "default"
    });
    $$payload.out.push(`<!----></div> `);
    if ($$slots.default) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="stat-content svelte-9ldn2q"><!---->`);
      slot($$payload, $$props, "default", {}, null);
      $$payload.out.push(`<!----></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div>`);
  bind_props($$props, {
    label,
    value,
    currency,
    trend,
    trendValue,
    variant,
    size,
    loading
  });
  pop();
}
function SearchInput($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const $$restProps = rest_props($$sanitized_props, [
    "focus",
    "value",
    "placeholder",
    "disabled",
    "loading",
    "size",
    "clearable"
  ]);
  push();
  let searchClass, showClear;
  let value = fallback($$props["value"], "");
  let placeholder = fallback($$props["placeholder"], "Buscar...");
  let disabled = fallback($$props["disabled"], false);
  let loading = fallback($$props["loading"], false);
  let size = fallback($$props["size"], "md");
  let clearable = fallback($$props["clearable"], true);
  function focus() {
  }
  searchClass = [
    "search-input",
    `size-${size}`,
    disabled && "disabled",
    loading && "loading"
  ].filter(Boolean).join(" ");
  showClear = clearable && value.length > 0 && !loading;
  $$payload.out.push(`<div${attr_class(
    clsx(
      // Expose focus method
      searchClass
    ),
    "svelte-1566rcx"
  )}><div class="search-icon svelte-1566rcx">`);
  if (loading) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="loading-spinner svelte-1566rcx"></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`🔍`);
  }
  $$payload.out.push(`<!--]--></div> <input${spread_attributes(
    {
      value,
      placeholder,
      disabled,
      type: "text",
      class: "input",
      ...$$restProps
    },
    "svelte-1566rcx",
    void 0,
    void 0,
    4
  )}/> `);
  if (showClear) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button class="clear-btn svelte-1566rcx" type="button" aria-label="Clear search">×</button>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  bind_props($$props, {
    value,
    placeholder,
    disabled,
    loading,
    size,
    clearable,
    focus
  });
  pop();
}
function FilterPill($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const $$restProps = rest_props($$sanitized_props, ["active", "count", "removable", "disabled", "variant"]);
  push();
  let pillClass;
  let active = fallback($$props["active"], false);
  let count = fallback($$props["count"], void 0);
  let removable = fallback($$props["removable"], false);
  let disabled = fallback($$props["disabled"], false);
  let variant = fallback($$props["variant"], "default");
  pillClass = [
    "filter-pill",
    `variant-${variant}`,
    active && "active",
    disabled && "disabled",
    removable && "removable"
  ].filter(Boolean).join(" ");
  $$payload.out.push(`<button${spread_attributes({ class: clsx(pillClass), disabled, ...$$restProps }, "svelte-ucrhwy")}><span class="label svelte-ucrhwy"><!---->`);
  slot($$payload, $$props, "default", {}, null);
  $$payload.out.push(`<!----></span> `);
  if (count !== void 0) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<span class="count svelte-ucrhwy">${escape_html(count)}</span>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (removable) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button class="remove-btn svelte-ucrhwy" aria-label="Remove filter">×</button>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></button>`);
  bind_props($$props, { active, count, removable, disabled, variant });
  pop();
}
function FilterGroup($$payload, $$props) {
  const $$slots = sanitize_slots($$props);
  push();
  let hasActiveFilters, activeCount, groupClass;
  let filters = fallback($$props["filters"], () => [], true);
  let title = fallback($$props["title"], void 0);
  let allowMultiple = fallback($$props["allowMultiple"], true);
  let allowClear = fallback($$props["allowClear"], true);
  let orientation = fallback($$props["orientation"], "horizontal");
  let size = fallback($$props["size"], "md");
  hasActiveFilters = filters.some((f) => f.active);
  activeCount = filters.filter((f) => f.active).length;
  groupClass = ["filter-group", `orientation-${orientation}`, `size-${size}`].filter(Boolean).join(" ");
  const each_array = ensure_array_like(filters);
  $$payload.out.push(`<div${attr_class(clsx(groupClass), "svelte-zkvwt7")}>`);
  if (title) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="filter-group-header svelte-zkvwt7"><h4 class="filter-group-title svelte-zkvwt7">${escape_html(title)}</h4> `);
    if (allowClear && hasActiveFilters) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<button class="clear-all-btn svelte-zkvwt7" type="button">Limpiar (${escape_html(activeCount)})</button>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="filter-list svelte-zkvwt7"><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let filter = each_array[$$index];
    FilterPill($$payload, {
      active: filter.active,
      count: filter.count,
      variant: filter.variant || "default",
      removable: filter.removable || false,
      children: ($$payload2) => {
        $$payload2.out.push(`<!---->${escape_html(filter.label)}`);
      },
      $$slots: { default: true }
    });
  }
  $$payload.out.push(`<!--]--> `);
  if ($$slots.default) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<!---->`);
    slot($$payload, $$props, "default", {}, null);
    $$payload.out.push(`<!---->`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  if ($$slots.footer) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="filter-group-footer svelte-zkvwt7"><!---->`);
    slot($$payload, $$props, "footer", {}, null);
    $$payload.out.push(`<!----></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  bind_props($$props, { filters, title, allowMultiple, allowClear, orientation, size });
  pop();
}
function ActionButton($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const $$restProps = rest_props($$sanitized_props, ["variant", "size", "disabled", "loading", "icon", "count"]);
  push();
  let buttonClass;
  let variant = fallback($$props["variant"], "secondary");
  let size = fallback($$props["size"], "md");
  let disabled = fallback($$props["disabled"], false);
  let loading = fallback($$props["loading"], false);
  let icon = fallback($$props["icon"], void 0);
  let count = fallback($$props["count"], void 0);
  buttonClass = [
    "action-button",
    `button-${variant}`,
    `button-${size}`,
    disabled && "disabled",
    loading && "loading"
  ].filter(Boolean).join(" ");
  $$payload.out.push(`<button${spread_attributes({ class: clsx(buttonClass), disabled, ...$$restProps }, "svelte-1owvjfj")}>`);
  if (loading) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<span class="loading-spinner svelte-1owvjfj"></span>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (icon && !loading) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<span class="icon svelte-1owvjfj">${escape_html(icon)}</span>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <span class="label"><!---->`);
  slot($$payload, $$props, "default", {}, null);
  $$payload.out.push(`<!----></span> `);
  if (count !== void 0) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<span class="count svelte-1owvjfj">${escape_html(count)}</span>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></button>`);
  bind_props($$props, { variant, size, disabled, loading, icon, count });
  pop();
}
function TransactionCheckbox($$payload, $$props) {
  push();
  let checkboxClass;
  let checked = fallback($$props["checked"], false);
  let indeterminate = fallback($$props["indeterminate"], false);
  let disabled = fallback($$props["disabled"], false);
  let size = fallback($$props["size"], "md");
  checkboxClass = [
    "transaction-checkbox",
    `size-${size}`,
    disabled && "disabled",
    indeterminate && "indeterminate"
  ].filter(Boolean).join(" ");
  $$payload.out.push(`<label${attr_class(clsx(checkboxClass), "svelte-py1rxs")}><input type="checkbox"${attr("checked", checked, true)}${attr("disabled", disabled, true)} class="checkbox-input svelte-py1rxs"/> <span class="checkbox-custom svelte-py1rxs">`);
  if (indeterminate) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<span class="indeterminate-icon svelte-py1rxs">−</span>`);
  } else {
    $$payload.out.push("<!--[!-->");
    if (checked) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<span class="check-icon svelte-py1rxs">✓</span>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></span></label>`);
  bind_props($$props, { checked, indeterminate, disabled, size });
  pop();
}
function DateDisplay($$payload, $$props) {
  push();
  let dateObj, isValid, formattedDate, dateClass;
  let date = $$props["date"];
  let format = fallback($$props["format"], "medium");
  let locale = fallback($$props["locale"], "es-ES");
  let customFormat = fallback($$props["customFormat"], void 0);
  let showTime = fallback($$props["showTime"], false);
  function formatDate(date2, format2, locale2, customFormat2, showTime2 = false) {
    if (!isValid) return "Fecha inválida";
    const now = /* @__PURE__ */ new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateOnly = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    const diffTime = today.getTime() - dateOnly.getTime();
    const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
    switch (format2) {
      case "short":
        return date2.toLocaleDateString(locale2, { day: "2-digit", month: "2-digit" });
      case "medium":
        return date2.toLocaleDateString(locale2, {
          day: "2-digit",
          month: "short",
          ...showTime2 && { hour: "2-digit", minute: "2-digit" }
        });
      case "long":
        return date2.toLocaleDateString(locale2, {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
          ...showTime2 && { hour: "2-digit", minute: "2-digit" }
        });
      case "relative":
        if (diffDays === 0) return "Hoy";
        if (diffDays === 1) return "Ayer";
        if (diffDays === -1) return "Mañana";
        if (diffDays > 1 && diffDays <= 7) return `Hace ${diffDays} días`;
        if (diffDays < -1 && diffDays >= -7) return `En ${Math.abs(diffDays)} días`;
        return date2.toLocaleDateString(locale2, {
          day: "2-digit",
          month: "short",
          year: date2.getFullYear() !== now.getFullYear() ? "numeric" : void 0
        });
      case "custom":
        if (!customFormat2) return date2.toLocaleDateString(locale2);
        return customFormat2.replace("YYYY", date2.getFullYear().toString()).replace("MM", (date2.getMonth() + 1).toString().padStart(2, "0")).replace("DD", date2.getDate().toString().padStart(2, "0")).replace("HH", date2.getHours().toString().padStart(2, "0")).replace("mm", date2.getMinutes().toString().padStart(2, "0"));
      default:
        return date2.toLocaleDateString(locale2);
    }
  }
  dateObj = typeof date === "string" ? new Date(date) : date;
  isValid = dateObj instanceof Date && !isNaN(dateObj.getTime());
  formattedDate = formatDate(dateObj, format, locale, customFormat, showTime);
  dateClass = ["date-display", `format-${format}`, !isValid && "invalid"].filter(Boolean).join(" ");
  $$payload.out.push(`<time${attr_class(clsx(dateClass), "svelte-15n1m5f")}${attr("datetime", isValid ? dateObj.toISOString() : void 0)}>${escape_html(formattedDate)}</time>`);
  bind_props($$props, { date, format, locale, customFormat, showTime });
  pop();
}

export { ActionButton as A, DateDisplay as D, FilterGroup as F, StatCard as S, TransactionCheckbox as T, SearchInput as a, AmountDisplay as b, FilterPill as c };
//# sourceMappingURL=DateDisplay-iDETiVR8.js.map
