/** Small building blocks: Heading, Lead, Tile, Chip, Choice, Segmented, Notice, StatusLine, InlineConfirm, Card. */
import { useEffect, useRef, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, Text, View, type ViewStyle } from 'react-native';
import { focusForAccessibility } from '@/lib/a11y-focus';
import { Image } from 'expo-image';
import { useTheme } from '@/theme';
import { Txt } from './Txt';
import { Icon, type IconName } from './Icon';
import { Button } from './Button';

/** The screen's h1. Takes screen-reader focus when the screen appears. */
export function Heading({
  children,
  center,
  srOnly,
  level = 1,
}: {
  children: ReactNode;
  center?: boolean;
  srOnly?: boolean;
  level?: 1 | 2;
}) {
  const ref = useRef<Text>(null);
  const text = typeof children === 'string' ? children : '';
  useEffect(() => {
    const id = setTimeout(() => {
      focusForAccessibility(ref);
    }, 350);
    return () => clearTimeout(id);
  }, [text]);
  return (
    <Txt
      ref={ref}
      v={level === 1 ? 'h1' : 'h2'}
      accessibilityRole="header"
      center={center}
      style={srOnly ? { position: 'absolute', width: 1, height: 1, opacity: 0 } : undefined}
    >
      {children}
    </Txt>
  );
}

export const Lead = ({ children, center }: { children: ReactNode; center?: boolean }) => (
  <Txt v="body" muted center={center}>
    {children}
  </Txt>
);

export function Card({
  children,
  style,
  tone = 'surface',
}: {
  children: ReactNode;
  style?: ViewStyle;
  tone?: 'surface' | 'warm' | 'danger';
}) {
  const { c, radius } = useTheme();
  const bg = tone === 'warm' ? c.warm : tone === 'danger' ? c.dangerBg : c.surface;
  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius.card,
          padding: 16,
          borderWidth: tone === 'surface' ? 1 : 0,
          borderColor: c.border,
          gap: 8,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Card row: 44-pt icon or face thumbnail, title, subtitle, chevron (mirrored in RTL). */
export function Tile({
  title,
  sub,
  icon,
  face,
  onPress,
  testID,
}: {
  title: string;
  sub?: string;
  icon?: IconName;
  face?: number;
  onPress: () => void;
  testID?: string;
}) {
  const { c, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={sub ? `${title}. ${sub}` : title}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        minHeight: 64,
        borderRadius: radius.card,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {face != null ? (
        <Image
          source={face}
          style={{ width: 44, height: 44, borderRadius: 22 }}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      ) : icon ? (
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: c.warm,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} color={c.text} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Txt v="body" weight="bold">
          {title}
        </Txt>
        {sub ? (
          <Txt v="secondary" muted>
            {sub}
          </Txt>
        ) : null}
      </View>
      <Icon name="chevron" color={c.textMuted} size={20} />
    </Pressable>
  );
}

export function Chip({
  label,
  on,
  onPress,
  testID,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const { c, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      style={{
        minHeight: 44,
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderRadius: radius.full,
        backgroundColor: on ? c.warm : c.fillMuted,
        borderWidth: 2,
        borderColor: on ? c.lamp : 'transparent',
      }}
    >
      <Txt v="secondary" weight={on ? 'bold' : 'regular'}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** A selectable row with a ring (checkbox-like). */
export function Choice({
  title,
  detail,
  on,
  onPress,
  role = 'checkbox',
  testID,
}: {
  title: string;
  detail?: string | null;
  on: boolean;
  onPress: () => void;
  role?: 'checkbox' | 'radio';
  testID?: string;
}) {
  const { c, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole={role}
      accessibilityState={{ checked: on }}
      accessibilityLabel={detail ? `${title}. ${detail}` : title}
      style={{
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
        padding: 14,
        minHeight: 56,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: on ? c.lamp : c.border,
        backgroundColor: on ? c.warm : c.surface,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          marginTop: 2,
          borderRadius: role === 'radio' ? 12 : 6,
          borderWidth: 2,
          borderColor: on ? c.lamp : c.textMuted,
          backgroundColor: on ? c.lamp : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {on ? <Icon name="check" size={16} color={c.onLamp} /> : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt v="body" weight="bold">
          {title}
        </Txt>
        {detail ? (
          <Txt v="secondary" muted numberOfLines={3}>
            {detail}
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Segmented tabs (Pictures | My own words). */
export function Segmented<K extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: { key: K; label: string; testID?: string }[];
  value: K;
  onChange: (k: K) => void;
  label: string;
}) {
  const { c, radius } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={label}
      style={{ flexDirection: 'row', backgroundColor: c.fillMuted, borderRadius: radius.full, padding: 4 }}
    >
      {items.map((it) => {
        const on = it.key === value;
        return (
          <Pressable
            key={it.key}
            testID={it.testID}
            onPress={() => onChange(it.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? c.background : 'transparent',
            }}
          >
            <Txt v="secondary" weight={on ? 'bold' : 'regular'} maxFontSizeMultiplier={1.5}>
              {it.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Notice({
  children,
  icon,
  tone = 'warm',
}: {
  children: ReactNode;
  icon?: IconName;
  tone?: 'warm' | 'muted';
}) {
  const { c, radius } = useTheme();
  return (
    <View
      accessibilityRole="text"
      style={{
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
        padding: 12,
        borderRadius: radius.card,
        backgroundColor: tone === 'warm' ? c.warm : c.fillMuted,
      }}
    >
      {icon ? <Icon name={icon} size={20} color={c.lampInk} /> : null}
      <Txt v="secondary" style={{ flex: 1 }}>
        {children}
      </Txt>
    </View>
  );
}

/** Status line, announced to screen readers when it changes. */
export function StatusLine({ text }: { text: string }) {
  useEffect(() => {
    if (text) AccessibilityInfo.announceForAccessibility(text);
  }, [text]);
  if (!text) return null;
  return (
    <Txt v="secondary" muted accessibilityLiveRegion="polite">
      {text}
    </Txt>
  );
}

/** Inline confirmation (no system alert). */
export function InlineConfirm({
  question,
  yes,
  no,
  onYes,
  onNo,
  danger,
  testID,
}: {
  question: string;
  yes: string;
  no: string;
  onYes: () => void;
  onNo: () => void;
  danger?: boolean;
  testID?: string;
}) {
  return (
    <Card tone={danger ? 'danger' : 'warm'}>
      <View accessibilityRole="alert" testID={testID} style={{ gap: 12 }}>
        <Txt v="body">{question}</Txt>
        <Button
          label={yes}
          kind={danger ? 'danger' : 'primary'}
          small
          onPress={onYes}
          testID={testID ? `${testID}-yes` : undefined}
        />
        <Button label={no} kind="soft" onPress={onNo} testID={testID ? `${testID}-no` : undefined} />
      </View>
    </Card>
  );
}

/** "You said" quote card (own words). */
export function SaidCard({ label, words, children }: { label: string; words: string; children?: ReactNode }) {
  const { c, radius } = useTheme();
  return (
    <View
      style={{
        padding: 16,
        borderRadius: radius.card,
        backgroundColor: c.warm,
        borderStartWidth: 4,
        borderStartColor: c.lamp,
        gap: 6,
      }}
    >
      <Txt v="footnote" weight="bold" color={c.lampInk}>
        {label}
      </Txt>
      <Txt v="body" style={{ fontStyle: 'italic' }}>
        “{words}”
      </Txt>
      {children}
    </View>
  );
}
