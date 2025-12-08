<script lang="ts">
  interface Props {
    value: number;
    label: string;
    resultLabel: string;
    resultAmount: number;
    formatCurrency: (amount: number) => string;
  }

  let { value = $bindable(), label, resultLabel, resultAmount, formatCurrency }: Props = $props();
</script>

<div class="slider-section">
  <label class="slider-label">{label}</label>
  <div class="slider-container">
    <input type="range" min="0" max="100" bind:value class="slider" step="5" />
    <div class="slider-labels">
      <span>0%</span>
      <span class="current-value">{value}%</span>
      <span>100%</span>
    </div>
  </div>
  <div class="result-display">
    {resultLabel}: <strong>{formatCurrency(resultAmount)}</strong>
  </div>
</div>

<style>
  .slider-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .slider-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .slider-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .slider {
    width: 100%;
    height: 0.5rem;
    border-radius: 0.25rem;
    background: var(--surface-muted);
    outline: none;
    -webkit-appearance: none;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    background: var(--primary);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
  }

  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .slider::-moz-range-thumb {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    background: var(--primary);
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
  }

  .slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .current-value {
    font-weight: 600;
    color: var(--primary);
  }

  .result-display {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .result-display strong {
    color: var(--text-primary);
    font-weight: 600;
  }
</style>
