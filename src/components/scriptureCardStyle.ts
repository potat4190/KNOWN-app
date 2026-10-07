/**
 * How YouVersion's text view looks inside the Scripture card. On the web the SDK renders into
 * KNOWN's own page, so a <style> scoped to the card does it; on phones each text view is a
 * WebView, so the same rules are injected into it.
 *
 * - Section headings are hidden. They are the publisher's headings, not Scripture; the bundled
 *   text never shows them; and the API garbles some of them when a passage starts at verse 1
 *   (BSB Psalm 13:1 comes back with the heading "?"). The reader ("Open in YouVersion") keeps them.
 * - A psalm title that carries the verse-1 number (BSB: "¹For the choirmaster…", then "How long,
 *   O LORD?" unnumbered) gives the number to the psalm's first line, as printed Bibles and the
 *   bundled text number it. Versions whose titles have no number (JA1955, CSBS, SAT) are untouched.
 * - (Translator notes are off on the card: PageCard passes renderNotes={false}.)
 * - Text and verse numbers take the theme's colours (the mood's ink for numbers, like the bundled card).
 */
import { useLayoutEffect, useMemo } from 'react';
import { Platform } from 'react-native';

type CardColors = { text: string; lampInk: string };

export function scriptureCardCss(scope: string, c: CardColors): string {
  return [
    `${scope} [data-yv-sdk]{--yv-foreground:${c.text};--yv-card-foreground:${c.text};--yv-muted-foreground:${c.lampInk};}`,
    `${scope} .yv-h{display:none !important;}`,
    `${scope} .d .yv-vlbl{display:none !important;}`,
    `${scope} .d:has(.yv-vlbl) + *::before{content:"1";color:var(--yv-muted-foreground);` +
      `font-family:var(--yv-font-sans);font-size:.65em;line-height:1em;position:relative;top:-.2em;` +
      `margin-inline-end:.3em;white-space:nowrap;}`,
  ].join('\n');
}

/**
 * Web: keeps a <style> for the card with id `scopeId` (the card's nativeID) while it is mounted.
 * Phone: returns the `dom` props that inject the same rules into each text view's WebView.
 */
export function useScriptureCardStyle(scopeId: string, c: CardColors) {
  const web = Platform.OS === 'web';
  const css = scriptureCardCss(web ? `#${scopeId}` : ':root', c);
  // Before paint, so the card never shows a frame of headings or the wrong colours.
  useLayoutEffect(() => {
    if (!web || typeof document === 'undefined') return;
    const el = document.createElement('style');
    el.setAttribute('data-known-card-style', scopeId);
    el.textContent = css;
    document.head.appendChild(el);
    return () => el.remove();
  }, [web, scopeId, css]);
  return useMemo(() => (web ? undefined : nativeCardDom(css)), [web, css]);
}

/**
 * Phone: the WebView gets the rules before its content loads (no flash of headings), and again
 * after load in case the page replaced its head. One <style> with a fixed id, replaced, never stacked.
 */
export function nativeCardDom(css: string) {
  const js =
    `(function(){var id='known-card-style';var s=document.getElementById(id);` +
    `if(!s){s=document.createElement('style');s.id=id;(document.head||document.documentElement).appendChild(s);}` +
    `s.textContent=${JSON.stringify(css)};})();true;`;
  return { injectedJavaScriptBeforeContentLoaded: js, injectedJavaScript: js };
}
