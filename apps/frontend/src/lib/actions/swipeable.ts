/**
 * Svelte action for swipeable elements using Pointer Events API.
 * Tracks horizontal drag and fires swipe callbacks when threshold is exceeded.
 */

export interface SwipeableOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onMove?: (deltaX: number) => void;
  onEnd?: () => void;
  threshold?: number;
  enabled?: boolean;
}

export function swipeable(node: HTMLElement, options: SwipeableOptions) {
  let currentOptions = options;
  let startX = 0;
  let deltaX = 0;
  let isDragging = false;
  let pointerId: number | null = null;

  function handlePointerDown(e: PointerEvent) {
    if (!currentOptions.enabled) return;
    // Only respond to primary pointer (left mouse / single touch)
    if (e.button !== 0) return;

    isDragging = true;
    startX = e.clientX;
    deltaX = 0;
    pointerId = e.pointerId;
    node.setPointerCapture(e.pointerId);
    node.style.transition = 'none';
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging || e.pointerId !== pointerId) return;

    deltaX = e.clientX - startX;
    currentOptions.onMove?.(deltaX);
  }

  function handlePointerUp(e: PointerEvent) {
    if (!isDragging || e.pointerId !== pointerId) return;

    isDragging = false;
    node.style.transition = '';
    const threshold = currentOptions.threshold ?? 100;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        currentOptions.onSwipeRight();
      } else {
        currentOptions.onSwipeLeft();
      }
    } else {
      // Spring back
      currentOptions.onEnd?.();
    }

    if (pointerId !== null) {
      try {
        node.releasePointerCapture(pointerId);
      } catch {
        // Ignore if pointer capture was already released
      }
    }
    pointerId = null;
    deltaX = 0;
  }

  function handlePointerCancel(e: PointerEvent) {
    if (e.pointerId !== pointerId) return;
    isDragging = false;
    node.style.transition = '';
    currentOptions.onEnd?.();
    pointerId = null;
    deltaX = 0;
  }

  node.addEventListener('pointerdown', handlePointerDown);
  node.addEventListener('pointermove', handlePointerMove);
  node.addEventListener('pointerup', handlePointerUp);
  node.addEventListener('pointercancel', handlePointerCancel);

  // Prevent default drag on images/links
  node.style.touchAction = 'pan-y';
  node.style.userSelect = 'none';

  return {
    update(newOptions: SwipeableOptions) {
      currentOptions = newOptions;
    },
    destroy() {
      node.removeEventListener('pointerdown', handlePointerDown);
      node.removeEventListener('pointermove', handlePointerMove);
      node.removeEventListener('pointerup', handlePointerUp);
      node.removeEventListener('pointercancel', handlePointerCancel);
    },
  };
}
