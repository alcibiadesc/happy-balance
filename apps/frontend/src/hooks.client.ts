import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';
import type { Handle } from '@sveltejs/kit';

// List of public routes that don't require authentication
const publicRoutes = ['/login', '/health'];

export const handle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

  if (!isPublicRoute && !authStore.isAuthenticated) {
    // Redirect to login if not authenticated
    return new Response(null, {
      status: 302,
      headers: {
        location: '/login'
      }
    });
  }

  return await resolve(event);
};