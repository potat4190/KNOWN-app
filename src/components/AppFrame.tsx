/** The app's frame: on phones, the whole screen. See AppFrame.web.tsx for wide browser windows. */
import type { ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';

export function AppFrame({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/** The width the app lays out in (the screen's width on phones). */
export function useFrameWidth() {
  return useWindowDimensions().width;
}
