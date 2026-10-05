/**
 * Header (brief 5.3): back chevron or the KNOWN mark; centred step dots during
 * a session (current dot is a 20-pt pill); on the right the Help pill (always,
 * except on Help itself), and the gear outside a session or ✕ inside one.
 */
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/theme';
import { useT } from '@/i18n';
import { useUi } from '@/state/ui';
import { Txt } from './Txt';
import { Icon } from './Icon';
import { LampGlow } from './Lamp';
import { TourTarget } from '@/features/tour/TourTarget';

type Props = {
  /** Step 1–4 during a session. */
  step?: number | null;
  inSession?: boolean;
  /** Show a back chevron (default: the KNOWN mark). */
  onBack?: (() => void) | null;
  hideHelp?: boolean;
  hideGear?: boolean;
};

export function Mark() {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} accessible accessibilityLabel="KNOWN">
      <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
        <LampGlow size={26} />
      </View>
      <Txt v="secondary" face="heading" weight="bold" color={c.text} style={{ letterSpacing: 3 }} lang="en">
        KNOWN
      </Txt>
    </View>
  );
}

export function StepDots({ step }: { step: number }) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('step', { n: step })}
      style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}
    >
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={{
            height: 8,
            width: i === step ? 20 : 8,
            borderRadius: 4,
            backgroundColor: i <= step ? c.lamp : c.border,
          }}
        />
      ))}
    </View>
  );
}

export function Header({ step, inSession, onBack, hideHelp, hideGear }: Props) {
  const { c, radius } = useTheme();
  const { t } = useT();
  const openSheet = useUi((u) => u.openSheet);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 52,
        paddingHorizontal: 12,
      }}
    >
      <View style={{ flex: 1, alignItems: 'flex-start' }}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t('back')}
            style={{ minWidth: 44, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 2 }}
          >
            <Icon name="back" color={c.text} />
            <Txt v="secondary" weight="bold">
              {t('back')}
            </Txt>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => (inSession ? openSheet('exit') : router.navigate('/'))}
            accessibilityRole="button"
            accessibilityLabel="KNOWN"
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Mark />
          </Pressable>
        )}
      </View>
      <View style={{ alignItems: 'center' }}>{inSession && step ? <StepDots step={step} /> : null}</View>
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
        {!hideHelp && (
          <Pressable
            onPress={() => router.push('/help')}
            accessibilityRole="button"
            accessibilityLabel={t('help_btn')}
            style={{
              minHeight: 44,
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                borderRadius: radius.full,
                borderWidth: 1.5,
                borderColor: c.border,
                paddingHorizontal: 14,
                paddingVertical: 6,
                flexDirection: 'row',
                gap: 6,
                alignItems: 'center',
              }}
            >
              <Icon name="help" size={18} color={c.text} />
              <Txt v="secondary" weight="bold" maxFontSizeMultiplier={1.4}>
                {t('help_pill')}
              </Txt>
            </View>
          </Pressable>
        )}
        {inSession ? (
          <TourTarget id="header_x" fixed>
            <Pressable
              onPress={() => openSheet('exit')}
              testID="header-x"
              accessibilityRole="button"
              accessibilityLabel={t('exit_aria')}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="x" color={c.text} />
            </Pressable>
          </TourTarget>
        ) : !hideGear ? (
          <Pressable
            onPress={() => router.navigate('/more')}
            accessibilityRole="button"
            accessibilityLabel={t('settings')}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="gear" color={c.text} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
