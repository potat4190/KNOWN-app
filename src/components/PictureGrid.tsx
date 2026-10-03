/**
 * The four pictures, 2×2 in ORDER (S, F, A, J), aspect 1:0.8. Selected: lamp
 * ring, glow and a numbered badge (1, 2); with two chosen the others are
 * desaturated. Screen readers hear a description of the image (pic_*), never
 * an emotion word. The internal keys are never shown.
 */
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { PICTURES, ORDER, type Pic } from '@/lib/content';
import { useTheme } from '@/theme';
import { useT } from '@/i18n';
import { localizeDigits } from '@/i18n/langs';
import { Txt } from './Txt';

export function PictureGrid({ chosen, onToggle }: { chosen: Pic[]; onToggle: (k: Pic) => void }) {
  const { c, radius } = useTheme();
  const { t, lang } = useT();
  const full = chosen.length >= 2;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {ORDER.map((k, i) => {
        const at = chosen.indexOf(k);
        const on = at >= 0;
        return (
          <Pressable
            key={k}
            testID={`pic-${i + 1}`}
            onPress={() => onToggle(k)}
            accessibilityRole="button"
            accessibilityLabel={t(`pic_${k}`)}
            accessibilityState={{ selected: on }}
            style={{
              width: '47.5%',
              aspectRatio: 1 / 0.8,
              borderRadius: radius.card,
              overflow: 'hidden',
              borderWidth: on ? 4 : 1,
              borderColor: on ? c.lamp : c.border,
              shadowColor: c.lamp,
              shadowOpacity: on ? 0.6 : 0,
              shadowRadius: on ? 12 : 0,
              shadowOffset: { width: 0, height: 0 },
              elevation: on ? 6 : 0,
            }}
          >
            <Image
              source={PICTURES[k]}
              style={{ width: '100%', height: '100%', opacity: full && !on ? 0.45 : 1 }}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
            {full && !on ? (
              <View style={{ position: 'absolute', inset: 0, backgroundColor: c.background, opacity: 0.35 }} />
            ) : null}
            {on ? (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  end: 8,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: c.lamp,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityElementsHidden
              >
                <Txt v="secondary" weight="bold" color={c.onLamp} maxFontSizeMultiplier={1}>
                  {localizeDigits(at + 1, lang)}
                </Txt>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
