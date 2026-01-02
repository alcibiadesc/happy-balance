import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';

// Re-export getApiUrl from existing module
export { getApiUrl, API_BASE } from './api-url';

/**
 * Create authenticated headers for API requests
 */
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = authStore.getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Create authenticated headers for file uploads (without Content-Type)
 */
export function getAuthHeadersForUpload(): Record<string, string> {
  const headers: Record<string, string> = {};

  const token = authStore.getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}
