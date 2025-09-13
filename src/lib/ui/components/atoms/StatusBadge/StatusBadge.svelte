<script lang="ts">
  import { CheckCircle2, Copy, AlertCircle, Edit3, Trash2 } from 'lucide-svelte';

  export let status: 'new' | 'duplicate' | 'error' | 'edited' | 'discarded' | 'success' | 'warning' | 'info' | 'primary';
  export let size: 'xs' | 'sm' | 'md' | 'lg' = 'md';
  export let text: string | undefined = undefined;
  export let showIcon: boolean = true;

  // DaisyUI status configuration
  const statusConfig = {
    new: { 
      text: 'Nueva', 
      classes: 'badge-success', 
      icon: CheckCircle2 
    },
    duplicate: { 
      text: 'Duplicado', 
      classes: 'badge-warning', 
      icon: Copy 
    },
    error: { 
      text: 'Error', 
      classes: 'badge-error', 
      icon: AlertCircle 
    },
    edited: { 
      text: 'Editada', 
      classes: 'badge-info', 
      icon: Edit3 
    },
    discarded: { 
      text: 'Descartada', 
      classes: 'badge-neutral', 
      icon: Trash2 
    },
    success: { 
      text: 'Éxito', 
      classes: 'badge-success', 
      icon: CheckCircle2 
    },
    warning: { 
      text: 'Advertencia', 
      classes: 'badge-warning', 
      icon: AlertCircle 
    },
    info: { 
      text: 'Información', 
      classes: 'badge-info', 
      icon: AlertCircle 
    },
    primary: { 
      text: 'Primario', 
      classes: 'badge-primary', 
      icon: CheckCircle2 
    }
  };

  // DaisyUI size configuration
  const sizeConfig = {
    xs: {
      badge: 'badge-xs',
      icon: 'w-2.5 h-2.5'
    },
    sm: {
      badge: 'badge-sm',
      icon: 'w-3 h-3'
    },
    md: {
      badge: '',  // default size
      icon: 'w-3 h-3'
    },
    lg: {
      badge: 'badge-lg',
      icon: 'w-4 h-4'
    }
  };

  $: config = statusConfig[status];
  $: sizeClasses = sizeConfig[size];
  $: displayText = text || config.text;
</script>

<div 
  class="badge {config.classes} {sizeClasses.badge} gap-1"
  role="status"
  aria-label={displayText}
>
  {#if showIcon}
    <svelte:component 
      this={config.icon} 
      class="{sizeClasses.icon}" 
    />
  {/if}
  {displayText}
</div>