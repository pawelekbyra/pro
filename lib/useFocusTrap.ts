import { useEffect, useRef } from 'react';

export function useFocusTrap<T extends HTMLElement>(isOpen: boolean) {
  const ref = useRef<T>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen || !ref.current) {
      return;
    }

    previouslyFocusedElement.current = document.activeElement as HTMLElement;
    const focusableElements = ref.current.querySelectorAll<HTMLElement>(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') {
        return;
      }

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    const modalElement = ref.current;
    modalElement.addEventListener('keydown', handleKeyDown);

    return () => {
      modalElement.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement.current?.focus();
    };
  }, [isOpen]);

  return ref;
}
