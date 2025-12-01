import type { Handle } from '@sveltejs/kit';

const BACKEND_URL = process.env.INTERNAL_API_URL?.replace('/api', '') || 'http://backend:14040';

export const handle: Handle = async ({ event, resolve }) => {
  // Proxy /api/* requests to backend
  if (event.url.pathname.startsWith('/api/')) {
    const backendUrl = `${BACKEND_URL}${event.url.pathname}${event.url.search}`;

    try {
      // Build headers, excluding accept-encoding to get uncompressed response
      const headers = new Headers();
      event.request.headers.forEach((value, key) => {
        // Skip encoding headers to avoid compression issues
        if (key.toLowerCase() !== 'accept-encoding') {
          headers.set(key, value);
        }
      });

      const response = await fetch(backendUrl, {
        method: event.request.method,
        headers,
        body:
          event.request.method !== 'GET' && event.request.method !== 'HEAD'
            ? await event.request.text()
            : undefined,
        // @ts-expect-error - duplex is needed for streaming
        duplex: 'half',
      });

      // Get the response body as text to avoid encoding issues
      const body = await response.text();

      // Build clean response headers
      const responseHeaders = new Headers();
      responseHeaders.set(
        'Content-Type',
        response.headers.get('Content-Type') || 'application/json'
      );

      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error('Proxy error:', error);
      return new Response(JSON.stringify({ success: false, error: 'Backend unavailable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return resolve(event);
};
