/**
 * WEB ONLY. On a wide browser window the app sits in a centred phone-width column, so it looks
 * like the phone app instead of stretching across the screen (team decision 2026-10-04). On a
 * phone's browser or a narrow window the column is simply the whole window.
 */
import { useEffect, type ReactNode } from 'react';
import { View, useWindowDimensions, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { moodColors } from '@/theme/moods';
import { useShownMood } from '@/features/mood/SessionMood';
import { WEB_COLUMN } from '@/config/web-layout';

export function AppFrame({ children }: { children: ReactNode }) {
  const { c: house, scheme } = useTheme();
  // Beside the column, the page wears the mood of the session screen in it (Scripture to Done).
  const mood = useShownMood();
  const c = mood ? moodColors(house, mood, scheme) : house;
  const { width } = useWindowDimensions();
  // Scrollbars and form controls follow Light/Dark (a light scrollbar on the night palette otherwise).
  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.style.colorScheme = scheme;
  }, [scheme]);
  // A hairline either side on wide windows; boxShadow keeps the column's width exact.
  const edge = width > WEB_COLUMN ? ({ boxShadow: `0 0 0 1px ${c.border}` } as unknown as ViewStyle) : null;
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: c.background }}>
      <View style={[{ flex: 1, width: '100%', maxWidth: WEB_COLUMN, backgroundColor: c.background }, edge]}>
        {children}
      </View>
    </View>
  );
}

/** The width the app lays out in: the column on wide windows, else the window. */
export function useFrameWidth() {
  return Math.min(useWindowDimensions().width, WEB_COLUMN);
}
