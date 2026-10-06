/**
 * Buttons (brief 5.3). One primary per screen, always the way forward.
 *  primary: full-width pill, 54 pt   soft: outline pill
 *  plain / quiet: bold text buttons, no underline (quiet is muted)
 *  lamp: the primary, lit in lamplight (Amen at the end of Stay here a moment)
 */
import { Pressable, View, type PressableProps, type ViewStyle } from 'react-native';
import { useState } from 'react';
import { useTheme } from '@/theme';
import { Txt } from './Txt';
import { Icon, type IconName } from './Icon';

type Kind = 'primary' | 'soft' | 'plain' | 'quiet' | 'danger' | 'lamp';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  kind?: Kind;
  icon?: IconName;
  style?: ViewStyle;
  small?: boolean;
  /** A short count shown in a lamp-coloured circle after the label (e.g. pictures chosen). */
  badge?: string;
};

export function Button({ label, kind = 'primary', icon, disabled, style, small, badge, ...rest }: Props) {
  const { c, radius } = useTheme();
  const [focused, setFocused] = useState(false);
  const fg =
    kind === 'primary'
      ? c.onPrimary
      : kind === 'lamp'
        ? c.onLamp
        : kind === 'danger'
          ? c.dangerBg
          : kind === 'quiet'
            ? c.textMuted
            : c.text;
  const bg = kind === 'primary' ? c.primary : kind === 'lamp' ? c.lamp : kind === 'danger' ? c.danger : 'transparent';
  const big = kind === 'primary' || kind === 'lamp';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      hitSlop={kind === 'plain' || kind === 'quiet' ? 6 : 0}
      style={({ pressed }) => [
        {
          minHeight: big && !small ? 54 : 44,
          borderRadius: radius.full,
          paddingHorizontal: kind === 'plain' || kind === 'quiet' ? 8 : 20,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          backgroundColor: bg,
          borderWidth: kind === 'soft' ? 1.5 : 0,
          borderColor: c.border,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
          alignSelf: big || kind === 'soft' || kind === 'danger' ? 'stretch' : 'center',
        },
        kind === 'lamp' && {
          shadowColor: c.lamp,
          shadowOpacity: 0.55,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 0 },
          elevation: 8,
        },
        focused && { borderWidth: 3, borderColor: c.focus },
        style,
      ]}
      {...rest}
    >
      {icon ? (
        <View>
          <Icon name={icon} size={20} color={fg} />
        </View>
      ) : null}
      <Txt v={big ? 'body' : 'secondary'} weight="bold" color={fg} center maxFontSizeMultiplier={1.6}>
        {label}
      </Txt>
      {badge ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            minWidth: 24,
            minHeight: 24,
            paddingHorizontal: 6,
            borderRadius: 12,
            backgroundColor: c.lamp,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt v="footnote" weight="bold" color={c.onLamp} maxFontSizeMultiplier={1.2}>
            {badge}
          </Txt>
        </View>
      ) : null}
    </Pressable>
  );
}
