<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import Sidebar from './Sidebar.svelte';
  import MobileSidebar from './MobileSidebar.svelte';
  import MobileHeader from './MobileHeader.svelte';

  // Mobile sidebar state
  let isMobileSidebarOpen = $state(false);

  function toggleMobileSidebar() {
    isMobileSidebarOpen = !isMobileSidebarOpen;
  }

  function closeMobileSidebar() {
    isMobileSidebarOpen = false;
  }

  onMount(() => {
    // Close mobile sidebar when clicking outside
    const handleOutsideClick = (event: Event) => {
      if (!isMobileSidebarOpen) return;

      const sidebar = document.querySelector('.mobile-sidebar');
      const header = document.querySelector('.mobile-header');

      if (
        sidebar &&
        header &&
        !sidebar.contains(event.target as Node) &&
        !header.contains(event.target as Node)
      ) {
        closeMobileSidebar();
      }
    };

    if (browser) {
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  });
</script>

<!-- Desktop Sidebar -->
<Sidebar />

<!-- Mobile Header -->
<MobileHeader
  onMenuToggle={toggleMobileSidebar}
  isMenuOpen={isMobileSidebarOpen}
/>

<!-- Mobile Sidebar -->
<MobileSidebar
  isOpen={isMobileSidebarOpen}
  onClose={closeMobileSidebar}
/>