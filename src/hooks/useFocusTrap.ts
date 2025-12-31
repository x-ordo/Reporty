import React, { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]:not([disabled]):not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
].join(', ');

interface UseFocusTrapOptions {
  isOpen: boolean;
  onClose?: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  restoreFocusOnClose?: boolean;
}

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onClose,
  initialFocusRef,
  restoreFocusOnClose = true,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    const nodeList = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const result: HTMLElement[] = [];
    nodeList.forEach((el) => {
      if (el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden') {
        result.push(el);
      }
    });
    return result;
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen || !containerRef.current) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose?.();
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement as HTMLElement;

        if (event.shiftKey) {
          if (activeElement === firstElement || !containerRef.current.contains(activeElement)) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (activeElement === lastElement || !containerRef.current.contains(activeElement)) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [isOpen, onClose, getFocusableElements]
  );

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;

      const focusTarget = initialFocusRef?.current;
      if (focusTarget) {
        requestAnimationFrame(() => {
          focusTarget.focus();
        });
      } else {
        requestAnimationFrame(() => {
          const focusableElements = getFocusableElements();
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          } else if (containerRef.current) {
            containerRef.current.focus();
          }
        });
      }

      document.addEventListener('keydown', handleKeyDown, true);

      return () => {
        document.removeEventListener('keydown', handleKeyDown, true);
      };
    } else {
      if (restoreFocusOnClose && previousActiveElement.current) {
        requestAnimationFrame(() => {
          previousActiveElement.current?.focus();
          previousActiveElement.current = null;
        });
      }
    }
  }, [isOpen, handleKeyDown, getFocusableElements, initialFocusRef, restoreFocusOnClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleFocusOut = (event: FocusEvent) => {
      if (!containerRef.current) return;

      const relatedTarget = event.relatedTarget as HTMLElement | null;
      if (relatedTarget && !containerRef.current.contains(relatedTarget)) {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    };

    const container = containerRef.current;
    container?.addEventListener('focusout', handleFocusOut);

    return () => {
      container?.removeEventListener('focusout', handleFocusOut);
    };
  }, [isOpen, getFocusableElements]);

  return containerRef;
}

export default useFocusTrap;
