/**
 * A mood's aura: soft light falling from the top of the screen in the mood's accent, from the
 * side the mood names (src/theme/moods.ts). Drawn behind everything; nothing on the house palette.
 */
import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/theme';
import { MOODS } from '@/theme/moods';
import { isRTL } from '@/i18n/direction';
import { svgHidden, useGradientId } from './svgId';

export function MoodAura() {
  const { mood, c, scheme } = useTheme();
  const id = useGradientId('aura');
  if (!mood) return null;
  const m = MOODS[mood];
  const x = Math.round((isRTL() ? 1 - m.auraX : m.auraX) * 100);
  const strength = m.aura[scheme === 'light' ? 0 : 1];
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 440 }}
      testID={`mood-aura-${mood}`}
    >
      <Svg width="100%" height="100%" {...svgHidden}>
        <Defs>
          <RadialGradient id={id} cx={`${x}%`} cy="0%" rx="80%" ry="100%">
            <Stop offset="0" stopColor={c.lamp} stopOpacity={strength} />
            <Stop offset="0.5" stopColor={c.lamp} stopOpacity={strength * 0.35} />
            <Stop offset="1" stopColor={c.lamp} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
