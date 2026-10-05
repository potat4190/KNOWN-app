/** WEB ONLY: findNodeHandle doesn't exist in browsers; focus the element itself. */
import type { RefObject } from 'react';

export function focusForAccessibility(ref: RefObject<unknown>) {
  const el = ref.current as { focus?: (o?: FocusOptions) => void } | null;
  try {
    el?.focus?.({ preventScroll: true });
  } catch {
    /* ignore */
  }
}
