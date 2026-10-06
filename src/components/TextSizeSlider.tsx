/**
 * Settings → Text size (Oct 6). A slider from 85% to 150% that resizes every line of text
 * in KNOWN, Scripture included, on top of the phone's own text size. Built from plain views
 * (no native slider module, so no new development build): drag or tap the track, tap the
 * small or large "A" to step, or use the screen reader's adjust gesture / arrow keys.
 * A sample line shows the size live; "Reset to default" appears once it has changed.
 */
import { useState } from 'react';
import { Pressable, View, type GestureResponderEvent } from 'react-native';
import { useTheme } from '@/theme';
import { TEXT_SCALE, clampTextScale } from '@/theme/fonts';
import { useT } from '@/i18n';
import { localizeDigits } from '@/i18n/langs';
import { usePrefs } from '@/state/prefs';
import { Txt } from './Txt';

const THUMB = 28;

export function TextSizeSlider() {
  const { c, radius } = useTheme();
  const { t, lang } = useT();
  const value = clampTextScale(usePrefs((p) => p.textScale));
  const set = usePrefs((p) => p.set);
  const [w, setW] = useState(0);

  const pct = Math.round(value * 100);
  const label =
    value === TEXT_SCALE.default ? t('text_size_default') : t('text_size_pct', { n: localizeDigits(pct, lang) });
  const frac = (value - TEXT_SCALE.min) / (TEXT_SCALE.max - TEXT_SCALE.min);
  const change = (v: number) => {
    const next = clampTextScale(v);
    if (next !== value) set({ textScale: next });
  };
  const step = (dir: 1 | -1) => change(value + dir * TEXT_SCALE.step);
  const fromX = (e: GestureResponderEvent) => {
    if (!w) return;
    const x = Math.min(Math.max(e.nativeEvent.locationX - THUMB / 2, 0), w - THUMB);
    change(TEXT_SCALE.min + (x / (w - THUMB)) * (TEXT_SCALE.max - TEXT_SCALE.min));
  };

  const stepper = (dir: 1 | -1) => (
    <Pressable
      onPress={() => step(dir)}
      accessibilityRole="button"
      accessibilityLabel={`${t('text_size')} ${dir > 0 ? '+' : '−'}`}
      hitSlop={6}
      style={{ width: 36, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
      testID={dir > 0 ? 'text-size-up' : 'text-size-down'}
    >
      {/* Fixed sizes on purpose: these show the range, so they must not grow with it. */}
      <Txt
        v="body"
        face="reading"
        muted
        maxFontSizeMultiplier={1}
        style={{ fontSize: dir > 0 ? 26 : 15, lineHeight: 30 }}
      >
        A
      </Txt>
    </Pressable>
  );

  return (
    <View
      style={{ gap: 14, padding: 16, borderRadius: radius.card + 4, backgroundColor: c.surface }}
      testID="text-size"
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <Txt v="body" weight="bold" nativeID="text-size-label">
          {t('text_size')}
        </Txt>
        <Txt v="secondary" weight="bold" color={c.lampInk} testID="text-size-value">
          {label}
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {stepper(-1)}
        <View
          style={{ flex: 1, height: 44, justifyContent: 'center' }}
          onLayout={(e) => setW(e.nativeEvent.layout.width)}
          accessible
          focusable
          accessibilityRole="adjustable"
          accessibilityLabel={t('text_size')}
          accessibilityValue={{
            min: Math.round(TEXT_SCALE.min * 100),
            max: Math.round(TEXT_SCALE.max * 100),
            now: pct,
            text: label,
          }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
          {...({
            // Web: arrow keys move the slider (react-native-web passes onKeyDown to the element).
            onKeyDown: (e: { key: string; preventDefault: () => void }) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                step(1);
              }
              if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                step(-1);
              }
            },
          } as object)}
          testID="text-size-track"
        >
          <View style={{ height: 6, borderRadius: 3, backgroundColor: c.border, marginHorizontal: THUMB / 2 }}>
            <View style={{ width: `${frac * 100}%`, height: 6, borderRadius: 3, backgroundColor: c.lamp }} />
          </View>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: frac * Math.max(0, w - THUMB),
              width: THUMB,
              height: THUMB,
              borderRadius: THUMB / 2,
              backgroundColor: c.text,
              borderWidth: 4,
              borderColor: c.lamp,
            }}
          />
          {/* One layer on top takes every touch, so locationX is always measured from the track's start. */}
          <View
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
            onResponderGrant={fromX}
            onResponderMove={fromX}
          />
        </View>
        {stepper(1)}
      </View>
      <Txt v="scripture" face="reading" style={{ borderTopWidth: 1, borderColor: c.border, paddingTop: 14 }}>
        {t('tour1_more')}
      </Txt>
      {value !== TEXT_SCALE.default ? (
        <Pressable
          onPress={() => change(TEXT_SCALE.default)}
          accessibilityRole="button"
          style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}
          testID="text-size-reset"
        >
          <Txt v="secondary" weight="bold" style={{ textDecorationLine: 'underline', textDecorationColor: c.lamp }}>
            {t('text_size_reset')}
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}
