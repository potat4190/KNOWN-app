import type { RefObject } from 'react';
import type { View } from 'react-native';

export type Rect = { x: number; y: number; width: number; height: number };

/** `fixed`: in the header or the sticky actions bar, so always on screen (never scrolled away). */
const targets = new Map<string, { ref: RefObject<View | null>; fixed: boolean }>();

export const registerTarget = (id: string, ref: RefObject<View | null>, fixed = false) =>
  targets.set(id, { ref, fixed });
export const unregisterTarget = (id: string, ref: RefObject<View | null>) => {
  if (targets.get(id)?.ref === ref) targets.delete(id);
};

export const isFixedTarget = (id: string) => targets.get(id)?.fixed ?? false;

export function measureTarget(id: string): Promise<Rect | null> {
  const ref = targets.get(id)?.ref;
  return new Promise((resolve) => {
    if (!ref?.current) return resolve(null);
    ref.current.measureInWindow((x, y, width, height) => resolve(width && height ? { x, y, width, height } : null));
  });
}
