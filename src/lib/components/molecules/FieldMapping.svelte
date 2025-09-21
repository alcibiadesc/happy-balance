<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Badge from '../atoms/Badge.svelte';
  import { t } from '$lib/stores/i18n';

  export let headers: string[] = [];
  export let detectedMapping: Record<string, number> = {};
  export let showMapping = false;

  const dispatch = createEventDispatcher<{
    'update-mapping': { mapping: Record<string, number> };
    'toggle-visibility': { show: boolean };
  }>();

  // Available field types for mapping
  $: fieldTypes = [
    { key: 'bookingDate', label: $t('import.field_types.booking_date'), required: true },
    { key: 'valueDate', label: $t('import.field_types.value_date'), required: false },
    { key: 'partnerName', label: $t('import.field_types.partner_name'), required: true },
    { key: 'partnerIban', label: $t('import.field_types.partner_iban'), required: false },
    { key: 'type', label: $t('import.field_types.transaction_type'), required: false },
    { key: 'paymentReference', label: $t('import.field_types.description'), required: true },
    { key: 'accountName', label: $t('import.field_types.account_name'), required: false },
    { key: 'amountEur', label: $t('import.field_types.amount_eur'), required: true },
    { key: 'originalAmount', label: $t('import.field_types.original_amount'), required: false },
    { key: 'originalCurrency', label: $t('import.field_types.original_currency'), required: false },
    { key: 'exchangeRate', label: $t('import.field_types.exchange_rate'), required: false }
  ];

  let currentMapping = { ...detectedMapping };

  function updateFieldMapping(field: string, headerIndex: number) {
    if (headerIndex === -1) {
      delete currentMapping[field];
    } else {
      currentMapping[field] = headerIndex;
    }
    
    dispatch('update-mapping', { mapping: currentMapping });
  }

  function toggleMappingVisibility() {
    showMapping = !showMapping;
    dispatch('toggle-visibility', { show: showMapping });
  }

  // Get confidence score for the automatic detection
  function getConfidenceScore(): number {
    const requiredFields = fieldTypes.filter(f => f.required);
    const mappedRequired = requiredFields.filter(f => currentMapping[f.key] !== undefined).length;
    return Math.round((mappedRequired / requiredFields.length) * 100);
  }

  function getMappingStatus(): 'success' | 'warning' | 'danger' {
    const confidence = getConfidenceScore();
    if (confidence === 100) return 'success';
    if (confidence >= 75) return 'warning';
    return 'danger';
  }

  $: confidence = getConfidenceScore();
  $: mappingStatus = getMappingStatus();
</script>

<div class="field-mapping">
  <!-- Header with toggle -->
  <div class="mapping-header">
    <div class="mapping-info">
      <h3 class="text-sm font-medium text-evening-sea">{$t('components.field_mapping.title')}</h3>
      <div class="flex items-center space-x-2">
        <Badge variant={mappingStatus} size="sm">
          {confidence}% {$t('components.field_mapping.confidence')}
        </Badge>
        <span class="text-xs text-evening-sea opacity-60">
          {$t('components.field_mapping.auto_detected')}
        </span>
      </div>
    </div>
    
    <button
      type="button"
      class="toggle-button"
      on:click={toggleMappingVisibility}
      aria-label={showMapping ? $t('components.field_mapping.hide') : $t('components.field_mapping.show')}
    >
      <svg 
        class="w-4 h-4 transition-transform duration-200 {showMapping ? 'rotate-180' : ''}" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  </div>

  <!-- Expandable mapping interface -->
  {#if showMapping}
    <div class="mapping-content">
      <div class="mapping-description">
        <p class="text-sm text-evening-sea opacity-70">
          {$t('components.field_mapping.description')}
          {$t('components.field_mapping.required_note')}
        </p>
      </div>

      <div class="mapping-grid">
        {#each fieldTypes as field}
          <div class="mapping-row">
            <div class="field-info">
              <label class="field-label" for="mapping-{field.key}">
                {field.label}
                {#if field.required}
                  <span class="required-marker">*</span>
                {/if}
              </label>
              {#if field.required && !currentMapping[field.key]}
                <span class="error-text">{$t('components.field_mapping.required_not_mapped')}</span>
              {/if}
            </div>
            
            <div class="field-select">
              <select
                id="mapping-{field.key}"
                class="select-input"
                value={currentMapping[field.key] ?? -1}
                on:change={(e) => updateFieldMapping(field.key, parseInt(e.currentTarget.value))}
              >
                <option value={-1}>{$t('components.field_mapping.not_mapped')}</option>
                {#each headers as header, index}
                  <option value={index}>
                    Column {index + 1}: {header}
                  </option>
                {/each}
              </select>
            </div>
          </div>
        {/each}
      </div>

      <!-- Mapping summary -->
      <div class="mapping-summary">
        <div class="summary-stats">
          <div class="stat">
            <span class="stat-value text-acapulco">{Object.keys(currentMapping).length}</span>
            <span class="stat-label">{$t('components.field_mapping.mapped_stat')}</span>
          </div>
          <div class="stat">
            <span class="stat-value text-sunglow">{fieldTypes.filter(f => f.required && !currentMapping[f.key]).length}</span>
            <span class="stat-label">{$t('components.field_mapping.missing_required_stat')}</span>
          </div>
          <div class="stat">
            <span class="stat-value text-evening-sea">{headers.length}</span>
            <span class="stat-label">{$t('components.field_mapping.total_columns_stat')}</span>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .field-mapping {
    background: var(--bridesmaid);
    border: 1px solid rgba(2, 60, 70, 0.08);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .mapping-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    background: rgba(2, 60, 70, 0.02);
    border-bottom: 1px solid rgba(2, 60, 70, 0.05);
  }

  .mapping-info {
    flex: 1;
  }

  .mapping-info h3 {
    margin-bottom: 0.25rem;
  }

  .toggle-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius-md);
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .toggle-button:hover {
    background: rgba(2, 60, 70, 0.08);
    color: var(--text-primary);
  }

  .mapping-content {
    padding: 1.25rem;
    space-y: 1rem;
  }

  .mapping-description {
    margin-bottom: 1rem;
  }

  .mapping-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .mapping-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    align-items: start;
    padding: 0.75rem;
    background: rgba(2, 60, 70, 0.02);
    border-radius: var(--radius-md);
    border: 1px solid rgba(2, 60, 70, 0.05);
  }

  .field-info {
    display: flex;
    flex-direction: column;
  }

  .field-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }

  .required-marker {
    color: var(--froly);
    margin-left: 0.125rem;
  }

  .error-text {
    font-size: 0.75rem;
    color: var(--froly);
    margin-top: 0.25rem;
  }

  .select-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid rgba(2, 60, 70, 0.2);
    border-radius: var(--radius-md);
    background: var(--surface-elevated);
    color: var(--text-primary);
    font-size: 0.875rem;
    transition: all 0.15s ease;
  }

  .select-input:focus {
    outline: none;
    border-color: var(--acapulco);
    box-shadow: 0 0 0 3px rgba(122, 186, 165, 0.1);
  }

  .mapping-summary {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(2, 60, 70, 0.08);
  }

  .summary-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .mapping-row {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .summary-stats {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
  }
</style>
