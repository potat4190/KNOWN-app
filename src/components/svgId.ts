import { useId } from 'react';
import { Platform } from 'react-native';

/**
 * Props that hide a decorative drawing from screen readers. react-native-svg hands its props
 * straight to the browser's <svg>, where the phone-only names are unknown DOM attributes
 * (React warns, and the Expo dev overlay covers the screen), so the web gets aria-hidden.
 */
export const svgHidden = (
  Platform.OS === 'web'
    ? { 'aria-hidden': true }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' }
) as object;

/**
 * A gradient id unique to this drawing. On the web every SVG shares one document, and tab
 * screens stay mounted while hidden: with a shared id, a visible lamp could pick up the
 * gradient of a hidden one and draw nothing.
 */
export function useGradientId(prefix: string) {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
}
