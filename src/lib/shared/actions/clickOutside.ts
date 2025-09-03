export function clickOutside(node: HTMLElement, callback?: () => void) {
  const handleClick = (event: MouseEvent) => {
    if (!node.contains(event.target as Node)) {
      callback?.();
      // Trigger custom event using new syntax
      const customEvent = new CustomEvent('click-outside');
      node.dispatchEvent(customEvent);
    }
  };

  document.addEventListener('click', handleClick, true);

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
    }
  };
}