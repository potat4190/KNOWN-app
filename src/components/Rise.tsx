/** A screen section rising in on entry (off under Reduce Motion). See Rise.web.tsx for the browser. */
import type { ReactNode } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';

export function Rise({ children, index = 0 }: { children: ReactNode; index?: number }) {
  const { reduceMotion } = useTheme();
  if (reduceMotion) return <>{children}</>;
  return (
    <Animated.View
      entering={FadeInDown.duration(500)
        .delay(index * 40)
        .withInitialValues({ transform: [{ translateY: 10 }] })}
    >
      {children}
    </Animated.View>
  );
}
