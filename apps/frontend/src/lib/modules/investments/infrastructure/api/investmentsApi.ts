import type {
  Investment,
  InvestmentWithMetrics,
  PortfolioSummary,
  TimelineEntry,
  CreateInvestmentData,
  UpdateInvestmentData,
  AddHistoryEntryData,
} from '../../domain/entities/Investment';
import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';

const API_BASE = '/api/investments';

function getAuthHeaders(contentType = false): HeadersInit {
  const headers: Record<string, string> = {};
  const token = authStore.getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'API request failed');
  }
  return data.data;
}

export const investmentsApi = {
  async getAll(): Promise<Investment[]> {
    const response = await fetch(API_BASE, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse<Investment[]>(response);
  },

  async getById(id: string): Promise<Investment> {
    const response = await fetch(`${API_BASE}/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse<Investment>(response);
  },

  async create(data: CreateInvestmentData): Promise<Investment> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<Investment>(response);
  },

  async update(id: string, data: UpdateInvestmentData): Promise<Investment> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<Investment>(response);
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    await handleResponse<void>(response);
  },

  async getPortfolioSummary(): Promise<PortfolioSummary> {
    const response = await fetch(`${API_BASE}/summary`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse<PortfolioSummary>(response);
  },

  async getWithMetrics(): Promise<InvestmentWithMetrics[]> {
    const response = await fetch(`${API_BASE}/with-metrics`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse<InvestmentWithMetrics[]>(response);
  },

  async getTimeline(
    period: 'day' | 'week' | 'month' | 'year' = 'month',
    dateFrom?: string,
    dateTo?: string
  ): Promise<TimelineEntry[]> {
    const params = new URLSearchParams({ period });
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);

    const response = await fetch(`${API_BASE}/timeline?${params}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse<TimelineEntry[]>(response);
  },

  async addHistoryEntry(investmentId: string, data: AddHistoryEntryData): Promise<Investment> {
    const response = await fetch(`${API_BASE}/${investmentId}/history`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<Investment>(response);
  },

  async deleteHistoryEntry(investmentId: string, historyId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${investmentId}/history/${historyId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    await handleResponse<void>(response);
  },

  async updateSortOrder(items: { id: string; sortOrder: number }[]): Promise<void> {
    const response = await fetch(`${API_BASE}/sort-order`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(items),
    });
    await handleResponse<void>(response);
  },

  async syncWithCategories(): Promise<{ total: number; synced: number; skipped: number }> {
    const response = await fetch(`${API_BASE}/sync-categories`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
    });
    return handleResponse<{ total: number; synced: number; skipped: number }>(response);
  },

  async updateHistoryEntry(
    investmentId: string,
    historyId: string,
    data: { amount?: number; date?: string; notes?: string; type?: string }
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/${investmentId}/history/${historyId}`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    await handleResponse<void>(response);
  },

  async importFromGofire(data: { data: any[] }): Promise<{ imported: number; historyCount: number }> {
    const response = await fetch(`${API_BASE}/import/gofire`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<{ imported: number; historyCount: number }>(response);
  },

  async exportPortfolio(): Promise<{ investments: any[]; exportDate: string; version: string }> {
    const response = await fetch(`${API_BASE}/export`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return handleResponse<{ investments: any[]; exportDate: string; version: string }>(response);
  },
};
