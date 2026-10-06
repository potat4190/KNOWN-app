import { useId } from 'react';

/**
 * A gradient id unique to this drawing. On the web every SVG shares one document, and tab
 * screens stay mounted while hidden: with a shared id, a visible lamp could pick up the
 * gradient of a hidden one and draw nothing.
 */
export function useGradientId(prefix: string) {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
}
