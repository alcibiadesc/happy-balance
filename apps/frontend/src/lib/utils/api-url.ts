/**
 * Get the appropriate API URL based on the execution context
 * - Server-side (SSR): Uses INTERNAL_API_URL env var (Docker network)
 * - Client-side: Auto-detects from window.location (works anywhere!)
 *
 * This allows true "copy-paste" Docker Compose deployment without configuration
 */
export function getApiUrl(): string {
  // Check if we're running on the server (SSR)
  const isServer = typeof window === 'undefined';

  if (isServer) {
    // Server-side: use internal Docker network URL
    return process.env.INTERNAL_API_URL || 'http://backend:14040/api';
  }

  // Client-side: auto-detect API URL from current window location
  // This makes it work on localhost, NAS, or any IP without configuration!
  const protocol = window.location.protocol; // http: or https:
  const hostname = window.location.hostname; // localhost, 192.168.1.50, etc.
  const apiPort = '14040'; // Backend port

  return `${protocol}//${hostname}:${apiPort}/api`;
}

// Default export for convenience
export const API_BASE = getApiUrl();