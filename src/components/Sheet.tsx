/**
 * Bottom sheet (brief 5.3): grabber, title, content. Glides up (instant under
 * Reduce Motion). `locked` = non-dismissible (the Recover sheet).
 */
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
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
  useEffect(() => {
    if (open) ref.current?.present();
    else ref.current?.dismiss();
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
      onDismiss={onClose}
      enablePanDownToClose={!locked}
      enableDynamicSizing
      maxDynamicContentSize={undefined}
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
      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20, gap: 14 }}
        testID={testID}
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
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
