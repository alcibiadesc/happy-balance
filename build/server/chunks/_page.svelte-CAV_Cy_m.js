import { x as push, U as head, z as pop, V as fallback, F as attr_class, Z as clsx, Q as escape_html, N as slot, W as bind_props, P as ensure_array_like, X as attr_style, O as stringify, J as attr, G as store_get, I as unsubscribe_stores } from './index2-B8O15wye.js';
import './utils-Bg2Rux6K.js';
import './state.svelte-CL78AAMk.js';
import { t } from './i18n-CbN1nHkj.js';
import './api-transactions-DyZ55f-T.js';
import { c as createEventDispatcher } from './index-server-DyywgJ7D.js';
import { A as ActionButton, S as StatCard, a as SearchInput, F as FilterGroup, T as TransactionCheckbox, D as DateDisplay, b as AmountDisplay } from './DateDisplay-iDETiVR8.js';
import './index-CMV7aPAw.js';

function ProgressStep($$payload, $$props) {
  push();
  let isActive, isCompleted, isPending, stepClass;
  let step = $$props["step"];
  let currentStep = $$props["currentStep"];
  let title = $$props["title"];
  let description = fallback($$props["description"], "");
  let icon = fallback($$props["icon"], void 0);
  let clickable = fallback($$props["clickable"], false);
  isActive = step === currentStep;
  isCompleted = step < currentStep;
  isPending = step > currentStep;
  stepClass = [
    "progress-step",
    isActive && "active",
    isCompleted && "completed",
    isPending && "pending",
    clickable && "clickable"
  ].filter(Boolean).join(" ");
  $$payload.out.push(`<div${attr_class(clsx(stepClass), "svelte-ugeeye")}${attr("role", clickable ? "button" : void 0)}${attr("tabindex", clickable ? 0 : void 0)}><div class="step-indicator svelte-ugeeye">`);
  if (isCompleted) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<span class="step-icon completed svelte-ugeeye">✓</span>`);
  } else {
    $$payload.out.push("<!--[!-->");
    if (icon) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<span class="step-icon custom svelte-ugeeye">${escape_html(icon)}</span>`);
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<span class="step-number svelte-ugeeye">${escape_html(step)}</span>`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div> <div class="step-content svelte-ugeeye"><h3 class="step-title svelte-ugeeye">${escape_html(title)}</h3> `);
  if (description) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<p class="step-description svelte-ugeeye">${escape_html(description)}</p>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div></div>`);
  bind_props($$props, { step, currentStep, title, description, icon, clickable });
  pop();
}
function ImportSteps($$payload, $$props) {
  push();
  let currentStep = fallback($$props["currentStep"], 1);
  let allowStepNavigation = fallback($$props["allowStepNavigation"], false);
  const dispatch = createEventDispatcher();
  const steps = [
    {
      step: 1,
      title: "Subir archivo",
      description: "Selecciona y sube tu archivo CSV",
      icon: "📁"
    },
    {
      step: 2,
      title: "Previsualizar",
      description: "Revisa y selecciona las transacciones",
      icon: "👀"
    },
    {
      step: 3,
      title: "Completar",
      description: "Importa las transacciones seleccionadas",
      icon: "✅"
    }
  ];
  function handleStepClick({ detail }) {
    if (allowStepNavigation) {
      dispatch("stepChange", { step: detail.step });
    }
  }
  if (typeof document !== "undefined") {
    document.addEventListener("stepClick", handleStepClick);
  }
  const each_array = ensure_array_like(steps);
  $$payload.out.push(`<div class="import-steps svelte-islpwy"><div class="steps-container svelte-islpwy"><!--[-->`);
  for (let index = 0, $$length = each_array.length; index < $$length; index++) {
    let stepInfo = each_array[index];
    if (index > 0) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div${attr_class("step-connector svelte-islpwy", void 0, { "completed": stepInfo.step <= currentStep })}></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> `);
    ProgressStep($$payload, {
      step: stepInfo.step,
      currentStep,
      title: stepInfo.title,
      description: stepInfo.description,
      icon: stepInfo.icon,
      clickable: allowStepNavigation
    });
    $$payload.out.push(`<!---->`);
  }
  $$payload.out.push(`<!--]--></div> <div class="progress-bar svelte-islpwy"><div class="progress-fill svelte-islpwy"${attr_style(`width: ${stringify((currentStep - 1) / (steps.length - 1) * 100)}%`)}></div></div></div>`);
  bind_props($$props, { currentStep, allowStepNavigation });
  pop();
}
function ImportStats($$payload, $$props) {
  push();
  let selectionPercentage, duplicatePercentage;
  let stats2 = $$props["stats"];
  let loading = fallback($$props["loading"], false);
  let showErrors = fallback($$props["showErrors"], false);
  selectionPercentage = stats2.total > 0 ? Math.round(stats2.selected / stats2.total * 100) : 0;
  duplicatePercentage = stats2.total > 0 ? Math.round(stats2.duplicates / stats2.total * 100) : 0;
  $$payload.out.push(`<div class="import-stats svelte-16uke7m"><div class="stats-grid svelte-16uke7m">`);
  StatCard($$payload, {
    label: "Total",
    value: stats2.total,
    currency: "",
    loading,
    children: ($$payload2) => {
      $$payload2.out.push(`<span class="stats-suffix svelte-16uke7m">transacciones</span>`);
    },
    $$slots: { default: true }
  });
  $$payload.out.push(`<!----> `);
  StatCard($$payload, {
    label: "Seleccionadas",
    value: stats2.selected,
    currency: "",
    variant: "income",
    loading,
    children: ($$payload2) => {
      $$payload2.out.push(`<div class="stats-details svelte-16uke7m"><span class="stats-suffix svelte-16uke7m">para importar</span> <span class="stats-percentage svelte-16uke7m">(${escape_html(selectionPercentage)}%)</span></div>`);
    },
    $$slots: { default: true }
  });
  $$payload.out.push(`<!----> `);
  StatCard($$payload, {
    label: "Duplicadas",
    value: stats2.duplicates,
    currency: "",
    variant: "expense",
    loading,
    children: ($$payload2) => {
      $$payload2.out.push(`<div class="stats-details svelte-16uke7m"><span class="stats-suffix svelte-16uke7m">ya existen</span> <span class="stats-percentage svelte-16uke7m">(${escape_html(duplicatePercentage)}%)</span></div>`);
    },
    $$slots: { default: true }
  });
  $$payload.out.push(`<!----> `);
  StatCard($$payload, {
    label: "Nuevas",
    value: stats2.new,
    currency: "",
    variant: "balance",
    loading,
    children: ($$payload2) => {
      $$payload2.out.push(`<span class="stats-suffix svelte-16uke7m">transacciones</span>`);
    },
    $$slots: { default: true }
  });
  $$payload.out.push(`<!----> `);
  if (showErrors && stats2.errors !== void 0) {
    $$payload.out.push("<!--[-->");
    StatCard($$payload, {
      label: "Errores",
      value: stats2.errors,
      currency: "",
      variant: "expense",
      loading,
      children: ($$payload2) => {
        $$payload2.out.push(`<span class="stats-suffix svelte-16uke7m">con problemas</span>`);
      },
      $$slots: { default: true }
    });
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  if (stats2.total > 0 && !loading) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="stats-summary svelte-16uke7m"><div class="summary-bar svelte-16uke7m"><div class="bar-segment selected svelte-16uke7m"${attr_style(`width: ${stringify(stats2.selected / stats2.total * 100)}%`)}${attr("title", `Seleccionadas: ${stringify(stats2.selected)}`)}></div> <div class="bar-segment duplicates svelte-16uke7m"${attr_style(`width: ${stringify(stats2.duplicates / stats2.total * 100)}%`)}${attr("title", `Duplicadas: ${stringify(stats2.duplicates)}`)}></div> <div class="bar-segment remaining svelte-16uke7m"${attr_style(`width: ${stringify((stats2.total - stats2.selected - stats2.duplicates) / stats2.total * 100)}%`)}${attr("title", `Sin seleccionar: ${stringify(stats2.total - stats2.selected - stats2.duplicates)}`)}></div></div> <div class="summary-legend svelte-16uke7m"><div class="legend-item svelte-16uke7m"><div class="legend-color selected svelte-16uke7m"></div> <span class="legend-label svelte-16uke7m">Seleccionadas (${escape_html(stats2.selected)})</span></div> <div class="legend-item svelte-16uke7m"><div class="legend-color duplicates svelte-16uke7m"></div> <span class="legend-label svelte-16uke7m">Duplicadas (${escape_html(stats2.duplicates)})</span></div> <div class="legend-item svelte-16uke7m"><div class="legend-color remaining svelte-16uke7m"></div> <span class="legend-label svelte-16uke7m">Sin seleccionar (${escape_html(stats2.total - stats2.selected - stats2.duplicates)})</span></div></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  bind_props($$props, { stats: stats2, loading, showErrors });
  pop();
}
function ImportTransactionTable($$payload, $$props) {
  push();
  let filters, filteredTransactions, visibleTransactions, hasMoreTransactions, selectedCount, allVisible, someVisible, tableClass;
  let transactions = fallback($$props["transactions"], () => [], true);
  let searchQuery = fallback($$props["searchQuery"], "");
  let viewMode = fallback($$props["viewMode"], "all");
  let showAllTransactions = fallback($$props["showAllTransactions"], false);
  let pageSize = fallback($$props["pageSize"], 50);
  let loading = fallback($$props["loading"], false);
  filters = [
    {
      id: "all",
      label: "Todas",
      active: viewMode === "all",
      count: transactions.length,
      variant: "default"
    },
    {
      id: "new",
      label: "Nuevas",
      active: viewMode === "new",
      count: transactions.filter((t2) => !t2.isDuplicate).length,
      variant: "income"
    },
    {
      id: "duplicates",
      label: "Duplicadas",
      active: viewMode === "duplicates",
      count: transactions.filter((t2) => t2.isDuplicate).length,
      variant: "expense"
    }
  ];
  filteredTransactions = (() => {
    let result = transactions;
    if (viewMode === "new") {
      result = result.filter((t2) => !t2.isDuplicate);
    } else if (viewMode === "duplicates") {
      result = result.filter((t2) => t2.isDuplicate);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((t2) => t2.merchant.toLowerCase().includes(query) || t2.description?.toLowerCase().includes(query) || t2.amount.toString().includes(query) || t2.date.includes(query));
    }
    return result;
  })();
  visibleTransactions = showAllTransactions ? filteredTransactions : filteredTransactions.slice(0, pageSize);
  hasMoreTransactions = filteredTransactions.length > pageSize;
  selectedCount = transactions.filter((t2) => t2.selected).length;
  allVisible = visibleTransactions.length > 0 && visibleTransactions.every((t2) => t2.selected);
  someVisible = visibleTransactions.some((t2) => t2.selected);
  tableClass = ["import-transaction-table", loading && "loading"].filter(Boolean).join(" ");
  $$payload.out.push(`<div${attr_class(clsx(tableClass), "svelte-81ajht")}><div class="table-header svelte-81ajht"><div class="header-controls svelte-81ajht">`);
  SearchInput($$payload, {
    value: searchQuery,
    placeholder: "Buscar transacciones...",
    loading
  });
  $$payload.out.push(`<!----> `);
  FilterGroup($$payload, { filters, allowClear: false, allowMultiple: false });
  $$payload.out.push(`<!----></div> `);
  if (transactions.length > 0) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="bulk-actions svelte-81ajht"><span class="selection-count svelte-81ajht">${escape_html(selectedCount)} de ${escape_html(transactions.length)} seleccionadas</span> <div class="action-buttons svelte-81ajht">`);
    ActionButton($$payload, {
      variant: "outline",
      size: "sm",
      children: ($$payload2) => {
        $$payload2.out.push(`<!---->${escape_html(allVisible ? "Deseleccionar" : "Seleccionar")} visibles`);
      },
      $$slots: { default: true }
    });
    $$payload.out.push(`<!----> `);
    ActionButton($$payload, {
      variant: "outline",
      size: "sm",
      children: ($$payload2) => {
        $$payload2.out.push(`<!---->Seleccionar nuevas`);
      },
      $$slots: { default: true }
    });
    $$payload.out.push(`<!----> `);
    ActionButton($$payload, {
      variant: "outline",
      size: "sm",
      children: ($$payload2) => {
        $$payload2.out.push(`<!---->Deseleccionar todas`);
      },
      $$slots: { default: true }
    });
    $$payload.out.push(`<!----></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> `);
  if (visibleTransactions.length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(visibleTransactions);
    $$payload.out.push(`<div class="table-container svelte-81ajht"><table class="transactions-table svelte-81ajht"><thead><tr><th class="checkbox-col svelte-81ajht">`);
    TransactionCheckbox($$payload, {
      checked: allVisible,
      indeterminate: someVisible && !allVisible
    });
    $$payload.out.push(`<!----></th><th class="date-col svelte-81ajht">Fecha</th><th class="merchant-col svelte-81ajht">Comercio</th><th class="description-col svelte-81ajht">Descripción</th><th class="amount-col svelte-81ajht">Importe</th><th class="status-col svelte-81ajht">Estado</th></tr></thead><tbody><!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let transaction = each_array[$$index];
      $$payload.out.push(`<tr${attr_class("transaction-row svelte-81ajht", void 0, {
        "selected": transaction.selected,
        "duplicate": transaction.isDuplicate,
        "error": transaction.hasError
      })}><td class="checkbox-col svelte-81ajht">`);
      TransactionCheckbox($$payload, {
        checked: transaction.selected,
        disabled: transaction.isDuplicate
      });
      $$payload.out.push(`<!----></td><td class="date-col svelte-81ajht">`);
      DateDisplay($$payload, { date: transaction.date, format: "short" });
      $$payload.out.push(`<!----></td><td class="merchant-col svelte-81ajht"><span class="merchant-name svelte-81ajht">${escape_html(transaction.merchant)}</span></td><td class="description-col svelte-81ajht"><span class="description-text svelte-81ajht">${escape_html(transaction.description || "-")}</span></td><td class="amount-col svelte-81ajht">`);
      AmountDisplay($$payload, {
        amount: transaction.amount,
        currency: transaction.currency,
        size: "sm"
      });
      $$payload.out.push(`<!----></td><td class="status-col svelte-81ajht">`);
      if (transaction.hasError) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<span class="status-badge error svelte-81ajht"${attr("title", transaction.errorMessage)}>❌ Error</span>`);
      } else {
        $$payload.out.push("<!--[!-->");
        if (transaction.isDuplicate) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<span class="status-badge duplicate svelte-81ajht">⚠️ Duplicada</span>`);
        } else {
          $$payload.out.push("<!--[!-->");
          $$payload.out.push(`<span class="status-badge new svelte-81ajht">✨ Nueva</span>`);
        }
        $$payload.out.push(`<!--]-->`);
      }
      $$payload.out.push(`<!--]--></td></tr>`);
    }
    $$payload.out.push(`<!--]--></tbody></table></div> `);
    if (hasMoreTransactions && !showAllTransactions) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="show-more svelte-81ajht">`);
      ActionButton($$payload, {
        variant: "outline",
        children: ($$payload2) => {
          $$payload2.out.push(`<!---->Mostrar todas las transacciones (${escape_html(filteredTransactions.length - pageSize)} más)`);
        },
        $$slots: { default: true }
      });
      $$payload.out.push(`<!----></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]-->`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="empty-state svelte-81ajht"><div class="empty-icon svelte-81ajht">🔍</div> <h3 class="empty-title svelte-81ajht">No se encontraron transacciones</h3> <p class="empty-message svelte-81ajht">`);
    if (searchQuery) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`No hay transacciones que coincidan con "${escape_html(searchQuery)}"`);
    } else {
      $$payload.out.push("<!--[!-->");
      if (viewMode === "duplicates") {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`No hay transacciones duplicadas`);
      } else {
        $$payload.out.push("<!--[!-->");
        if (viewMode === "new") {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`No hay transacciones nuevas`);
        } else {
          $$payload.out.push("<!--[!-->");
          $$payload.out.push(`No hay transacciones para mostrar`);
        }
        $$payload.out.push(`<!--]-->`);
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]--></p></div>`);
  }
  $$payload.out.push(`<!--]--></div>`);
  bind_props($$props, {
    transactions,
    searchQuery,
    viewMode,
    showAllTransactions,
    pageSize,
    loading
  });
  pop();
}
function FileUploadZone($$payload, $$props) {
  push();
  let uploadZoneClass;
  let acceptedTypes = fallback($$props["acceptedTypes"], ".csv");
  let maxSize = fallback($$props["maxSize"], 10 * 1024 * 1024);
  let disabled = fallback($$props["disabled"], false);
  let multiple = fallback($$props["multiple"], false);
  let dragActive = fallback($$props["dragActive"], false);
  let isDragOver = false;
  uploadZoneClass = [
    "file-upload-zone",
    disabled && "disabled",
    isDragOver
  ].filter(Boolean).join(" ");
  $$payload.out.push(`<input type="file"${attr("accept", acceptedTypes)}${attr("multiple", multiple, true)}${attr("disabled", disabled, true)} style="display: none;" class="svelte-1exfyoi"/> <div${attr_class(clsx(uploadZoneClass), "svelte-1exfyoi")} role="button"${attr("tabindex", disabled ? -1 : 0)} aria-label="Zona de carga de archivos"><div class="upload-content svelte-1exfyoi"><div class="upload-icon svelte-1exfyoi">`);
  {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`📁`);
  }
  $$payload.out.push(`<!--]--></div> <div class="upload-text svelte-1exfyoi">`);
  {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<p class="primary-text svelte-1exfyoi"><!---->`);
    slot($$payload, $$props, "title", {}, () => {
      $$payload.out.push(`Arrastra un archivo aquí o haz clic para seleccionar`);
    });
    $$payload.out.push(`<!----></p> <p class="secondary-text svelte-1exfyoi"><!---->`);
    slot($$payload, $$props, "subtitle", {}, () => {
      $$payload.out.push(`Formatos aceptados: ${escape_html(acceptedTypes)} • Máximo ${escape_html(Math.round(maxSize / (1024 * 1024)))}MB`);
    });
    $$payload.out.push(`<!----></p>`);
  }
  $$payload.out.push(`<!--]--></div> <!---->`);
  slot($$payload, $$props, "extra", {}, null);
  $$payload.out.push(`<!----></div></div>`);
  bind_props($$props, { acceptedTypes, maxSize, disabled, multiple, dragActive });
  pop();
}
function Toggle($$payload, $$props) {
  push();
  let checked = fallback($$props["checked"], false);
  let disabled = fallback($$props["disabled"], false);
  let label = fallback($$props["label"], "");
  let size = fallback($$props["size"], "md");
  const sizeClasses = {
    sm: {
      toggle: "w-8 h-5",
      thumb: "w-4 h-4",
      translate: checked ? "translate-x-3" : "translate-x-0"
    },
    md: {
      toggle: "w-11 h-6",
      thumb: "w-5 h-5",
      translate: checked ? "translate-x-5" : "translate-x-0"
    }
  };
  $$payload.out.push(`<div class="flex items-center space-x-3"><button type="button" role="switch"${attr("aria-checked", checked)}${attr("aria-label", label)}${attr_class(`relative inline-flex rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-acapulco/30 focus:ring-offset-2 ${stringify(sizeClasses[size].toggle)} ${stringify(checked ? "bg-acapulco" : "bg-evening-sea/20")} ${stringify(disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer")} `)}${attr("disabled", disabled, true)}><span${attr_class(`inline-block rounded-full bg-bridesmaid shadow-lg transform transition-all duration-300 ease-in-out ${stringify(sizeClasses[size].thumb)} ${stringify(sizeClasses[size].translate)} ${stringify(checked ? "shadow-acapulco/20" : "shadow-evening-sea/10")} `)}>`);
  if (checked) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="flex items-center justify-center h-full text-acapulco"><svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></span></button> `);
  if (label) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<label${attr_class(`text-sm font-medium text-evening-sea cursor-pointer ${stringify(disabled ? "opacity-50" : "")}`)}>${escape_html(label)}</label>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  bind_props($$props, { checked, disabled, label, size });
  pop();
}
function ImportPageTemplate($$payload, $$props) {
  push();
  let templateClass;
  let currentStep = fallback($$props["currentStep"], 1);
  let selectedFile = fallback($$props["selectedFile"], null);
  let transactions = fallback($$props["transactions"], () => [], true);
  let stats2 = $$props["stats"];
  let searchQuery = fallback($$props["searchQuery"], "");
  let viewMode = fallback($$props["viewMode"], "all");
  let showAllTransactions = fallback($$props["showAllTransactions"], false);
  let previewEnabled = fallback($$props["previewEnabled"], true);
  let loading = fallback($$props["loading"], false);
  let importing = fallback($$props["importing"], false);
  let importResult = fallback($$props["importResult"], null);
  let error = fallback($$props["error"], "");
  templateClass = [
    "import-page-template",
    loading && "loading",
    importing && "importing"
  ].filter(Boolean).join(" ");
  $$payload.out.push(`<div${attr_class(clsx(templateClass), "svelte-1s86sg8")}><header class="page-header svelte-1s86sg8"><h1 class="page-title svelte-1s86sg8">Importar transacciones</h1> <p class="page-subtitle svelte-1s86sg8">Sube un archivo CSV para importar tus transacciones de forma masiva</p></header> `);
  ImportSteps($$payload, { currentStep, allowStepNavigation: currentStep > 1 });
  $$payload.out.push(`<!----> `);
  if (error) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="error-alert svelte-1s86sg8"><span class="error-icon svelte-1s86sg8">❌</span> <span class="error-message svelte-1s86sg8">${escape_html(error)}</span> <button class="error-close svelte-1s86sg8" aria-label="Cerrar error">×</button></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <main class="step-content svelte-1s86sg8">`);
  if (currentStep === 1) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="upload-step svelte-1s86sg8"><div class="upload-settings svelte-1s86sg8"><label class="setting-item svelte-1s86sg8"><span class="setting-label svelte-1s86sg8">Previsualizar antes de importar</span> `);
    Toggle($$payload, { checked: previewEnabled });
    $$payload.out.push(`<!----></label> <p class="setting-help svelte-1s86sg8">Si está desactivado, las transacciones se importarán directamente sin previsualización</p></div> `);
    if (selectedFile) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="file-info svelte-1s86sg8"><div class="file-details svelte-1s86sg8"><span class="file-icon svelte-1s86sg8">📄</span> <div class="file-text svelte-1s86sg8"><span class="file-name svelte-1s86sg8">${escape_html(selectedFile.name)}</span> <span class="file-size svelte-1s86sg8">${escape_html((selectedFile.size / 1024 / 1024).toFixed(2))} MB</span></div></div> `);
      ActionButton($$payload, {
        variant: "ghost",
        icon: "×",
        "aria-label": "Eliminar archivo"
      });
      $$payload.out.push(`<!----></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
      FileUploadZone($$payload, {
        acceptedTypes: ".csv",
        maxSize: 10 * 1024 * 1024,
        loading,
        $$slots: {
          title: ($$payload2) => {
            $$payload2.out.push(`<span slot="title">Arrastra tu archivo CSV aquí o haz clic para seleccionar</span>`);
          },
          subtitle: ($$payload2) => {
            $$payload2.out.push(`<span slot="subtitle">Archivos CSV • Máximo 10MB</span>`);
          }
        }
      });
    }
    $$payload.out.push(`<!--]--></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    if (currentStep === 2) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="preview-step svelte-1s86sg8">`);
      ImportStats($$payload, { stats: stats2, loading });
      $$payload.out.push(`<!----> `);
      ImportTransactionTable($$payload, {
        transactions,
        searchQuery,
        viewMode,
        showAllTransactions,
        loading
      });
      $$payload.out.push(`<!----></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
      if (currentStep === 3) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="complete-step svelte-1s86sg8">`);
        if (importing) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<div class="importing-state svelte-1s86sg8"><div class="loading-spinner svelte-1s86sg8"></div> <h3 class="importing-title svelte-1s86sg8">Importando transacciones...</h3> <p class="importing-message svelte-1s86sg8">Procesando ${escape_html(stats2.selected)} transacciones. Por favor espera.</p></div>`);
        } else {
          $$payload.out.push("<!--[!-->");
          if (importResult) {
            $$payload.out.push("<!--[-->");
            $$payload.out.push(`<div class="import-success svelte-1s86sg8"><div class="success-icon svelte-1s86sg8">✅</div> <h3 class="success-title svelte-1s86sg8">¡Importación completada!</h3> <p class="success-message svelte-1s86sg8">${escape_html(importResult.message)}</p> <div class="result-stats svelte-1s86sg8"><div class="result-item svelte-1s86sg8"><span class="result-value svelte-1s86sg8">${escape_html(importResult.imported)}</span> <span class="result-label svelte-1s86sg8">importadas</span></div> `);
            if (importResult.duplicates > 0) {
              $$payload.out.push("<!--[-->");
              $$payload.out.push(`<div class="result-item svelte-1s86sg8"><span class="result-value svelte-1s86sg8">${escape_html(importResult.duplicates)}</span> <span class="result-label svelte-1s86sg8">duplicadas</span></div>`);
            } else {
              $$payload.out.push("<!--[!-->");
            }
            $$payload.out.push(`<!--]--> `);
            if (importResult.errors > 0) {
              $$payload.out.push("<!--[-->");
              $$payload.out.push(`<div class="result-item error svelte-1s86sg8"><span class="result-value svelte-1s86sg8">${escape_html(importResult.errors)}</span> <span class="result-label svelte-1s86sg8">errores</span></div>`);
            } else {
              $$payload.out.push("<!--[!-->");
            }
            $$payload.out.push(`<!--]--></div></div>`);
          } else {
            $$payload.out.push("<!--[!-->");
          }
          $$payload.out.push(`<!--]-->`);
        }
        $$payload.out.push(`<!--]--></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--> <!---->`);
  slot($$payload, $$props, "content", {}, null);
  $$payload.out.push(`<!----></main> <footer class="page-footer svelte-1s86sg8"><div class="footer-actions svelte-1s86sg8">`);
  if (currentStep > 1 && !importing) {
    $$payload.out.push("<!--[-->");
    ActionButton($$payload, {
      variant: "outline",
      children: ($$payload2) => {
        $$payload2.out.push(`<!---->Anterior`);
      },
      $$slots: { default: true }
    });
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (currentStep === 1 && selectedFile) {
    $$payload.out.push("<!--[-->");
    ActionButton($$payload, {
      variant: "primary",
      loading,
      children: ($$payload2) => {
        $$payload2.out.push(`<!---->${escape_html(previewEnabled ? "Previsualizar" : "Importar directamente")}`);
      },
      $$slots: { default: true }
    });
  } else {
    $$payload.out.push("<!--[!-->");
    if (currentStep === 2 && stats2.selected > 0) {
      $$payload.out.push("<!--[-->");
      ActionButton($$payload, {
        variant: "primary",
        children: ($$payload2) => {
          $$payload2.out.push(`<!---->Importar ${escape_html(stats2.selected)} transacciones`);
        },
        $$slots: { default: true }
      });
    } else {
      $$payload.out.push("<!--[!-->");
      if (currentStep === 3 && importResult && !importing) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="final-actions svelte-1s86sg8">`);
        ActionButton($$payload, {
          variant: "outline",
          children: ($$payload2) => {
            $$payload2.out.push(`<!---->Importar más archivos`);
          },
          $$slots: { default: true }
        });
        $$payload.out.push(`<!----> `);
        ActionButton($$payload, {
          variant: "primary",
          children: ($$payload2) => {
            $$payload2.out.push(`<!---->Ver transacciones`);
          },
          $$slots: { default: true }
        });
        $$payload.out.push(`<!----></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div> <!---->`);
  slot($$payload, $$props, "footer", {}, null);
  $$payload.out.push(`<!----></footer> <!---->`);
  slot($$payload, $$props, "modals", {}, null);
  $$payload.out.push(`<!----></div>`);
  bind_props($$props, {
    currentStep,
    selectedFile,
    transactions,
    stats: stats2,
    searchQuery,
    viewMode,
    showAllTransactions,
    previewEnabled,
    loading,
    importing,
    importResult,
    error
  });
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let currentStep = 1;
  let selectedFile = null;
  let transactions = [];
  let loading = false;
  let importing = false;
  let error = "";
  let previewEnabled = true;
  let showAllTransactions = false;
  let searchQuery = "";
  let viewMode = "all";
  let importResult = null;
  ImportStatistics = {
    total: transactions.length,
    selected: transactions.filter((tx) => tx.selected).length,
    duplicates: transactions.filter((tx) => tx.isDuplicate).length,
    new: transactions.filter((tx) => !tx.isDuplicate).length,
    errors: transactions.filter((tx) => tx.hasError).length
  };
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(store_get($$store_subs ??= {}, "$t", t)("import.title"))} - Happy Balance</title>`;
  });
  ImportPageTemplate($$payload, {
    currentStep,
    selectedFile,
    transactions,
    stats,
    searchQuery,
    viewMode,
    showAllTransactions,
    previewEnabled,
    loading,
    importing,
    importResult,
    error
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CAV_Cy_m.js.map
