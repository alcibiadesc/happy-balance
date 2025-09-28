<script lang="ts">
  interface Props {
    isDark: boolean;
    onToggle: () => void;
  }

  let {
    isDark,
    onToggle
  }: Props = $props();
</script>

<!-- DaisyUI Toggle with custom styling -->
<div class="theme-toggle-container">
  <div class="theme-option {!isDark ? 'active' : ''}">
    ☀️
  </div>
  <input
    type="checkbox"
    checked={isDark}
    onchange={onToggle}
    class="toggle toggle-primary toggle-lg"
  />
  <div class="theme-option {isDark ? 'active' : ''}">
    🌙
  </div>
</div>

<style>
  /* Theme Toggle - Exact copy from settings page */
  .theme-toggle-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    transition: all 0.2s ease;
  }

  .theme-option {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 1.25rem;
    transition: all 0.2s ease;
    user-select: none;
  }

  .theme-option.active {
    color: var(--acapulco);
    transform: scale(1.1);
  }

  /* Custom DaisyUI toggle styling */
  :global(.toggle:checked) {
    background-color: var(--acapulco);
    border-color: var(--acapulco);
  }

  :global(.toggle:checked:hover) {
    background-color: rgba(122, 186, 165, 0.9);
    border-color: rgba(122, 186, 165, 0.9);
  }

  :global(.toggle:focus) {
    box-shadow: 0 0 0 2px var(--acapulco), 0 0 0 4px rgba(122, 186, 165, 0.2);
  }
</style>