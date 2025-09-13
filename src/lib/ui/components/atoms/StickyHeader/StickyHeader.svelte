<script lang="ts">
  import { layoutStore } from '$lib/stores/layout';

  interface Props {
    class?: string;
    style?: string;
    children?: any;
  }

  let { class: className = '', style = '', children }: Props = $props();
  
  let sidebarCollapsed = $derived($layoutStore.sidebarCollapsed);
</script>

<!-- Responsive sticky header that accounts for sidebar -->
<header 
  class="sticky top-0 z-10 border-b transition-all duration-300 {className}"
  style="background-color: var(--color-background-elevated); border-color: var(--color-border-primary); backdrop-filter: blur(8px); {style}"
>
  {@render children?.()}
</header>