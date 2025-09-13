<script lang="ts">
  import { Upload } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';

  interface Props {
    href?: string;
    onclick?: () => void;
    size?: 'sm' | 'md';
  }

  let { href = '/import', onclick, size = 'md' }: Props = $props();

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm'
  };

  const iconSizes = {
    sm: 14,
    md: 16
  };
</script>

<a
  {href}
  class="import-button {sizeClasses[size]}"
  {onclick}
  aria-label="Import financial data"
>
  <div class="import-button__icon">
    <Upload size={iconSizes[size]} strokeWidth={2} />
  </div>
  <span class="import-button__text">{$t('buttons.import')}</span>
</a>

<style>
  .import-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s ease;
    width: 100%;
    text-align: center;
    
    /* Minimalista - sin degradados */
    background: var(--primary);
    color: white;
    border: 1px solid var(--primary);
  }

  .import-button:hover {
    background: var(--primary-dark, #034a57);
    border-color: var(--primary-dark, #034a57);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(2, 60, 70, 0.2);
  }

  .import-button:active {
    transform: translateY(0);
    box-shadow: 0 1px 4px rgba(2, 60, 70, 0.15);
  }

  .import-button__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
  }

  .import-button:hover .import-button__icon {
    transform: scale(1.05);
  }

  .import-button__text {
    font-weight: 500;
    letter-spacing: 0.025em;
  }

  /* Focus state */
  .import-button:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--primary);
  }

  /* Dark mode adjustments */
  html.dark .import-button {
    background: var(--acapulco);
    color: var(--gray-900);
    border-color: var(--acapulco);
  }

  html.dark .import-button:hover {
    background: #85c7b8;
    border-color: #85c7b8;
    box-shadow: 0 2px 8px rgba(122, 186, 165, 0.25);
  }

  html.dark .import-button:focus {
    box-shadow: 0 0 0 2px var(--gray-800), 0 0 0 4px var(--acapulco);
  }
</style>
