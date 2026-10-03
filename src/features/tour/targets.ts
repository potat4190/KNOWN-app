import type { RefObject } from 'react';
import type { View } from 'react-native';

export type Rect = { x: number; y: number; width: number; height: number };

const targets = new Map<string, RefObject<View | null>>();

export const registerTarget = (id: string, ref: RefObject<View | null>) => targets.set(id, ref);
export const unregisterTarget = (id: string, ref: RefObject<View | null>) => {
  if (targets.get(id) === ref) targets.delete(id);
};

export function measureTarget(id: string): Promise<Rect | null> {
  const ref = targets.get(id);
  return new Promise((resolve) => {
    if (!ref?.current) return resolve(null);
    ref.current.measureInWindow((x, y, width, height) => resolve(width && height ? { x, y, width, height } : null));
  });
}
