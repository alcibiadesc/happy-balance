<script lang="ts">
  import { CheckCircle2, Copy, AlertCircle, Edit3, Trash2 } from 'lucide-svelte';

  export let status: 'new' | 'duplicate' | 'error' | 'edited' | 'discarded' | 'success' | 'warning';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let customText: string | undefined = undefined;
  export let showIcon: boolean = true;

  // Status configuration
  const statusConfig = {
    new: { 
      text: 'Nueva', 
      classes: 'bg-green-100 text-green-800', 
      icon: CheckCircle2 
    },
    duplicate: { 
      text: 'Duplicado', 
      classes: 'bg-yellow-100 text-yellow-800', 
      icon: Copy 
    },
    error: { 
      text: 'Error', 
      classes: 'bg-red-100 text-red-800', 
      icon: AlertCircle 
    },
    edited: { 
      text: 'Editada', 
      classes: 'bg-blue-100 text-blue-800', 
      icon: Edit3 
    },
    discarded: { 
      text: 'Descartada', 
      classes: 'bg-gray-100 text-gray-800', 
      icon: Trash2 
    },
    success: { 
      text: 'Éxito', 
      classes: 'bg-green-100 text-green-800', 
      icon: CheckCircle2 
    },
    warning: { 
      text: 'Advertencia', 
      classes: 'bg-yellow-100 text-yellow-800', 
      icon: AlertCircle 
    }
  };

  // Size configuration
  const sizeConfig = {
    sm: {
      badge: 'px-2 py-0.5 text-xs',
      icon: 'w-3 h-3'
    },
    md: {
      badge: 'px-2.5 py-0.5 text-xs',
      icon: 'w-3 h-3'
    },
    lg: {
      badge: 'px-3 py-1 text-sm',
      icon: 'w-4 h-4'
    }
  };

  $: config = statusConfig[status];
  $: sizeClasses = sizeConfig[size];
</script>

<span 
  class="inline-flex items-center rounded-full font-medium {config.classes} {sizeClasses.badge}"
  role="status"
  aria-label={customText || config.text}
>
  {#if showIcon}
    <svelte:component 
      this={config.icon} 
      class="{sizeClasses.icon} {customText || config.text ? 'mr-1' : ''}" 
    />
  {/if}
  {customText || config.text}
</span>