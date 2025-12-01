/**
 * Svelte action for modal keyboard handling
 * Provides Enter to confirm and Escape to cancel functionality
 *
 * Usage:
 * <div use:modalKeyboard={{ onConfirm, onCancel, isOpen }}>
 */

export interface ModalKeyboardOptions {
  /** Called when Enter is pressed */
  onConfirm?: () => void;
  /** Called when Escape is pressed */
  onCancel?: () => void;
  /** Whether the modal is currently open */
  isOpen?: boolean;
  /** Prevent Enter from confirming when focus is on these element types */
  preventEnterOn?: string[];
}

const DEFAULT_PREVENT_ENTER_ON = ['textarea', 'select', '[contenteditable="true"]'];

export function modalKeyboard(_node: HTMLElement, options: ModalKeyboardOptions = {}) {
  let currentOptions = options;

  function handleKeydown(event: KeyboardEvent) {
    if (!currentOptions.isOpen) return;

    const target = event.target as HTMLElement;
    const preventOn = currentOptions.preventEnterOn || DEFAULT_PREVENT_ENTER_ON;

    if (event.key === 'Escape') {
      event.preventDefault();
      currentOptions.onCancel?.();
    } else if (event.key === 'Enter') {
      // Don't trigger confirm if focused on textarea, select, or contenteditable
      const shouldPrevent = preventOn.some((selector) => target.matches(selector));

      // Also don't trigger if it's a button (let the button handle its own click)
      const isButton = target.matches('button, [role="button"]');

      // Don't trigger if shift+enter (often used for new lines)
      if (event.shiftKey) return;

      if (!shouldPrevent && !isButton) {
        event.preventDefault();
        currentOptions.onConfirm?.();
      }
    }
  }

  function addListener() {
    window.addEventListener('keydown', handleKeydown);
  }

  function removeListener() {
    window.removeEventListener('keydown', handleKeydown);
  }

  // Add listener if modal is open
  if (currentOptions.isOpen) {
    addListener();
  }

  return {
    update(newOptions: ModalKeyboardOptions) {
      const wasOpen = currentOptions.isOpen;
      currentOptions = newOptions;

      // Handle listener based on open state changes
      if (!wasOpen && newOptions.isOpen) {
        addListener();
      } else if (wasOpen && !newOptions.isOpen) {
        removeListener();
      }
    },
    destroy() {
      removeListener();
    },
  };
}

/**
 * Hook version for use in script context
 * Returns handlers that can be used with svelte:window
 */
export function createModalKeyboardHandler(options: {
  onConfirm?: () => void;
  onCancel?: () => void;
  preventEnterOn?: string[];
}) {
  const preventOn = options.preventEnterOn || DEFAULT_PREVENT_ENTER_ON;

  return function handleKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;

    if (event.key === 'Escape') {
      event.preventDefault();
      options.onCancel?.();
    } else if (event.key === 'Enter') {
      const shouldPrevent = preventOn.some((selector) => target.matches(selector));
      const isButton = target.matches('button, [role="button"]');

      if (event.shiftKey) return;

      if (!shouldPrevent && !isButton) {
        event.preventDefault();
        options.onConfirm?.();
      }
    }
  };
}
