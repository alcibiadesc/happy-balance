import { readable } from 'svelte/store';
// Note: writable was removed as unused - re-add if needed

export const page = readable({
  url: new URL('http://localhost'),
  params: {},
  route: { id: '/' },
  status: 200,
  error: null,
  data: {},
  form: null,
});

export const navigating = readable(null);

export const updated = {
  subscribe: readable(false).subscribe,
  check: async () => false,
};
