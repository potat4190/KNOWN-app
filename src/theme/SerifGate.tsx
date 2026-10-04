/**
 * The YouVersion provider registers its serif (Untitled Serif, or Source Serif 4
 * as the fallback) in the background without holding first paint. Android
 * doesn't re-render text when a font arrives later, so headings and Scripture
 * would stay in the sans face. Wait (briefly) for the serif, then render anyway.
 */
import { useEffect, useState, type ReactNode } from 'react';
import * as Font from 'expo-font';
import { SERIF_FONT } from './fonts';

const MAX_WAIT_MS = 4000;

export function SerifGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(() => Font.isLoaded(SERIF_FONT.regular));
  useEffect(() => {
    if (ready) return;
    const started = Date.now();
    const id = setInterval(() => {
      if (Font.isLoaded(SERIF_FONT.regular) || Date.now() - started > MAX_WAIT_MS) {
        clearInterval(id);
        setReady(true);
      }
    }, 100);
    return () => clearInterval(id);
  }, [ready]);
  return ready ? <>{children}</> : null;
}
