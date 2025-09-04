<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
    // Redirect to dashboard
    goto('/dashboard');
  });
</script>

<svelte:head>
  <title>Expense Tracker</title>
</svelte:head>

<div class="min-h-screen bg-soft-white flex items-center justify-center">
  <div class="text-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-green mx-auto"></div>
    <p class="mt-4 text-gray-600">Cargando...</p>
  </div>
</div>
