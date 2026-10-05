/**
 * WEB ONLY. The same entrance as Rise.tsx (fade in, rise 10 px, 500 ms, 40 ms apart, the
 * phone's default timing curve), as a CSS animation. Reanimated's web layout animations pin a
 * custom entering animation in place when it ends (position: absolute with a fixed top and
 * height), so whatever grew afterwards (the YouVersion text loading, "Read the full passage",
 * the prayer card) overlapped the sections below it.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

// react-native-web turns these into a CSS @keyframes rule, but only in StyleSheet.create
// (inline styles drop animationKeyframes). React Native's types don't list them.
const styles = StyleSheet.create({
  rise: {
    animationKeyframes: [
      {
        from: { opacity: 0, transform: [{ translateY: 10 }] },
        to: { opacity: 1, transform: [{ translateY: 0 }] },
      },
    ],
    animationDuration: '500ms',
    // Reanimated's default timing curve (ease in-out quad), which the phone's entrance uses.
    animationTimingFunction: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
    animationFillMode: 'backwards',
  } as unknown as ViewStyle,
});

export function Rise({ children, index = 0 }: { children: ReactNode; index?: number }) {
  const { reduceMotion } = useTheme();
  if (reduceMotion) return <>{children}</>;
  const delay = { animationDelay: `${index * 40}ms` } as unknown as ViewStyle;
  return <View style={[styles.rise, delay]}>{children}</View>;
}
