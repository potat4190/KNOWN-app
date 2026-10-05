/**
 * WEB ONLY. The same bottom sheet as Sheet.tsx (grabber, title, content,
 * `locked` = can't be dismissed), built on Modal because @gorhom/bottom-sheet
 * doesn't size itself in browsers. Escape and a tap on the backdrop close it,
 * except the Recover sheet.
 */
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { WEB_COLUMN } from '@/config/web-layout';
import { Heading } from './bits';
import { Txt } from './Txt';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  locked?: boolean;
  children: ReactNode;
  testID?: string;
};

export function Sheet({ open, onClose, title, eyebrow, locked, children, testID }: Props) {
  const { c, radius, reduceMotion } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const maxH = Math.round(height * 0.88);
  const dismiss = () => {
    if (!locked) onClose();
  };
  return (
    <Modal visible={open} transparent animationType={reduceMotion ? 'none' : 'slide'} onRequestClose={dismiss}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          onPress={dismiss}
          accessibilityElementsHidden
          style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' }}
        />
        <View
          testID={testID}
          accessibilityViewIsModal
          style={{
            width: '100%',
            maxWidth: WEB_COLUMN,
            alignSelf: 'center',
            maxHeight: maxH,
            backgroundColor: c.elevated,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            paddingTop: 10,
          }}
        >
          <View
            style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: c.border, marginBottom: 12 }}
          />
          <ScrollView
            style={{ maxHeight: maxH - 24 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20, gap: 14 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ gap: 4 }}>
              {eyebrow ? (
                <Txt v="footnote" weight="bold" color={c.lampInk}>
                  {eyebrow}
                </Txt>
              ) : null}
              <Heading level={2}>{title}</Heading>
            </View>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
