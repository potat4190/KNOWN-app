/**
 * The living lamp (Oct 6 redesign): a halo that pulses and a small flame that flickers.
 *
 * Every lamp runs on ONE shared clock (LAMP_EPOCH). A lamp that mounts on a new screen
 * starts at the clock's current phase, so moving from one Welcome card to the next, or
 * from the Welcome cards into Home, never restarts the light.
 *
 *  pulse  — Welcome cards and Home: the halo swells and settles every 4.8 s.
 *  breath — Stay here a moment: the halo swells for "Breathe in" (4 s) and settles for
 *           "Breathe out" (6 s), the same 10-second rhythm as BREATH_MS.
 *
 * Reduce Motion: nothing grows or moves. The glow only brightens and dims slowly, and the
 * flame is still.
 */
import { useEffect, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/theme';
import { BREATH_IN_MS, BREATH_MS } from './Lamp';
import { useGradientId } from './svgId';

export const PULSE_MS = 4800;
/** Where the room's lamp sits: its centre, this far below the top of the safe area. */
export const LAMP_Y = 200;
export const FLICKER_MS = 3400;
const BREATH_IN = BREATH_IN_MS / BREATH_MS; // 0.4

/** The shared clock. Exported for tests. */
export const LAMP_EPOCH = Date.now();
export const lampPhase = (periodMs: number, now = Date.now()) => ((now - LAMP_EPOCH) % periodMs) / periodMs;

/** 0 → 1 → 0 over one cycle; for breath, rises over the first 40% and falls over the rest. */
export function swell(p: number, breath: boolean): number {
  'worklet';
  if (!breath) return 0.5 - 0.5 * Math.cos(2 * Math.PI * p);
  return p < BREATH_IN
    ? 0.5 - 0.5 * Math.cos((Math.PI * p) / BREATH_IN)
    : 0.5 + 0.5 * Math.cos((Math.PI * (p - BREATH_IN)) / (1 - BREATH_IN));
}

/** A 0..1 progress that repeats forever, starting at the shared clock's phase. */
function useClock(periodMs: number, running: boolean) {
  const raw = useSharedValue(0);
  const [start] = useState(() => lampPhase(periodMs));
  useEffect(() => {
    if (!running) {
      cancelAnimation(raw);
      return;
    }
    raw.value = 0;
    raw.value = withRepeat(withTiming(1, { duration: periodMs, easing: Easing.linear }), -1);
    return () => cancelAnimation(raw);
  }, [periodMs, running, raw]);
  return { raw, start };
}

function Glow({ id, size, stops }: { id: string; size: number; stops: [number, string, number][] }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          {stops.map(([o, color, a]) => (
            <Stop key={o} offset={`${o}%`} stopColor={color} stopOpacity={a} />
          ))}
        </RadialGradient>
      </Defs>
      <Circle cx={50} cy={50} r={50} fill={`url(#${id})`} />
    </Svg>
  );
}

export function LivingLamp({
  size = 360,
  mode = 'pulse',
  style,
}: {
  size?: number;
  mode?: 'pulse' | 'breath';
  style?: ViewStyle;
}) {
  const { c, reduceMotion } = useTheme();
  const breath = mode === 'breath';
  const period = breath ? BREATH_MS : PULSE_MS;
  const halo = useClock(reduceMotion && !breath ? 6000 : period, true);
  const flame = useClock(FLICKER_MS, !reduceMotion);

  const haloStyle = useAnimatedStyle(() => {
    const p = (halo.raw.value + halo.start) % 1;
    const e = swell(p, breath);
    const scale = reduceMotion ? 0.95 : breath ? 0.7 + 0.38 * e : 0.76 + 0.32 * e;
    return { opacity: breath ? 0.4 + 0.6 * e : 0.45 + 0.55 * e, transform: [{ scale }] };
  });
  const flameStyle = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: 1, transform: [{ scale: 1 }] };
    const p = (flame.raw.value + flame.start) % 1;
    return {
      opacity: interpolate(p, [0, 0.08, 0.12, 0.4, 0.44, 0.69, 0.74, 1], [1, 0.72, 1, 0.86, 1, 0.78, 1, 1]),
      transform: [{ scale: interpolate(p, [0, 0.08, 0.12, 0.69, 0.74, 1], [1, 0.92, 1.04, 0.95, 1, 1]) }],
    };
  });

  const gid = useGradientId('ll');
  const inner = Math.round(size * 0.46);
  const core = Math.max(16, Math.round(size * 0.06));
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
      testID={`living-lamp-${mode}`}
    >
      <Animated.View style={[StyleSheet.absoluteFill, haloStyle]}>
        <Glow
          id={`${gid}-halo`}
          size={size}
          stops={[
            [0, c.lamp, 0.5],
            [30, c.lamp, 0.2],
            [64, c.lamp, 0],
          ]}
        />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', width: inner, height: inner }, haloStyle]}>
        <Glow
          id={`${gid}-inner`}
          size={inner}
          stops={[
            [0, '#FFE2AA', 0.75],
            [40, c.lamp, 0.25],
            [70, c.lamp, 0],
          ]}
        />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', width: core * 3, height: core * 3 }, flameStyle]}>
        <Glow
          id={`${gid}-flame`}
          size={core * 3}
          stops={[
            [0, '#FFFAF0', 1],
            [12, '#FFF6E2', 1],
            [24, '#FFD89C', 0.85],
            [50, c.lamp, 0.25],
            [100, c.lamp, 0],
          ]}
        />
      </Animated.View>
    </View>
  );
}

/**
 * The lamp-lit room behind the Welcome cards, Home and Stay here a moment: a warm wash at
 * the top that fades into the page. With `lamp`, the pulsing lamp sits at the same place on
 * every screen that uses it, so the light carries over from the Welcome cards into Home.
 */
export function LampRoom({ lamp = false }: { lamp?: boolean }) {
  const { c, scheme } = useTheme();
  const room = useGradientId('ll-room');
  const size = 380;
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={room} cx="50%" cy="0%" rx="90%" ry="70%">
            <Stop offset="0%" stopColor={scheme === 'dark' ? '#2A2421' : c.warm} stopOpacity={1} />
            <Stop offset="100%" stopColor={c.background} stopOpacity={1} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${room})`} />
      </Svg>
      {lamp ? (
        // Same place on every screen that has it: Home is shorter than the Welcome cards (it has
        // the tab bar), so a fixed distance from the top rather than a share of the height.
        <LivingLamp size={size} style={{ position: 'absolute', alignSelf: 'center', top: LAMP_Y - size / 2 }} />
      ) : null}
    </View>
  );
}
