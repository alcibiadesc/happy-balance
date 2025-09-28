import { Z as sanitize_slots, A as push, R as fallback, E as attr_class, Q as escape_html, Y as clsx, P as ensure_array_like, U as attr_style, M as attr, F as stringify, J as slot, S as bind_props, D as pop, K as store_get, N as unsubscribe_stores, V as copy_payload, W as assign_payload } from "../../../chunks/index2.js";
import { o as onDestroy } from "../../../chunks/index-server.js";
import { S as StatCard, A as ActionButton, a as SearchInput, F as FilterGroup, T as TransactionCheckbox, b as AmountDisplay, D as DateDisplay, c as FilterPill } from "../../../chunks/DateDisplay.js";
import { C as ConfirmModal } from "../../../chunks/ConfirmModal.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "../../../chunks/state.svelte.js";
import { t } from "../../../chunks/i18n.js";
import { X } from "../../../chunks/x.js";
import { P as Plus } from "../../../chunks/plus.js";
import { b as apiSelectedTransactions, a as apiCategories, c as apiTransactions } from "../../../chunks/api-transactions.js";
function TransactionHeader($$payload, $$props) {
  const $$slots = sanitize_slots($$props);
  push();
  let totalExpenses, expenseBreakdownWithPercentages, headerClass;
  let stats = $$props["stats"];
  let currency = fallback($$props["currency"], "EUR");
  let period = fallback($$props["period"], "mes actual");
  let loading = fallback($$props["loading"], false);
  let showBreakdown = fallback($$props["showBreakdown"], true);
  const expenseTypes = [
    {
      key: "essential",
      label: "Esenciales",
      color: "#FECD2C",
      icon: "🏠"
    },
    {
      key: "discretionary",
      label: "Discrecionales",
      color: "#F5796C",
      icon: "🎯"
    },
    {
      key: "investment",
      label: "Inversiones",
      color: "#7ABAA5",
      icon: "📈"
    },
    {
      key: "debt_payment",
      label: "Deudas",
      color: "#F5796C",
      icon: "💳"
    },
    {
      key: "no_compute",
      label: "No computar",
      color: "#94A3B8",
      icon: "🚫"
    }
  ];
  totalExpenses = Object.values(stats.expenseBreakdown).reduce((sum, value) => sum + value, 0);
  expenseBreakdownWithPercentages = expenseTypes.map((type) => {
    const amount = stats.expenseBreakdown[type.key];
    const percentage = totalExpenses > 0 ? amount / totalExpenses * 100 : 0;
    return { ...type, amount, percentage };
  }).filter((item) => item.amount > 0);
  headerClass = ["transaction-header", loading && "loading"].filter(Boolean).join(" ");
  $$payload.out.push(`<header${attr_class(clsx(headerClass), "svelte-q0idq7")}><div class="header-content svelte-q0idq7"><div class="header-title svelte-q0idq7"><h1 class="page-title svelte-q0idq7">Transacciones</h1> <p class="period-subtitle svelte-q0idq7">${escape_html(period)}</p></div> <div class="stats-grid svelte-q0idq7">`);
  StatCard($$payload, {
    label: "Balance",
    value: stats.balance,
    currency,
    variant: "balance",
    loading
  });
  $$payload.out.push(`<!----> `);
  StatCard($$payload, {
    label: "Ingresos",
    value: stats.income,
    currency,
    variant: "income",
    loading
  });
  $$payload.out.push(`<!----> `);
  StatCard($$payload, {
    label: "Gastos",
    value: stats.expenses,
    currency,
    variant: "expense",
    loading
  });
  $$payload.out.push(`<!----> `);
  StatCard($$payload, {
    label: "Transacciones",
    value: stats.transactionCount,
    currency: "",
    loading,
    children: ($$payload2) => {
      $$payload2.out.push(`<span slot="default" class="transaction-count-label svelte-q0idq7">${escape_html(stats.transactionCount === 1 ? "transacción" : "transacciones")}</span>`);
    },
    $$slots: { default: true }
  });
  $$payload.out.push(`<!----></div> `);
  if (showBreakdown && !loading && totalExpenses > 0) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(expenseBreakdownWithPercentages);
    const each_array_1 = ensure_array_like(expenseBreakdownWithPercentages);
    $$payload.out.push(`<div class="expense-breakdown svelte-q0idq7"><h3 class="breakdown-title svelte-q0idq7">Desglose de gastos</h3> <div class="expense-bar svelte-q0idq7"><!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let item = each_array[$$index];
      $$payload.out.push(`<div class="expense-segment svelte-q0idq7"${attr_style(`background-color: ${stringify(item.color)}; width: ${stringify(item.percentage)}%;`)}${attr("title", `${stringify(item.label)}: ${stringify(new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(item.amount))} (${stringify(item.percentage.toFixed(1))}%)`)}></div>`);
    }
    $$payload.out.push(`<!--]--></div> <div class="breakdown-items svelte-q0idq7"><!--[-->`);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let item = each_array_1[$$index_1];
      $$payload.out.push(`<div class="breakdown-item svelte-q0idq7"><div class="item-indicator svelte-q0idq7"><div class="color-dot svelte-q0idq7"${attr_style(`background-color: ${stringify(item.color)};`)}></div> <span class="item-icon svelte-q0idq7">${escape_html(item.icon)}</span></div> <div class="item-details svelte-q0idq7"><span class="item-label svelte-q0idq7">${escape_html(item.label)}</span> <span class="item-amount svelte-q0idq7">${escape_html(new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(item.amount))}</span></div> <div class="item-percentage svelte-q0idq7">${escape_html(item.percentage.toFixed(1))}%</div></div>`);
    }
    $$payload.out.push(`<!--]--></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if ($$slots.default) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="header-extra svelte-q0idq7"><!---->`);
    slot($$payload, $$props, "default", {}, null);
    $$payload.out.push(`<!----></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div></header>`);
  bind_props($$props, { stats, currency, period, loading, showBreakdown });
  pop();
}
function DateRangeSelector($$payload, $$props) {
  push();
  let isToday, selectorClass, displayText;
  let dateRange = $$props["dateRange"];
  let mode = fallback($$props["mode"], "month");
  let showModeToggle = fallback($$props["showModeToggle"], true);
  let allowNavigation = fallback($$props["allowNavigation"], true);
  let size = fallback($$props["size"], "md");
  const modeConfig = {
    day: { label: "Día", format: "long" },
    week: { label: "Semana", format: "medium" },
    month: { label: "Mes", format: "medium" },
    year: { label: "Año", format: "medium" }
  };
  isToday = (() => {
    const today = /* @__PURE__ */ new Date();
    const todayStr = today.toDateString();
    switch (mode) {
      case "day":
        return dateRange.start.toDateString() === todayStr;
      case "week":
        return dateRange.start <= today && today <= dateRange.end;
      case "month":
        return dateRange.start.getMonth() === today.getMonth() && dateRange.start.getFullYear() === today.getFullYear();
      case "year":
        return dateRange.start.getFullYear() === today.getFullYear();
      default:
        return false;
    }
  })();
  selectorClass = [
    "date-range-selector",
    `size-${size}`,
    !allowNavigation && "no-navigation"
  ].filter(Boolean).join(" ");
  displayText = (() => {
    if (mode === "week") {
      return `${dateRange.start.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} - ${dateRange.end.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`;
    }
    if (mode === "month") {
      return dateRange.start.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    }
    if (mode === "year") {
      return dateRange.start.getFullYear().toString();
    }
    return dateRange.start.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  })();
  $$payload.out.push(`<div${attr_class(clsx(selectorClass), "svelte-i131g2")}><div class="navigation svelte-i131g2">`);
  if (allowNavigation) {
    $$payload.out.push("<!--[-->");
    ActionButton($$payload, {
      variant: "ghost",
      size,
      icon: "‹",
      "aria-label": "Período anterior"
    });
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="date-display-container svelte-i131g2"><button class="date-button svelte-i131g2"${attr("disabled", isToday, true)} title="Ir a hoy"><span class="date-text svelte-i131g2">${escape_html(displayText)}</span> `);
  if (isToday) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<span class="today-indicator svelte-i131g2">•</span>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></button></div> `);
  if (allowNavigation) {
    $$payload.out.push("<!--[-->");
    ActionButton($$payload, {
      variant: "ghost",
      size,
      icon: "›",
      "aria-label": "Período siguiente"
    });
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  if (showModeToggle) {
    $$payload.out.push("<!--[-->");
    ActionButton($$payload, {
      variant: "outline",
      size,
      title: "Cambiar vista de período",
      children: ($$payload2) => {
        $$payload2.out.push(`<!---->${escape_html(modeConfig[mode].label)}`);
      },
      $$slots: { default: true }
    });
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  bind_props($$props, { dateRange, mode, showModeToggle, allowNavigation, size });
  pop();
}
function TransactionToolbar($$payload, $$props) {
  push();
  let hasActiveFilters, hasSearch, toolbarClass;
  let searchValue = fallback($$props["searchValue"], "");
  let dateRange = $$props["dateRange"];
  let dateMode = fallback($$props["dateMode"], "month");
  let filters = fallback($$props["filters"], () => [], true);
  let selectedCount = fallback($$props["selectedCount"], 0);
  let totalCount = fallback($$props["totalCount"], 0);
  let showFilters = fallback($$props["showFilters"], false);
  let selectionMode = fallback($$props["selectionMode"], false);
  let loading = fallback($$props["loading"], false);
  hasActiveFilters = filters.some((f) => f.active);
  hasSearch = searchValue.trim().length > 0;
  toolbarClass = [
    "transaction-toolbar",
    selectionMode && "selection-mode",
    showFilters && "filters-expanded"
  ].filter(Boolean).join(" ");
  $$payload.out.push(`<div${attr_class(clsx(toolbarClass), "svelte-7x9x2z")}><div class="toolbar-main svelte-7x9x2z">`);
  if (selectionMode) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="selection-toolbar svelte-7x9x2z"><div class="selection-info svelte-7x9x2z"><span class="selection-count svelte-7x9x2z">${escape_html(selectedCount)} de ${escape_html(totalCount)} seleccionadas</span></div> <div class="selection-actions svelte-7x9x2z">`);
    if (selectedCount < totalCount) {
      $$payload.out.push("<!--[-->");
      ActionButton($$payload, {
        variant: "outline",
        size: "sm",
        children: ($$payload2) => {
          $$payload2.out.push(`<!---->Seleccionar todas`);
        },
        $$slots: { default: true }
      });
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> `);
    if (selectedCount > 0) {
      $$payload.out.push("<!--[-->");
      ActionButton($$payload, {
        variant: "outline",
        size: "sm",
        children: ($$payload2) => {
          $$payload2.out.push(`<!---->Deseleccionar`);
        },
        $$slots: { default: true }
      });
      $$payload.out.push(`<!----> `);
      ActionButton($$payload, {
        variant: "primary",
        size: "sm",
        children: ($$payload2) => {
          $$payload2.out.push(`<!---->Categorizar`);
        },
        $$slots: { default: true }
      });
      $$payload.out.push(`<!----> `);
      ActionButton($$payload, {
        variant: "outline",
        size: "sm",
        children: ($$payload2) => {
          $$payload2.out.push(`<!---->Eliminar`);
        },
        $$slots: { default: true }
      });
      $$payload.out.push(`<!---->`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> `);
    ActionButton($$payload, {
      variant: "ghost",
      size: "sm",
      icon: "×",
      "aria-label": "Salir del modo selección"
    });
    $$payload.out.push(`<!----></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="normal-toolbar svelte-7x9x2z"><div class="toolbar-left svelte-7x9x2z">`);
    DateRangeSelector($$payload, { dateRange, mode: dateMode });
    $$payload.out.push(`<!----> `);
    SearchInput($$payload, {
      value: searchValue,
      placeholder: "Buscar transacciones...",
      loading
    });
    $$payload.out.push(`<!----></div> <div class="toolbar-right svelte-7x9x2z">`);
    ActionButton($$payload, {
      variant: "outline",
      icon: "🔽",
      count: hasActiveFilters ? filters.filter((f) => f.active).length : void 0,
      children: ($$payload2) => {
        $$payload2.out.push(`<!---->Filtros`);
      },
      $$slots: { default: true }
    });
    $$payload.out.push(`<!----> `);
    ActionButton($$payload, {
      variant: "outline",
      icon: "📥",
      children: ($$payload2) => {
        $$payload2.out.push(`<!---->Exportar`);
      },
      $$slots: { default: true }
    });
    $$payload.out.push(`<!----> <!---->`);
    slot($$payload, $$props, "actions", {}, null);
    $$payload.out.push(`<!----></div></div>`);
  }
  $$payload.out.push(`<!--]--></div> `);
  if (showFilters && !selectionMode) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="filter-panel svelte-7x9x2z">`);
    FilterGroup($$payload, { filters, title: "Filtros", allowClear: true });
    $$payload.out.push(`<!----> <!---->`);
    slot($$payload, $$props, "extraFilters", {}, null);
    $$payload.out.push(`<!----></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if ((hasActiveFilters || hasSearch) && !selectionMode && !showFilters) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(filters.filter((f) => f.active));
    $$payload.out.push(`<div class="active-filters-summary svelte-7x9x2z"><div class="summary-content svelte-7x9x2z">`);
    if (hasSearch) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<span class="filter-tag search-tag svelte-7x9x2z">🔍 "${escape_html(searchValue)}" <button class="remove-tag svelte-7x9x2z" aria-label="Limpiar búsqueda">×</button></span>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> <!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let filter = each_array[$$index];
      $$payload.out.push(`<span class="filter-tag svelte-7x9x2z">${escape_html(filter.label)} `);
      if (filter.count !== void 0) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<span class="tag-count svelte-7x9x2z">(${escape_html(filter.count)})</span>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></span>`);
    }
    $$payload.out.push(`<!--]--> `);
    if (hasActiveFilters) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<button class="clear-all-filters svelte-7x9x2z">Limpiar filtros</button>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  bind_props($$props, {
    searchValue,
    dateRange,
    dateMode,
    filters,
    selectedCount,
    totalCount,
    showFilters,
    selectionMode,
    loading
  });
  pop();
}
function TransactionCard($$payload, $$props) {
  push();
  let hasCategory, categoryColor, cardClass;
  let transaction = $$props["transaction"];
  let categories = fallback($$props["categories"], () => [], true);
  let selected = fallback($$props["selected"], false);
  let selectionMode = fallback($$props["selectionMode"], false);
  let showActions = fallback($$props["showActions"], true);
  let showCategory = fallback($$props["showCategory"], true);
  let showDate = fallback($$props["showDate"], false);
  let compact = fallback($$props["compact"], false);
  transaction.observations || "";
  hasCategory = !!transaction.category;
  transaction.amount > 0;
  categoryColor = transaction.category?.color || "#gray";
  cardClass = [
    "transaction-card",
    compact && "compact",
    selected && "selected",
    selectionMode && "selection-mode"
  ].filter(Boolean).join(" ");
  $$payload.out.push(`<div${attr_class(clsx(cardClass), "svelte-sfuhvk")}>`);
  if (selectionMode) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="selection-area svelte-sfuhvk">`);
    TransactionCheckbox($$payload, { checked: selected });
    $$payload.out.push(`<!----></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="transaction-content svelte-sfuhvk"><div class="transaction-header svelte-sfuhvk"><div class="merchant-info svelte-sfuhvk"><h4 class="merchant-name svelte-sfuhvk">${escape_html(transaction.merchant)}</h4> `);
  if (transaction.description && !compact) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<p class="description svelte-sfuhvk">${escape_html(transaction.description)}</p>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> <div class="amount-area svelte-sfuhvk">`);
  AmountDisplay($$payload, { amount: transaction.amount, size: compact ? "sm" : "md" });
  $$payload.out.push(`<!----> `);
  if (showDate) {
    $$payload.out.push("<!--[-->");
    DateDisplay($$payload, { date: transaction.date, format: "short" });
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div></div> `);
  if (!compact) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="transaction-meta svelte-sfuhvk">`);
    if (showCategory) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="category-area svelte-sfuhvk">`);
      if (hasCategory) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<button class="category-badge svelte-sfuhvk"${attr_style(`background-color: ${stringify(categoryColor)}20; border-color: ${stringify(categoryColor)};`)}><span class="category-icon svelte-sfuhvk">${escape_html(transaction.category?.icon)}</span> <span class="category-name svelte-sfuhvk">${escape_html(transaction.category?.name)}</span></button>`);
      } else {
        $$payload.out.push("<!--[!-->");
        $$payload.out.push(`<button class="category-badge uncategorized svelte-sfuhvk"><span class="category-icon svelte-sfuhvk">🏷️</span> <span class="category-name svelte-sfuhvk">Sin categoría</span></button>`);
      }
      $$payload.out.push(`<!--]--> `);
      {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> <div class="observations-area svelte-sfuhvk">`);
    {
      $$payload.out.push("<!--[!-->");
      if (transaction.observations) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="observations-display svelte-sfuhvk"><p class="observations-text svelte-sfuhvk">${escape_html(transaction.observations)}</p> `);
        if (showActions) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<button class="edit-observations-btn svelte-sfuhvk" title="Editar observaciones">✏️</button>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
        if (showActions) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<button class="add-observations-btn svelte-sfuhvk">+ Agregar observaciones</button>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]-->`);
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]--></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  if (showActions && !compact) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="transaction-actions svelte-sfuhvk"><!---->`);
    slot($$payload, $$props, "actions", {}, null);
    $$payload.out.push(`<!----></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  bind_props($$props, {
    transaction,
    categories,
    selected,
    selectionMode,
    showActions,
    showCategory,
    showDate,
    compact
  });
  pop();
}
function TransactionList($$payload, $$props) {
  push();
  let totalTransactions, listClass;
  let groups = fallback($$props["groups"], () => [], true);
  let categories = fallback($$props["categories"], () => [], true);
  let selectedTransactions = fallback($$props["selectedTransactions"], () => /* @__PURE__ */ new Set(), true);
  let selectionMode = fallback($$props["selectionMode"], false);
  let loading = fallback($$props["loading"], false);
  let empty = fallback($$props["empty"], false);
  let emptyTitle = fallback($$props["emptyTitle"], "No hay transacciones");
  let emptyMessage = fallback($$props["emptyMessage"], "No se encontraron transacciones para los filtros aplicados.");
  let collapsible = fallback($$props["collapsible"], true);
  let currency = fallback($$props["currency"], "EUR");
  let collapsedGroups = /* @__PURE__ */ new Set();
  function isGroupCollapsed(date) {
    return collapsedGroups.has(date);
  }
  function getGroupSelectionState(group) {
    const groupTransactionIds = group.transactions.map((t2) => t2.id);
    const selectedInGroup = groupTransactionIds.filter((id) => selectedTransactions.has(id));
    if (selectedInGroup.length === 0) return "none";
    if (selectedInGroup.length === groupTransactionIds.length) return "all";
    return "partial";
  }
  totalTransactions = groups.reduce((sum, group) => sum + group.transactions.length, 0);
  listClass = [
    "transaction-list",
    loading && "loading",
    selectionMode && "selection-mode"
  ].filter(Boolean).join(" ");
  $$payload.out.push(`<div${attr_class(clsx(listClass), "svelte-137e8vm")}>`);
  if (loading) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(Array(3));
    $$payload.out.push(`<div class="loading-state svelte-137e8vm"><!--[-->`);
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      each_array[i];
      const each_array_1 = ensure_array_like(Array(3));
      $$payload.out.push(`<div class="loading-group svelte-137e8vm"><div class="loading-header svelte-137e8vm"></div> <div class="loading-transactions svelte-137e8vm"><!--[-->`);
      for (let j = 0, $$length2 = each_array_1.length; j < $$length2; j++) {
        each_array_1[j];
        $$payload.out.push(`<div class="loading-transaction svelte-137e8vm"></div>`);
      }
      $$payload.out.push(`<!--]--></div></div>`);
    }
    $$payload.out.push(`<!--]--></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    if (empty) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="empty-state svelte-137e8vm"><div class="empty-icon svelte-137e8vm">📝</div> <h3 class="empty-title svelte-137e8vm">${escape_html(emptyTitle)}</h3> <p class="empty-message svelte-137e8vm">${escape_html(emptyMessage)}</p> <!---->`);
      slot($$payload, $$props, "emptyActions", {}, null);
      $$payload.out.push(`<!----></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
      const each_array_2 = ensure_array_like(groups);
      $$payload.out.push(`<div class="transaction-groups svelte-137e8vm"><!--[-->`);
      for (let $$index_3 = 0, $$length = each_array_2.length; $$index_3 < $$length; $$index_3++) {
        let group = each_array_2[$$index_3];
        const isCollapsed = isGroupCollapsed(group.date);
        const selectionState = getGroupSelectionState(group);
        $$payload.out.push(`<div${attr_class("transaction-group svelte-137e8vm", void 0, { "collapsed": isCollapsed })}><div class="group-header svelte-137e8vm"><div class="group-date-section svelte-137e8vm">`);
        if (collapsible) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<button class="collapse-toggle svelte-137e8vm"${attr("aria-label", isCollapsed ? "Expandir grupo" : "Colapsar grupo")}><span${attr_class("collapse-icon svelte-137e8vm", void 0, { "collapsed": isCollapsed })}>▼</span></button>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--> <div class="group-date svelte-137e8vm">`);
        DateDisplay($$payload, { date: group.date, format: "relative" });
        $$payload.out.push(`<!----></div> <div class="transaction-count svelte-137e8vm">${escape_html(group.transactions.length)} transacciones</div></div> <div class="group-actions svelte-137e8vm">`);
        if (selectionMode) {
          $$payload.out.push("<!--[-->");
          TransactionCheckbox($$payload, {
            checked: selectionState === "all",
            indeterminate: selectionState === "partial"
          });
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--> <div class="group-totals svelte-137e8vm">`);
        if (group.income > 0) {
          $$payload.out.push("<!--[-->");
          AmountDisplay($$payload, { amount: group.income, currency, size: "sm" });
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--> `);
        if (group.expenses > 0) {
          $$payload.out.push("<!--[-->");
          AmountDisplay($$payload, { amount: -group.expenses, currency, size: "sm" });
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--> `);
        AmountDisplay($$payload, { amount: group.total, currency, size: "sm" });
        $$payload.out.push(`<!----></div></div></div> `);
        if (!isCollapsed) {
          $$payload.out.push("<!--[-->");
          const each_array_3 = ensure_array_like(group.transactions);
          $$payload.out.push(`<div class="group-transactions svelte-137e8vm"><!--[-->`);
          for (let $$index_2 = 0, $$length2 = each_array_3.length; $$index_2 < $$length2; $$index_2++) {
            let transaction = each_array_3[$$index_2];
            TransactionCard($$payload, {
              transaction,
              categories,
              selected: selectedTransactions.has(transaction.id),
              selectionMode,
              $$slots: {
                actions: ($$payload2) => {
                  $$payload2.out.push(`<div slot="actions" class="transaction-actions svelte-137e8vm">`);
                  ActionButton($$payload2, {
                    variant: "ghost",
                    size: "sm",
                    icon: "⋯",
                    "aria-label": "Más opciones"
                  });
                  $$payload2.out.push(`<!----></div>`);
                }
              }
            });
          }
          $$payload.out.push(`<!--]--></div>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--></div>`);
      }
      $$payload.out.push(`<!--]--></div> `);
      if (totalTransactions > 0) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="list-summary svelte-137e8vm"><p class="summary-text svelte-137e8vm">Total: ${escape_html(totalTransactions)} transacciones `);
        if (selectionMode && selectedTransactions.size > 0) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`• ${escape_html(selectedTransactions.size)} seleccionadas`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--></p></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div>`);
  bind_props($$props, {
    groups,
    categories,
    selectedTransactions,
    selectionMode,
    loading,
    empty,
    emptyTitle,
    emptyMessage,
    collapsible,
    currency
  });
  pop();
}
function TransactionPageTemplate($$payload, $$props) {
  push();
  let selectedCount, totalTransactions, isEmpty, templateClass;
  let stats = $$props["stats"];
  let searchValue = fallback($$props["searchValue"], "");
  let dateRange = $$props["dateRange"];
  let dateMode = fallback($$props["dateMode"], "month");
  let filters = fallback($$props["filters"], () => [], true);
  let transactionGroups = fallback($$props["transactionGroups"], () => [], true);
  let categories = fallback($$props["categories"], () => [], true);
  let selectedTransactions = fallback($$props["selectedTransactions"], () => /* @__PURE__ */ new Set(), true);
  let selectionMode = fallback($$props["selectionMode"], false);
  let showFilters = fallback($$props["showFilters"], false);
  let loading = fallback($$props["loading"], false);
  let currency = fallback($$props["currency"], "EUR");
  let period = fallback($$props["period"], "mes actual");
  selectedCount = selectedTransactions.size;
  totalTransactions = transactionGroups.reduce((sum, group) => sum + group.transactions.length, 0);
  isEmpty = !loading && transactionGroups.length === 0;
  templateClass = [
    "transaction-page-template",
    loading && "loading",
    selectionMode && "selection-mode"
  ].filter(Boolean).join(" ");
  $$payload.out.push(`<div${attr_class(clsx(templateClass), "svelte-cp6gid")}>`);
  TransactionHeader($$payload, {
    stats,
    currency,
    period,
    loading,
    children: ($$payload2) => {
      $$payload2.out.push(`<!---->`);
      slot($$payload2, $$props, "headerExtra", {}, null);
      $$payload2.out.push(`<!---->`);
    },
    $$slots: { default: true }
  });
  $$payload.out.push(`<!----> `);
  TransactionToolbar($$payload, {
    searchValue,
    dateRange,
    dateMode,
    filters,
    selectedCount,
    totalCount: totalTransactions,
    showFilters,
    selectionMode,
    loading,
    $$slots: {
      actions: ($$payload2) => {
        $$payload2.out.push(`<div slot="actions">`);
        if (!selectionMode && totalTransactions > 0) {
          $$payload2.out.push("<!--[-->");
          ActionButton($$payload2, {
            variant: "outline",
            icon: "☑️",
            children: ($$payload3) => {
              $$payload3.out.push(`<!---->Seleccionar`);
            },
            $$slots: { default: true }
          });
        } else {
          $$payload2.out.push("<!--[!-->");
        }
        $$payload2.out.push(`<!--]--> <!---->`);
        slot($$payload2, $$props, "toolbarActions", {}, null);
        $$payload2.out.push(`<!----></div>`);
      },
      extraFilters: ($$payload2) => {
        $$payload2.out.push(`<div slot="extraFilters"><!---->`);
        slot($$payload2, $$props, "extraFilters", {}, null);
        $$payload2.out.push(`<!----></div>`);
      }
    }
  });
  $$payload.out.push(`<!----> <main class="page-content svelte-cp6gid">`);
  TransactionList($$payload, {
    groups: transactionGroups,
    categories,
    selectedTransactions,
    selectionMode,
    loading,
    empty: isEmpty,
    currency,
    $$slots: {
      emptyActions: ($$payload2) => {
        $$payload2.out.push(`<div slot="emptyActions">`);
        ActionButton($$payload2, {
          variant: "primary",
          icon: "+",
          children: ($$payload3) => {
            $$payload3.out.push(`<!---->Agregar primera transacción`);
          },
          $$slots: { default: true }
        });
        $$payload2.out.push(`<!----> <!---->`);
        slot($$payload2, $$props, "emptyActions", {}, null);
        $$payload2.out.push(`<!----></div>`);
      }
    }
  });
  $$payload.out.push(`<!----> <!---->`);
  slot($$payload, $$props, "content", {}, null);
  $$payload.out.push(`<!----></main> `);
  if (!selectionMode && !isEmpty) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="fab-container svelte-cp6gid">`);
    ActionButton($$payload, {
      variant: "primary",
      size: "lg",
      icon: "+",
      "aria-label": "Agregar transacción"
    });
    $$payload.out.push(`<!----></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <!---->`);
  slot($$payload, $$props, "modals", {}, null);
  $$payload.out.push(`<!----> <!---->`);
  slot($$payload, $$props, "notifications", {}, null);
  $$payload.out.push(`<!----></div>`);
  bind_props($$props, {
    stats,
    searchValue,
    dateRange,
    dateMode,
    filters,
    transactionGroups,
    categories,
    selectedTransactions,
    selectionMode,
    showFilters,
    loading,
    currency,
    period
  });
  pop();
}
function AddTransactionModal($$payload, $$props) {
  push();
  var $$store_subs;
  let isOpen = fallback($$props["isOpen"], false);
  let categories = fallback($$props["categories"], () => [], true);
  let onSubmit = fallback($$props["onSubmit"], () => {
  });
  let onCancel = fallback($$props["onCancel"], () => {
  });
  let amount = "";
  let type = "expense";
  let merchant = "";
  let description = "";
  let date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  let categoryId = "";
  let isSubmitting = false;
  let errors = {};
  function resetForm() {
    amount = "";
    type = "expense";
    merchant = "";
    description = "";
    date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    categoryId = "";
    isSubmitting = false;
    errors = {};
  }
  if (isOpen) {
    resetForm();
  }
  if (isOpen) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="modal-backdrop svelte-j3v6du" role="dialog" tabindex="-1"><div class="modal-content svelte-j3v6du"><button class="close-btn svelte-j3v6du" aria-label="Close">`);
    X($$payload, { size: 20 });
    $$payload.out.push(`<!----></button> <div class="modal-header svelte-j3v6du"><h3 class="svelte-j3v6du">${escape_html(store_get($$store_subs ??= {}, "$t", t)("transactions.modal.new_transaction"))}</h3></div> <form class="form svelte-j3v6du"><div class="field-group svelte-j3v6du"><div class="amount-container svelte-j3v6du"><div class="amount-input svelte-j3v6du"><span class="currency svelte-j3v6du">€</span> <input type="number" step="0.01" min="0"${attr("value", amount)}${attr("placeholder", store_get($$store_subs ??= {}, "$t", t)("transactions.modal.amount_placeholder"))}${attr_class("amount-field svelte-j3v6du", void 0, { "error": errors.amount })} id="amount" autocomplete="off"/></div> <div class="type-toggle svelte-j3v6du"><button type="button"${attr_class("type-btn svelte-j3v6du", void 0, { "expense": type === "expense", "income": type === "income" })}>${escape_html(type === "expense" ? store_get($$store_subs ??= {}, "$t", t)("transactions.modal.expense") : store_get($$store_subs ??= {}, "$t", t)("transactions.modal.income"))}</button></div></div> `);
    if (errors.amount) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<span class="error-text svelte-j3v6du">${escape_html(errors.amount)}</span>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div> <div class="field-group svelte-j3v6du"><label class="field-label svelte-j3v6du" for="merchant">${escape_html(store_get($$store_subs ??= {}, "$t", t)("transactions.modal.where_label"))}</label> <input type="text"${attr("value", merchant)}${attr("placeholder", store_get($$store_subs ??= {}, "$t", t)("transactions.modal.merchant_placeholder"))}${attr_class("field-input svelte-j3v6du", void 0, { "error": errors.merchant })} id="merchant" autocomplete="organization"/> `);
    if (errors.merchant) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<span class="error-text svelte-j3v6du">${escape_html(errors.merchant)}</span>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div> <div class="field-group svelte-j3v6du"><label class="field-label svelte-j3v6du" for="description">${escape_html(store_get($$store_subs ??= {}, "$t", t)("transactions.modal.what_for_label"))}</label> <input type="text"${attr("value", description)}${attr("placeholder", store_get($$store_subs ??= {}, "$t", t)("transactions.modal.description_placeholder"))} class="field-input svelte-j3v6du" id="description" maxlength="200"/></div> <div class="field-group svelte-j3v6du"><label class="field-label svelte-j3v6du" for="date">${escape_html(store_get($$store_subs ??= {}, "$t", t)("transactions.modal.when_label"))}</label> <input type="date"${attr("value", date)}${attr_class("field-input date-input svelte-j3v6du", void 0, { "error": errors.date })} id="date"/> `);
    if (errors.date) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<span class="error-text svelte-j3v6du">${escape_html(errors.date)}</span>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div> <div class="field-group svelte-j3v6du"><label class="field-label svelte-j3v6du" for="category">${escape_html(store_get($$store_subs ??= {}, "$t", t)("transactions.category"))}</label> `);
    if (categories.length > 0) {
      $$payload.out.push("<!--[-->");
      const each_array = ensure_array_like(categories.filter((c) => type === "income" && ["income", "no_compute"].includes(c.type) || type === "expense" && [
        "essential",
        "discretionary",
        "investment",
        "debt_payment",
        "no_compute"
      ].includes(c.type)));
      $$payload.out.push(`<div class="category-grid svelte-j3v6du"><!--[-->`);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let category = each_array[$$index];
        $$payload.out.push(`<button type="button"${attr_class("category-chip svelte-j3v6du", void 0, { "selected": categoryId === category.id })}${attr_style(`--category-color: ${stringify(category.color)}`)}><span class="category-icon svelte-j3v6du">${escape_html(category.icon)}</span> <span class="category-name svelte-j3v6du">${escape_html(category.name)}</span></button>`);
      }
      $$payload.out.push(`<!--]--></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<div class="empty-categories svelte-j3v6du"><div class="empty-categories-content svelte-j3v6du"><span class="empty-categories-icon svelte-j3v6du">🏷️</span> <p class="empty-categories-text svelte-j3v6du">No tienes categorías configuradas. Las categorías te ayudan a organizar y analizar mejor tus gastos e ingresos.</p> <button type="button" class="create-categories-btn svelte-j3v6du">`);
      Plus($$payload, { size: 16 });
      $$payload.out.push(`<!----> Crear categorías</button></div></div>`);
    }
    $$payload.out.push(`<!--]--></div> <div class="form-actions svelte-j3v6du"><button type="button" class="btn-secondary svelte-j3v6du">${escape_html(store_get($$store_subs ??= {}, "$t", t)("common.cancel"))}</button> <button type="submit" class="btn-primary svelte-j3v6du"${attr("disabled", isSubmitting, true)}>`);
    if (isSubmitting) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="spinner svelte-j3v6du"></div> ${escape_html(store_get($$store_subs ??= {}, "$t", t)("transactions.modal.saving"))}`);
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`${escape_html(store_get($$store_subs ??= {}, "$t", t)("transactions.modal.save_transaction"))}`);
    }
    $$payload.out.push(`<!--]--></button></div></form></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { isOpen, categories, onSubmit, onCancel });
  pop();
}
function SmartCategorizationModal($$payload, $$props) {
  push();
  let hasMatches;
  let isOpen = fallback($$props["isOpen"], false);
  let transaction = fallback($$props["transaction"], null);
  let selectedCategory = fallback($$props["selectedCategory"], null);
  let matchingTransactions = fallback($$props["matchingTransactions"], () => [], true);
  let suggestions = fallback($$props["suggestions"], () => [], true);
  let onConfirm = fallback($$props["onConfirm"], () => {
  });
  let onCancel = fallback($$props["onCancel"], () => {
  });
  let selectedScope = "single";
  function getPatternName(transaction2) {
    return transaction2.merchant || transaction2.description || "Esta transacción";
  }
  hasMatches = matchingTransactions.length > 0;
  if (isOpen && transaction && selectedCategory) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="modal-overlay svelte-17055o5" role="dialog" aria-modal="true" aria-labelledby="categorization-title"><div class="modal-content svelte-17055o5"><div class="modal-header svelte-17055o5"><div class="header-content svelte-17055o5"><h2 id="categorization-title" class="modal-title svelte-17055o5">Aplicar categoría</h2> <div class="category-preview svelte-17055o5"><span class="merchant-name svelte-17055o5">${escape_html(getPatternName(transaction))}</span> <div class="category-assignment svelte-17055o5"><span class="arrow svelte-17055o5">→</span> <div class="category-chip svelte-17055o5"><span class="category-icon svelte-17055o5">${escape_html(selectedCategory.icon)}</span> <span class="category-name svelte-17055o5">${escape_html(selectedCategory.name)}</span></div></div></div></div> <button class="close-btn svelte-17055o5" aria-label="Cerrar">`);
    X($$payload, { size: 20 });
    $$payload.out.push(`<!----></button></div> <div class="content-section svelte-17055o5"><div class="scope-options svelte-17055o5"><label${attr_class("scope-option svelte-17055o5", void 0, { "selected": selectedScope === "single" })}><input type="radio"${attr("checked", selectedScope === "single", true)} value="single" name="scope" class="svelte-17055o5"/> <div class="option-content svelte-17055o5"><div class="option-info svelte-17055o5"><span class="option-title svelte-17055o5">Solo esta transacción</span> <span class="option-detail svelte-17055o5">Aplicar únicamente a esta transacción</span></div> <span class="option-count svelte-17055o5">1</span></div></label> `);
    if (hasMatches) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<label${attr_class("scope-option svelte-17055o5", void 0, { "selected": selectedScope === "pattern" })}><input type="radio"${attr("checked", selectedScope === "pattern", true)} value="pattern" name="scope" class="svelte-17055o5"/> <div class="option-content svelte-17055o5"><div class="option-info svelte-17055o5"><span class="option-title svelte-17055o5">Transacciones similares</span> <span class="option-detail svelte-17055o5">Aplicar a todas las transacciones similares</span></div> <span class="option-count svelte-17055o5">${escape_html(matchingTransactions.length + 1)}</span></div></label> `);
      {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]-->`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div> `);
    {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div> <div class="modal-actions svelte-17055o5"><button class="btn-secondary svelte-17055o5">Cancelar</button> <button class="btn-primary svelte-17055o5">${escape_html(
      "Aplicar categoría"
    )}</button></div></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  bind_props($$props, {
    isOpen,
    transaction,
    selectedCategory,
    matchingTransactions,
    suggestions,
    onConfirm,
    onCancel
  });
  pop();
}
function CategorySelectionModal($$payload, $$props) {
  push();
  let isIncomeTransaction, filteredCategories, groupedCategories;
  let isOpen = fallback($$props["isOpen"], false);
  let transaction = fallback($$props["transaction"], null);
  let categories = fallback($$props["categories"], () => [], true);
  let onSelect = fallback($$props["onSelect"], () => {
  });
  let onCancel = fallback($$props["onCancel"], () => {
  });
  let searchTerm = "";
  function preventBodyScroll() {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
  }
  function restoreBodyScroll() {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
  }
  const typeDisplayNames = {
    essential: "Gastos Esenciales",
    discretionary: "Gastos Discrecionales",
    investment: "Inversiones",
    debt_payment: "Pago de Deudas",
    no_compute: "No Computar",
    income: "Ingresos"
  };
  onDestroy(() => {
    restoreBodyScroll();
  });
  if (isOpen) {
    preventBodyScroll();
    setTimeout(
      () => {
      },
      100
    );
  } else {
    restoreBodyScroll();
    searchTerm = "";
  }
  isIncomeTransaction = transaction ? transaction.amount > 0 : false;
  filteredCategories = categories.filter((cat) => searchTerm === "" || cat.name.toLowerCase().includes(searchTerm.toLowerCase()));
  groupedCategories = (() => {
    if (isIncomeTransaction) {
      return {
        income: filteredCategories.filter((cat) => cat.type === "income" || cat.type === "INCOME"),
        no_compute: filteredCategories.filter((cat) => cat.type === "no_compute")
      };
    } else {
      return {
        essential: filteredCategories.filter((cat) => cat.type === "essential"),
        discretionary: filteredCategories.filter((cat) => cat.type === "discretionary"),
        investment: filteredCategories.filter((cat) => cat.type === "investment"),
        debt_payment: filteredCategories.filter((cat) => cat.type === "debt_payment"),
        no_compute: filteredCategories.filter((cat) => cat.type === "no_compute")
      };
    }
  })();
  if (
    // Type display names
    isOpen && transaction
  ) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="modal-overlay svelte-hnu3u1" role="dialog" aria-modal="true" aria-labelledby="category-selection-title" data-testid="category-modal"><div class="modal-content svelte-hnu3u1"><div class="modal-header svelte-hnu3u1"><div class="header-content svelte-hnu3u1"><div class="title-section svelte-hnu3u1"><h2 id="category-selection-title" class="modal-title svelte-hnu3u1">Categorizar</h2> <p class="modal-subtitle svelte-hnu3u1">Selecciona una categoría para organizar esta transacción</p></div> <div class="transaction-preview svelte-hnu3u1"><div class="transaction-info svelte-hnu3u1"><div class="merchant-name svelte-hnu3u1">${escape_html(transaction.merchant)}</div> <div class="transaction-details svelte-hnu3u1"><span${attr_class("amount svelte-hnu3u1", void 0, { "income": transaction.amount > 0 })}>${escape_html(new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Math.abs(transaction.amount)))}</span> <span class="separator svelte-hnu3u1">•</span> <span class="date svelte-hnu3u1">${escape_html(transaction.time)}</span></div></div></div></div> <button class="close-btn svelte-hnu3u1" aria-label="Cerrar">`);
    X($$payload, { size: 18 });
    $$payload.out.push(`<!----></button></div> <div class="search-section svelte-hnu3u1"><div class="search-input-container svelte-hnu3u1"><input${attr("value", searchTerm)} type="text" placeholder="🔍 Buscar categorías..." class="search-input svelte-hnu3u1"/></div></div> <div class="category-content svelte-hnu3u1">`);
    if (transaction?.categoryId) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="uncategorize-section svelte-hnu3u1"><button class="uncategorize-btn svelte-hnu3u1" data-testid="uncategorize-btn"><span class="uncategorize-icon svelte-hnu3u1">❌</span> <span class="uncategorize-text svelte-hnu3u1">Quitar categoría</span></button></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> `);
    if (categories.length === 0) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="empty-categories svelte-hnu3u1"><div class="empty-categories-content svelte-hnu3u1"><span class="empty-categories-icon svelte-hnu3u1">🏷️</span> <p class="empty-categories-text svelte-hnu3u1">No tienes categorías configuradas. Las categorías te ayudan a organizar y analizar mejor tus gastos e ingresos.</p> <button class="create-categories-btn svelte-hnu3u1">`);
      Plus($$payload, { size: 16 });
      $$payload.out.push(`<!----> Crear categorías</button></div></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
      if (isIncomeTransaction) {
        $$payload.out.push("<!--[-->");
        const each_array = ensure_array_like(Object.entries(groupedCategories));
        $$payload.out.push(`<!--[-->`);
        for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
          let [type, categoryList] = each_array[$$index_1];
          if (categoryList.length > 0) {
            $$payload.out.push("<!--[-->");
            const each_array_1 = ensure_array_like(categoryList);
            $$payload.out.push(`<div class="category-group svelte-hnu3u1"><h3 class="group-title svelte-hnu3u1">${escape_html(typeDisplayNames[type])}</h3> <div class="category-list svelte-hnu3u1"><!--[-->`);
            for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
              let category = each_array_1[$$index];
              $$payload.out.push(`<button${attr_class(`category-option ${stringify(type)}-type`, "svelte-hnu3u1")}><span class="category-icon svelte-hnu3u1">${escape_html(category.icon)}</span> <span class="category-name svelte-hnu3u1">${escape_html(category.name)}</span></button>`);
            }
            $$payload.out.push(`<!--]--></div></div>`);
          } else {
            $$payload.out.push("<!--[!-->");
          }
          $$payload.out.push(`<!--]-->`);
        }
        $$payload.out.push(`<!--]-->`);
      } else {
        $$payload.out.push("<!--[!-->");
        const each_array_2 = ensure_array_like(Object.entries(groupedCategories));
        $$payload.out.push(`<!--[-->`);
        for (let $$index_3 = 0, $$length = each_array_2.length; $$index_3 < $$length; $$index_3++) {
          let [type, categoryList] = each_array_2[$$index_3];
          if (categoryList.length > 0) {
            $$payload.out.push("<!--[-->");
            const each_array_3 = ensure_array_like(categoryList);
            $$payload.out.push(`<div class="category-group svelte-hnu3u1"><h3 class="group-title svelte-hnu3u1">${escape_html(typeDisplayNames[type])}</h3> <div class="category-list svelte-hnu3u1"><!--[-->`);
            for (let $$index_2 = 0, $$length2 = each_array_3.length; $$index_2 < $$length2; $$index_2++) {
              let category = each_array_3[$$index_2];
              $$payload.out.push(`<button${attr_class(`category-option ${stringify(type)}-type`, "svelte-hnu3u1")}><span class="category-icon svelte-hnu3u1">${escape_html(category.icon)}</span> <span class="category-name svelte-hnu3u1">${escape_html(category.name)}</span></button>`);
            }
            $$payload.out.push(`<!--]--></div></div>`);
          } else {
            $$payload.out.push("<!--[!-->");
          }
          $$payload.out.push(`<!--]-->`);
        }
        $$payload.out.push(`<!--]-->`);
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]--></div></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  bind_props($$props, { isOpen, transaction, categories, onSelect, onCancel });
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let searchQuery = "";
  let showFilters = false;
  let selectedPeriod = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
  let selectedCategories = [];
  let isSelectionMode = false;
  let showCategoryModal = false;
  let categoryModalTransaction = null;
  let showAddModal = false;
  let showDeleteSelectedModal = false;
  let showDeleteSingleModal = false;
  let showSmartCategorization = false;
  let smartCategorizationTransaction = null;
  let smartCategorizationCategory = null;
  let smartMatchingTransactions = [];
  let smartSuggestions = [];
  let showAllTransactions = typeof window !== "undefined" ? localStorage.getItem("showAllTransactions") === "true" || localStorage.getItem("showAllTransactions") === null : true;
  let showHiddenTransactions = typeof window !== "undefined" ? localStorage.getItem("showHiddenTransactions") === "false" ? false : true : true;
  let filteredTransactions = () => {
    let filtered = store_get($$store_subs ??= {}, "$apiTransactions", apiTransactions);
    if (!showAllTransactions) {
      if (selectedPeriod) {
        filtered = filtered.filter((t2) => t2.date.startsWith(selectedPeriod));
      }
    }
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((t2) => t2.categoryId && selectedCategories.includes(t2.categoryId));
    }
    if (!showHiddenTransactions) {
      filtered = filtered.filter((t2) => !t2.hidden);
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };
  let groupedTransactions = () => {
    const filtered = filteredTransactions();
    const groups = /* @__PURE__ */ new Map();
    filtered.forEach((transaction) => {
      const date = transaction.date;
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date).push(transaction);
    });
    return Array.from(groups.entries()).map(([date, transactions]) => {
      const income = transactions.filter((t2) => t2.amount > 0).reduce((sum, t2) => sum + t2.amount, 0);
      const expenses = transactions.filter((t2) => t2.amount < 0).reduce((sum, t2) => sum + Math.abs(t2.amount), 0);
      const total = income - expenses;
      return {
        date,
        transactions: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        total,
        income,
        expenses
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };
  let periodStats = () => {
    const filtered = filteredTransactions();
    const visibleTransactions = filtered.filter((t2) => !t2.hidden);
    const computedTransactions = visibleTransactions.filter((t2) => {
      const category = getCategoryById(t2.categoryId);
      return !category || category.type !== "no_compute";
    });
    const income = computedTransactions.filter((t2) => t2.amount > 0).reduce((sum, t2) => sum + t2.amount, 0);
    const expenses = Math.abs(computedTransactions.filter((t2) => t2.amount < 0).reduce((sum, t2) => sum + t2.amount, 0));
    const balance = income - expenses;
    const expenseBreakdown = {
      essential: 0,
      discretionary: 0,
      investment: 0,
      debt_payment: 0,
      no_compute: 0
    };
    computedTransactions.filter((t2) => t2.amount < 0).forEach((transaction) => {
      const category = getCategoryById(transaction.categoryId);
      const amount = Math.abs(transaction.amount);
      if (category) {
        switch (category.type) {
          case "essential":
            expenseBreakdown.essential += amount;
            break;
          case "discretionary":
            expenseBreakdown.discretionary += amount;
            break;
          case "investment":
            expenseBreakdown.investment += amount;
            break;
          case "debt_payment":
            expenseBreakdown.debt_payment += amount;
            break;
          case "no_compute":
            expenseBreakdown.no_compute += amount;
            break;
        }
      }
    });
    return {
      income,
      expenses,
      balance,
      transactionCount: visibleTransactions.length,
      expenseBreakdown
    };
  };
  let templateStats = () => periodStats();
  let templateDateRange = () => {
    if (selectedPeriod) {
      const date = /* @__PURE__ */ new Date(selectedPeriod + "-01");
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      return { start, end };
    }
    return { start: /* @__PURE__ */ new Date(), end: /* @__PURE__ */ new Date() };
  };
  let templateDateMode = () => "month";
  let templateFilters = () => {
    const filters = [];
    selectedCategories.forEach((categoryId) => {
      const category = getCategoryById(categoryId);
      if (category) {
        filters.push({
          id: categoryId,
          label: category.name,
          active: true,
          removable: true
        });
      }
    });
    return filters;
  };
  let templatePeriod = () => {
    if (!showAllTransactions && selectedPeriod) {
      const date = /* @__PURE__ */ new Date(selectedPeriod + "-01");
      return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    }
    return "todos los períodos";
  };
  function getCategoryById(id) {
    if (!id) return void 0;
    return store_get($$store_subs ??= {}, "$apiCategories", apiCategories).find((c) => c.id === id);
  }
  onDestroy(() => {
  });
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    TransactionPageTemplate($$payload2, {
      stats: templateStats,
      searchValue: searchQuery,
      dateRange: templateDateRange,
      dateMode: templateDateMode,
      filters: templateFilters,
      transactionGroups: groupedTransactions(),
      categories: store_get($$store_subs ??= {}, "$apiCategories", apiCategories),
      selectedTransactions: store_get($$store_subs ??= {}, "$apiSelectedTransactions", apiSelectedTransactions),
      selectionMode: isSelectionMode,
      showFilters,
      loading: false,
      currency: "EUR",
      period: templatePeriod,
      $$slots: {
        extraFilters: ($$payload3) => {
          $$payload3.out.push(`<div slot="extraFilters">`);
          if (!showAllTransactions) {
            $$payload3.out.push("<!--[-->");
            FilterPill($$payload3, { label: "Período actual", active: true, removable: true });
          } else {
            $$payload3.out.push("<!--[!-->");
          }
          $$payload3.out.push(`<!--]--> `);
          if (!showHiddenTransactions) {
            $$payload3.out.push("<!--[-->");
            FilterPill($$payload3, { label: "Ocultar archivadas", active: true, removable: true });
          } else {
            $$payload3.out.push("<!--[!-->");
          }
          $$payload3.out.push(`<!--]--></div>`);
        },
        toolbarActions: ($$payload3) => {
          $$payload3.out.push(`<div slot="toolbarActions">`);
          ActionButton($$payload3, {
            variant: "outline",
            icon: "👁️",
            children: ($$payload4) => {
              $$payload4.out.push(`<!---->${escape_html(showHiddenTransactions ? "Ocultar archivadas" : "Mostrar archivadas")}`);
            },
            $$slots: { default: true }
          });
          $$payload3.out.push(`<!----></div>`);
        }
      }
    });
    $$payload2.out.push(`<!---->   `);
    CategorySelectionModal($$payload2, {
      transaction: categoryModalTransaction,
      categories: store_get($$store_subs ??= {}, "$apiCategories", apiCategories),
      get show() {
        return showCategoryModal;
      },
      set show($$value) {
        showCategoryModal = $$value;
        $$settled = false;
      }
    });
    $$payload2.out.push(`<!----> `);
    SmartCategorizationModal($$payload2, {
      transaction: smartCategorizationTransaction,
      category: smartCategorizationCategory,
      matchingTransactions: smartMatchingTransactions,
      suggestions: smartSuggestions,
      get show() {
        return showSmartCategorization;
      },
      set show($$value) {
        showSmartCategorization = $$value;
        $$settled = false;
      }
    });
    $$payload2.out.push(`<!----> `);
    AddTransactionModal($$payload2, {
      categories: store_get($$store_subs ??= {}, "$apiCategories", apiCategories),
      get show() {
        return showAddModal;
      },
      set show($$value) {
        showAddModal = $$value;
        $$settled = false;
      }
    });
    $$payload2.out.push(`<!----> `);
    ConfirmModal($$payload2, {
      title: "Eliminar transacciones seleccionadas",
      message: `¿Estás seguro de que deseas eliminar las ${stringify(store_get($$store_subs ??= {}, "$apiSelectedTransactions", apiSelectedTransactions).size)} transacciones seleccionadas? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      confirmVariant: "danger",
      get show() {
        return showDeleteSelectedModal;
      },
      set show($$value) {
        showDeleteSelectedModal = $$value;
        $$settled = false;
      }
    });
    $$payload2.out.push(`<!----> `);
    ConfirmModal($$payload2, {
      title: "Eliminar transacción",
      message: "¿Estás seguro de que deseas eliminar esta transacción? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      confirmVariant: "danger",
      get show() {
        return showDeleteSingleModal;
      },
      set show($$value) {
        showDeleteSingleModal = $$value;
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
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
