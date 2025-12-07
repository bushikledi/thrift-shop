/**
 * Focus Trap Utility
 * Traps focus within a container element for accessibility
 */

export function createFocusTrap(container: HTMLElement) {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const getFocusableElements = () => {
    return Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter((el) => {
      // Filter out elements that are not visible
      return (
        el.offsetWidth > 0 &&
        el.offsetHeight > 0 &&
        !el.hasAttribute('aria-hidden')
      );
    });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  const trap = () => {
    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      // Use setTimeout to ensure the element is rendered
      setTimeout(() => {
        focusableElements[0]?.focus();
      }, 0);
    }
  };

  const release = () => {
    container.removeEventListener('keydown', handleKeyDown);
  };

  return { trap, release };
}

/**
 * Hook to trap focus in a container
 * Note: Import React in the component file where this is used
 */

