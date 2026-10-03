/**
 * Marks an element a coach mark can point at. The TourProvider measures it
 * with measureInWindow when a tip for this id is shown (see ./TourProvider).
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { View } from 'react-native';
import { registerTarget, unregisterTarget } from './targets';

export function TourTarget({ id, children }: { id: string; children: ReactNode }) {
  const ref = useRef<View>(null);
  useEffect(() => {
    registerTarget(id, ref);
    return () => unregisterTarget(id, ref);
  }, [id]);
  return (
    <View ref={ref} collapsable={false}>
      {children}
    </View>
  );
}
