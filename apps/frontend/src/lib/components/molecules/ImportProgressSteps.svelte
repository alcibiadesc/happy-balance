<script lang="ts">
  import { t } from '$lib/stores/i18n';

  interface Props {
    currentStep: 1 | 2 | 3;
  }

  const { currentStep }: Props = $props();

  const steps = $derived([
    {
      number: 1,
      titleKey: 'import.steps.upload',
      descKey: 'import.steps.upload_desc',
    },
    {
      number: 2,
      titleKey: 'import.steps.preview',
      descKey: 'import.steps.preview_desc',
    },
    {
      number: 3,
      titleKey: 'import.steps.complete',
      descKey: 'import.steps.complete_desc',
    },
  ]);
</script>

<div class="progress-steps">
  <div class="progress-container">
    {#each steps as step, index (step.number)}
      <div class="step-item">
        <div class="step-circle" class:active={currentStep >= step.number}>
          {#if currentStep > step.number}
            <svg class="step-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          {:else}
            {step.number}
          {/if}
        </div>
        <div class="step-text">
          <div class="step-title" class:active={currentStep >= step.number}>
            {$t(step.titleKey)}
          </div>
          <div class="step-desc">{$t(step.descKey)}</div>
        </div>
      </div>

      {#if index < steps.length - 1}
        <div class="step-line" class:active={currentStep > step.number}></div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .progress-steps {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .progress-container {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    max-width: 40rem;
    margin: 0 auto;
    gap: 2rem;
    padding: 0 1rem;
  }

  .step-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    flex-direction: column;
    align-items: center;
    min-width: 0;
  }

  .step-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: 500;
    background: var(--surface-muted);
    color: var(--text-muted);
    border: 2px solid var(--border-color);
    transition: all 0.3s ease;
    flex-shrink: 0;
  }

  .step-circle.active {
    background: var(--acapulco);
    color: var(--text-inverse);
    border-color: var(--acapulco);
    box-shadow: 0 4px 12px rgba(122, 186, 165, 0.3);
  }

  .step-check {
    width: 1.25rem;
    height: 1.25rem;
  }

  .step-text {
    text-align: center;
    min-width: 0;
    flex: 1;
    max-width: 120px;
  }

  .step-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-muted);
    transition: color 0.3s ease;
    word-wrap: break-word;
    hyphens: auto;
    line-height: 1.2;
  }

  .step-title.active {
    color: var(--text-primary);
  }

  .step-desc {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
    word-wrap: break-word;
    hyphens: auto;
    line-height: 1.3;
  }

  .step-line {
    flex: 1;
    height: 2px;
    background: var(--border-color);
    transition: background-color 0.3s ease;
    margin-top: 20px;
    min-width: 2rem;
  }

  .step-line.active {
    background: var(--acapulco);
  }

  @media (max-width: 768px) {
    .progress-container {
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: space-around;
    }

    .step-item {
      flex-direction: column;
      text-align: center;
      min-width: 80px;
      max-width: 100px;
    }

    .step-text {
      max-width: 100px;
    }

    .step-circle {
      width: 32px;
      height: 32px;
      font-size: 0.75rem;
    }

    .step-line {
      margin-top: 16px;
      min-width: 1.5rem;
    }
  }

  @media (max-width: 480px) {
    .progress-container {
      max-width: 100%;
      gap: 0.5rem;
    }

    .step-item {
      min-width: 60px;
      max-width: 80px;
    }

    .step-text {
      max-width: 80px;
    }

    .step-title {
      font-size: 0.75rem;
    }

    .step-desc {
      font-size: 0.625rem;
    }

    .step-line {
      max-width: 1.5rem;
      min-width: 1rem;
      margin-top: 14px;
    }
  }
</style>
