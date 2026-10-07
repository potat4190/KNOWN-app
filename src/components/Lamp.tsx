/**
 * The lamp: KNOWN's mark. A radial amber glow, plus a breathing variant on a
 * 10-second cycle (scale 0.62 → 1 over the first 40%, then back). Under
 * Reduce Motion it is static.
 */
import { useEffect } from 'react';
import { svgHidden, useGradientId } from './svgId';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/theme';

export const BREATH_MS = 10_000;
export const BREATH_IN_MS = BREATH_MS * 0.4;

export function LampGlow({ size = 120, opacity = 1 }: { size?: number; opacity?: number }) {
  const { c } = useTheme();
  const id = useGradientId('lamp');
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      {...svgHidden}
    >
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFF4DD" stopOpacity={opacity} />
          <Stop offset="28%" stopColor={c.lamp} stopOpacity={0.95 * opacity} />
          <Stop offset="62%" stopColor={c.lamp} stopOpacity={0.28 * opacity} />
          <Stop offset="100%" stopColor={c.lamp} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={50} cy={50} r={50} fill={`url(#${id})`} />
    </Svg>
  );
}

export function Lamp({ size = 120, breathe = false }: { size?: number; breathe?: boolean }) {
  const { reduceMotion } = useTheme();
  const scale = useSharedValue(breathe && !reduceMotion ? 0.62 : 1);
  useEffect(() => {
    if (!breathe || reduceMotion) {
      cancelAnimation(scale);
      scale.value = 1;
      return;
    }
    scale.value = 0.62;
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: BREATH_IN_MS, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.62, { duration: BREATH_MS - BREATH_IN_MS, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    return () => cancelAnimation(scale);
  }, [breathe, reduceMotion, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[{ width: size, height: size, alignSelf: 'center' }, style]} accessibilityElementsHidden>
      <LampGlow size={size} />
    </Animated.View>
  );
}
