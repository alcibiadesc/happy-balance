<script lang="ts">
  import { LayoutDashboard, Settings, Receipt, Tag, TrendingUp, Upload } from 'lucide-svelte';

  interface Props {
    href: string;
    icon: string; // Icon name as string
    children: any; // For slot content
    isActive?: boolean;
    isImportant?: boolean;
    collapsed?: boolean;
    onclick?: () => void;
  }

  const {
    href,
    icon,
    children,
    isActive = false,
    isImportant = false,
    collapsed = false,
    onclick,
  }: Props = $props();

  // Icon mapping
  const iconMap = {
    'layout-dashboard': LayoutDashboard,
    receipt: Receipt,
    tag: Tag,
    'trending-up': TrendingUp,
    settings: Settings,
    upload: Upload,
  };

  const IconComponent = iconMap[icon as keyof typeof iconMap];
  const isImport = icon === 'upload';

  function handleClick() {
    if (onclick) {
      onclick();
    }
  }
</script>

<a
  {href}
  class="nav-item"
  class:nav-item--active={isActive}
  class:nav-item--important={isImportant}
  class:nav-item--import={isImport}
  class:nav-item--collapsed={collapsed}
  onclick={handleClick}
  aria-current={isActive ? 'page' : undefined}
>
  <div class="nav-item__icon">
    {#if IconComponent}
      <IconComponent size={18} strokeWidth={2} />
    {/if}
  </div>
  {#if !collapsed}
    <span class="nav-item__label">
      {@render children?.()}
    </span>
  {/if}
  {#if isImportant}
    <div class="nav-item__badge"></div>
  {/if}
</a>

<style>
  .nav-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: var(--radius-md);
    text-decoration: none;
    color: var(--text-secondary);
    font-size: 0.875rem;
    transition: all 0.15s ease;
    min-height: 44px; /* Touch target */
    font-weight: 400;
  }

  .nav-item:hover {
    color: var(--text-primary);
    background-color: var(--surface-muted);
    transform: translateX(2px);
  }

  .nav-item--active {
    color: var(--primary);
    background-color: var(--primary-light);
    font-weight: 500;
    box-shadow: var(--shadow-sm);
  }

  .nav-item--active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 20px;
    background: var(--primary);
    border-radius: 0 2px 2px 0;
  }

  .nav-item--important {
    border: 1px solid var(--accent-light);
    background: linear-gradient(135deg, var(--accent-light), transparent);
  }

  .nav-item--important:hover {
    background: var(--accent-light);
    color: var(--accent);
    border-color: var(--accent);
    transform: translateX(3px) translateY(-1px);
  }

  /* Import button special style */
  .nav-item--import {
    background: var(--acapulco);
    color: white;
    font-weight: 500;
    justify-content: center;
  }

  .nav-item--import:hover {
    background: #6ba696;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(122, 186, 165, 0.3);
  }

  .nav-item--import.nav-item--active {
    background: #5a9a86;
    color: white;
  }

  .nav-item--import.nav-item--active::before {
    display: none;
  }

  .nav-item--collapsed {
    justify-content: center;
    padding: 0.75rem;
  }

  .nav-item__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }

  .nav-item__label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
  }

  .nav-item__badge {
    flex-shrink: 0;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    margin-left: auto;
    background: var(--accent);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }

  .nav-item:focus {
    outline: none;
    box-shadow:
      0 0 0 2px var(--primary-light),
      0 0 0 4px var(--primary-light);
  }
</style>
