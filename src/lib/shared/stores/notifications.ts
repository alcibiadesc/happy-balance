import { writable } from 'svelte/store';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  dismissible?: boolean;
  autoHide?: boolean;
  hideAfter?: number;
}

function createNotificationStore() {
  const { subscribe, update } = writable<Notification[]>([]);

  return {
    subscribe,
    
    add(notification: Omit<Notification, 'id'>): string {
      const id = crypto.randomUUID();
      const newNotification: Notification = {
        id,
        dismissible: true,
        autoHide: true,
        hideAfter: 5000,
        ...notification
      };

      update(notifications => [...notifications, newNotification]);
      return id;
    },

    remove(id: string) {
      update(notifications => notifications.filter(n => n.id !== id));
    },

    clear() {
      update(() => []);
    },

    // Convenience methods
    success(message: string, title?: string) {
      return this.add({ type: 'success', message, title });
    },

    error(message: string, title?: string) {
      return this.add({ type: 'error', message, title, autoHide: false });
    },

    warning(message: string, title?: string) {
      return this.add({ type: 'warning', message, title });
    },

    info(message: string, title?: string) {
      return this.add({ type: 'info', message, title });
    }
  };
}

export const notifications = createNotificationStore();