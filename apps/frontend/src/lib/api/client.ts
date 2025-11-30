/**
 * Centralized HTTP client for API requests
 * Provides consistent error handling, authentication, and request/response processing
 */
import { browser } from '$app/environment';

// Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  status: number;
  message: string;
  details?: Record<string, string[]>;
}

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// Configuration
const API_BASE_URL = browser
  ? '/api'
  : import.meta.env.INTERNAL_API_URL || 'http://localhost:14040/api';

// Token management - will be set by auth module
let getAccessToken: (() => string | null) | null = null;
let onUnauthorized: (() => void) | null = null;

/**
 * Configure the API client with auth handlers
 */
export function configureApiClient(config: {
  getAccessToken: () => string | null;
  onUnauthorized?: () => void;
}) {
  getAccessToken = config.getAccessToken;
  onUnauthorized = config.onUnauthorized ?? null;
}

/**
 * Build headers for requests
 */
function buildHeaders(options?: { contentType?: string }): HeadersInit {
  const headers: Record<string, string> = {};

  // Add auth token if available
  const token = getAccessToken?.();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add content type
  if (options?.contentType) {
    headers['Content-Type'] = options.contentType;
  }

  return headers;
}

/**
 * Process API response
 */
async function processResponse<T>(response: Response): Promise<T> {
  // Handle 401 Unauthorized
  if (response.status === 401) {
    onUnauthorized?.();
    throw new ApiClientError(401, 'Session expired. Please log in again.');
  }

  // Parse response body
  let data: ApiResponse<T>;
  try {
    data = await response.json();
  } catch {
    throw new ApiClientError(response.status, 'Invalid response from server');
  }

  // Handle error responses
  if (!response.ok || !data.success) {
    throw new ApiClientError(
      response.status,
      data.error || data.message || 'Request failed',
      (data as unknown as { details?: Record<string, string[]> }).details
    );
  }

  return data.data;
}

/**
 * Core request function
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...buildHeaders({
        contentType: options.body ? 'application/json' : undefined,
      }),
      ...(options.headers || {}),
    },
    credentials: 'include',
  });

  return processResponse<T>(response);
}

/**
 * API client with typed methods
 */
export const api = {
  /**
   * GET request
   */
  get<T>(endpoint: string, query?: Record<string, unknown>): Promise<T> {
    let url = endpoint;
    if (query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return request<T>(url, { method: 'GET' });
  },

  /**
   * POST request
   */
  post<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  /**
   * PUT request
   */
  put<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  /**
   * DELETE request
   */
  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE' });
  },

  /**
   * Upload file(s) with FormData
   */
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAccessToken?.();

    const response = await fetch(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
      body: formData,
    });

    return processResponse<T>(response);
  },
};

export default api;
