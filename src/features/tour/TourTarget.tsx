/**
 * Marks an element a coach mark can point at. The TourProvider measures it
 * with measureInWindow when a tip for this id is shown (see ./TourProvider).
 * `fixed`: the element is in the header or the sticky actions bar (always on
 * screen); other targets get a tip only while scrolled into view.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { View } from 'react-native';
import { registerTarget, unregisterTarget } from './targets';

export function TourTarget({ id, fixed = false, children }: { id: string; fixed?: boolean; children: ReactNode }) {
  const ref = useRef<View>(null);
  useEffect(() => {
    registerTarget(id, ref, fixed);
    return () => unregisterTarget(id, ref);
  }, [id, fixed]);
  return (
    <View ref={ref} collapsable={false}>
      {children}
    </View>
  );
}
