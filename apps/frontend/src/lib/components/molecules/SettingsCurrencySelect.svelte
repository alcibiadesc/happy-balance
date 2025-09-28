<script lang="ts">
  interface CurrencyOption {
    value: string;
    label: string;
    symbol: string;
  }

  interface Props {
    value: string;
    options: CurrencyOption[];
    onChange: (event: Event) => void;
  }

  let {
    value,
    options,
    onChange
  }: Props = $props();
</script>

<select 
  class="currency-select"
  {value}
  onchange={onChange}
>
  {#each options as currency}
    <option value={currency.value}>{currency.label}</option>
  {/each}
</select>

<style>
  /* Currency Select - Exact copy from settings page */
  .currency-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.875rem;
    min-width: 140px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .currency-select:hover,
  .currency-select:focus {
    border-color: var(--acapulco);
    outline: none;
    box-shadow: 0 0 0 3px rgba(122, 186, 165, 0.1);
  }

  @media (max-width: 768px) {
    .currency-select {
      min-width: unset;
      width: 100%;
    }
  }
</style>