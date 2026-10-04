/**
 * Bottom sheet (brief 5.3): grabber, title, content. Glides up (instant under
 * Reduce Motion). `locked` = non-dismissible (the Recover sheet).
 */
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
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
  const ref = useRef<BottomSheetModal>(null);
  const { c, radius, reduceMotion } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const maxH = Math.round(height * 0.88);
  // Only dismiss a sheet that was presented, and only report a close while it is meant to be
  // open: dismissing a never-presented modal still fires onDismiss, which would otherwise close
  // whichever other sheet is open (they share one UI state).
  const presented = useRef(false);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
    if (open && !presented.current) {
      presented.current = true;
      ref.current?.present();
    } else if (!open && presented.current) {
      ref.current?.dismiss();
    }
  }, [open]);
  const backdrop = useCallback(
    (p: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...p}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior={locked ? 'none' : 'close'}
        opacity={0.45}
      />
    ),
    [locked],
  );
  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={() => {
        presented.current = false;
        if (openRef.current) onClose(); // she swiped it down or tapped the backdrop
      }}
      enablePanDownToClose={!locked}
      enableDynamicSizing
      maxDynamicContentSize={maxH}
      backdropComponent={backdrop}
      animateOnMount={!reduceMotion}
      backgroundStyle={{
        backgroundColor: c.elevated,
        borderTopLeftRadius: radius.sheet,
        borderTopRightRadius: radius.sheet,
      }}
      handleIndicatorStyle={{ backgroundColor: c.border, width: 40 }}
      accessibilityViewIsModal={open}
    >
      {/* A measured view (dynamic sizing needs one) with a capped scroll inside for long sheets. */}
      <BottomSheetView testID={testID}>
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
      </BottomSheetView>
    </BottomSheetModal>
  );
}
