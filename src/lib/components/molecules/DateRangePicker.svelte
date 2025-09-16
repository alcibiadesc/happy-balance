<script lang="ts">
  import { Calendar, X } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';
  import { t } from '$lib/stores/i18n';

  export let startDate: string = '';
  export let endDate: string = '';
  export let isOpen: boolean = false;

  const dispatch = createEventDispatcher();

  let tempStartDate = startDate;
  let tempEndDate = endDate;

  $: if (isOpen) {
    tempStartDate = startDate;
    tempEndDate = endDate;
  }

  function handleApply() {
    if (tempStartDate && tempEndDate) {
      if (new Date(tempStartDate) <= new Date(tempEndDate)) {
        dispatch('apply', { startDate: tempStartDate, endDate: tempEndDate });
        isOpen = false;
      }
    }
  }

  function handleCancel() {
    tempStartDate = startDate;
    tempEndDate = endDate;
    isOpen = false;
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" onclick={handleBackdropClick}>
    <div class="modal-content">
      <div class="modal-header">
        <h3>{$t('dashboard.dateRange.title')}</h3>
        <button class="close-button" onclick={handleCancel}>
          <X size={20} />
        </button>
      </div>

      <div class="modal-body">
        <div class="date-inputs">
          <div class="date-field">
            <label for="start-date">{$t('dashboard.dateRange.startDate')}</label>
            <div class="input-wrapper">
              <Calendar size={16} />
              <input
                id="start-date"
                type="date"
                bind:value={tempStartDate}
                max={tempEndDate || undefined}
                class="date-input"
              />
            </div>
          </div>

          <div class="date-field">
            <label for="end-date">{$t('dashboard.dateRange.endDate')}</label>
            <div class="input-wrapper">
              <Calendar size={16} />
              <input
                id="end-date"
                type="date"
                bind:value={tempEndDate}
                min={tempStartDate || undefined}
                class="date-input"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" onclick={handleCancel}>
          {$t('common.cancel')}
        </button>
        <button
          class="btn-primary"
          onclick={handleApply}
          disabled={!tempStartDate || !tempEndDate}
        >
          {$t('common.apply')}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }

  .modal-content {
    background: var(--surface-elevated);
    border-radius: 16px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.3s ease;
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .close-button {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .close-button:hover {
    background: var(--surface-muted);
    color: var(--text-primary);
  }

  .modal-body {
    padding: 1.5rem;
  }

  .date-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .date-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .date-field label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-wrapper svg {
    position: absolute;
    left: 0.75rem;
    color: var(--text-muted);
    pointer-events: none;
  }

  .date-input {
    width: 100%;
    padding: 0.625rem 0.75rem 0.625rem 2.5rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .date-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(2, 60, 70, 0.1);
  }

  .modal-footer {
    padding: 1.5rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .btn-secondary,
  .btn-primary {
    padding: 0.625rem 1.25rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  .btn-secondary {
    background: var(--surface-muted);
    color: var(--text-primary);
  }

  .btn-secondary:hover {
    background: var(--surface);
  }

  .btn-primary {
    background: var(--primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--primary-hover);
    transform: translateY(-1px);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 600px) {
    .modal-content {
      width: 95%;
    }

    .date-inputs {
      grid-template-columns: 1fr;
    }
  }
</style>