import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';
import { getApiUrl } from '$lib/utils/api-url';

/**
 * Get authentication headers for API requests
 */
export function getAuthHeaders(): Record<string, string> {
  const token = authStore.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Authenticated fetch wrapper
 */
export async function authFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const apiBase = getApiUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${apiBase}${endpoint}`;

  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Authenticated fetch with JSON parsing
 */
export async function authFetchJson<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const response = await authFetch(endpoint, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        ok: false,
        error: errorData.error || `Request failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Toast duration constant
 */
export const TOAST_DURATION = 3000;
