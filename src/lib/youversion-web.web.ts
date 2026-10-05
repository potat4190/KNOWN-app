/**
 * WEB ONLY. The YouVersion SDK's components are made for phone WebViews ('use dom'). In a
 * browser they render inside KNOWN's own page, where two of their WebView set-ups break it:
 *
 * 1. The SDK replaces `fetch` so that Bible requests go to the phone side (its content cache,
 *    SDK ADR 0020). A browser has no phone side: the request comes back into the same wrapper
 *    and never reaches the network ("Native Bible content request failed"), the Scripture card
 *    says "We couldn't load this Bible passage", and KNOWN's own preflight is caught by it too.
 *    api.youversion.com accepts requests from any origin, so the page keeps the browser's fetch.
 * 2. Each Bible text view renders `html, body, #root { height: auto }` so that a WebView can
 *    measure its content. In the page it collapses KNOWN's full-height layout (the Scripture
 *    screen goes blank), so the page height is pinned back.
 *
 * index.ts loads this module before anything imports the SDK, so it holds the browser's fetch
 * as it was when the page loaded; app/_layout.tsx calls keepYouVersionInPage() once the SDK
 * has loaded and before any of its components render.
 */
const browserFetch: typeof fetch | null = typeof globalThis.fetch === 'function' ? globalThis.fetch : null;

const PAGE_HEIGHT_STYLE_ID = 'known-page-height';

export function keepYouVersionInPage() {
  if (browserFetch && globalThis.fetch !== browserFetch) globalThis.fetch = browserFetch;
  if (typeof document === 'undefined' || document.getElementById(PAGE_HEIGHT_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = PAGE_HEIGHT_STYLE_ID;
  style.textContent = 'html, body, #root { height: 100% !important; }';
  document.head.appendChild(style);
}
