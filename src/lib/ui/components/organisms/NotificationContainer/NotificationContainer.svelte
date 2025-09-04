<script lang="ts">
  import { notifications, type Notification } from '$lib/shared/stores/notifications.js';
  import { Alert } from '$lib/ui/components/atoms/Alert/index.js';
  import { fly } from 'svelte/transition';

  function handleDismiss(notification: Notification) {
    notifications.remove(notification.id);
  }
</script>

<div class="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full pointer-events-none">
  {#each $notifications as notification (notification.id)}
    <div 
      class="pointer-events-auto"
      transition:fly={{ x: 300, duration: 300 }}
    >
      <Alert
        type={notification.type}
        title={notification.title}
        dismissible={notification.dismissible}
        autoHide={notification.autoHide}
        hideAfter={notification.hideAfter}
        ondismiss={() => handleDismiss(notification)}
      >
        {notification.message}
      </Alert>
    </div>
  {/each}
</div>