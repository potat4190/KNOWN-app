/** Moves screen-reader focus to an element (headings on screen change, tips). */
import type { RefObject } from 'react';
import { AccessibilityInfo, findNodeHandle } from 'react-native';

export function focusForAccessibility(ref: RefObject<unknown>) {
  const node = ref.current ? findNodeHandle(ref.current as never) : null;
  if (node) AccessibilityInfo.setAccessibilityFocus(node);
}
