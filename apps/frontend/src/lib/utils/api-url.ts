/**
 * Get the appropriate API URL based on the execution context
 * - Server-side (SSR): Uses INTERNAL_API_URL env var (Docker network)
 * - Client-side: Uses relative /api path (proxied through SvelteKit hooks.server.ts)
 *
 * This allows deployment behind reverse proxies (Traefik, nginx) without exposing backend port
 */
export function getApiUrl(): string {
  // Check if we're running on the server (SSR)
  const isServer = typeof window === 'undefined';

  if (isServer) {
    // Server-side: use internal Docker network URL
    return process.env.INTERNAL_API_URL || 'http://backend:14040/api';
  }

  // Client-side: use relative path - will be proxied by SvelteKit hooks.server.ts
  // This works with any reverse proxy (Traefik, nginx, etc.) without port exposure
  return '/api';
}

// Default export for convenience
export const API_BASE = getApiUrl();
