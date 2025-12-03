import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { getApiUrl } from '$lib/utils/api-url';

export interface UpdateInfo {
  updateAvailable: boolean;
  current: {
    version: string;
    commit: string;
  };
  latest: {
    version: string;
    commit: string;
    lastPushed?: string;
  } | null;
  error?: string;
  lastChecked?: string;
}

const initialState: UpdateInfo = {
  updateAvailable: true, // TODO: cambiar a false cuando termines de probar
  current: { version: '1.0.0', commit: 'abc123' },
  latest: { version: '1.5.0', commit: 'modal-v2', lastPushed: '2025-12-03' },
};

export const updateInfo = writable<UpdateInfo>(initialState);
export const showChangelogModal = writable(false);

let hasChecked = false;

export async function checkForUpdates(): Promise<UpdateInfo> {
  if (!browser) return initialState;

  // Prevent multiple checks in same session
  if (hasChecked) {
    let currentInfo: UpdateInfo = initialState;
    updateInfo.subscribe((v) => (currentInfo = v))();
    return currentInfo;
  }

  try {
    const API_BASE = getApiUrl();
    const response = await fetch(`${API_BASE}/api/system/check-updates`);

    if (!response.ok) {
      throw new Error('Failed to check for updates');
    }

    const data = await response.json();

    const info: UpdateInfo = {
      updateAvailable: data.updateAvailable ?? false,
      current: data.current ?? { version: 'unknown', commit: 'unknown' },
      latest: data.latest ?? null,
      error: data.error,
      lastChecked: new Date().toISOString(),
    };

    updateInfo.set(info);
    hasChecked = true;

    return info;
  } catch (error) {
    const errorInfo: UpdateInfo = {
      ...initialState,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date().toISOString(),
    };

    updateInfo.set(errorInfo);
    hasChecked = true;

    return errorInfo;
  }
}
