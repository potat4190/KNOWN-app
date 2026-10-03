/** Scene illustration 16:7 with a bottom gradient caption: name (first letter capitalised) and title. */
import { View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { sceneOf } from '@/lib/content';
import { useTheme } from '@/theme';
import { Txt } from './Txt';

const cap = (s: string) => (s ? s.charAt(0).toLocaleUpperCase() + s.slice(1) : s);

export function SceneBanner({ path, name, title }: { path: string; name: string; title: string }) {
  const { radius } = useTheme();
  return (
    <View
      style={{ borderRadius: radius.card, overflow: 'hidden', aspectRatio: 16 / 7 }}
      accessible
      accessibilityLabel={`${cap(name)}. ${title}`}
    >
      <Image
        source={sceneOf(path)}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      <Svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="cap" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.35" stopColor="#000" stopOpacity={0} />
            <Stop offset="1" stopColor="#000" stopOpacity={0.72} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#cap)" />
      </Svg>
      <View style={{ position: 'absolute', start: 14, end: 14, bottom: 10 }}>
        <Txt v="h2" color="#fff" face="heading">
          {cap(name)}
        </Txt>
        <Txt v="secondary" color="#fff">
          {title}
        </Txt>
      </View>
    </View>
  );
}

export function Hero({ source }: { source: number }) {
  const { radius } = useTheme();
  return (
    <View style={{ borderRadius: radius.card, overflow: 'hidden', aspectRatio: 4 / 3 }} accessibilityElementsHidden>
      <Image source={source} style={{ width: '100%', height: '100%' }} contentFit="cover" />
    </View>
  );
}
