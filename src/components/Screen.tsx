/**
 * A screen: safe area, scrollable content that rises in on entry (off under
 * Reduce Motion), and an optional sticky actions bar at the bottom.
 * Focus moves to the screen's heading on entry (see Heading).
 */
import { KeyboardAvoidingView, Platform, ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Children, isValidElement, type ReactNode } from 'react';
import { useTheme } from '@/theme';
import { TourTarget } from '@/features/tour/TourTarget';
import { ACTIONS_TARGET } from '@/features/tour/TourProvider';
import { Rise } from './Rise';
import { MoodAura } from './MoodAura';

type Props = {
  header?: ReactNode;
  children: ReactNode;
  /** Sticky actions at the bottom (one primary, the rest soft/text). */
  actions?: ReactNode;
  center?: boolean;
  contentStyle?: ViewStyle;
  scroll?: boolean;
  /** Drawn behind everything (e.g. the lamp-lit room). Default: the session mood's aura, if any. */
  backdrop?: ReactNode;
  /** Actions without the divider and page colour, so the backdrop shows through. */
  bareActions?: boolean;
  testID?: string;
};

export function Screen({
  header,
  children,
  actions,
  center,
  contentStyle,
  scroll = true,
  backdrop,
  bareActions,
  testID,
}: Props) {
  const { c } = useTheme();
  const body = (
    <View
      style={[
        { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
        center && { flexGrow: 1, justifyContent: 'center' },
        contentStyle,
      ]}
    >
      {/* Keyed by the child's place in the screen (toArray counts empty slots), not its index
          among the shown ones: a section appearing or going (e.g. a reader-language
          translation) must not remount and re-animate everything after it. */}
      {Children.toArray(children).map((child, i) => (
        <Rise key={isValidElement(child) && child.key != null ? child.key : i} index={i}>
          {child}
        </Rise>
      ))}
    </View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top', 'bottom']} testID={testID}>
      {backdrop ?? <MoodAura />}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header}
        {scroll ? (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            {body}
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>{body}</View>
        )}
        {actions ? (
          <TourTarget id={ACTIONS_TARGET}>
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: 8,
                gap: 4,
                borderTopWidth: bareActions ? 0 : 1,
                borderTopColor: c.border,
                backgroundColor: bareActions ? 'transparent' : c.background,
              }}
            >
              {actions}
            </View>
          </TourTarget>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
