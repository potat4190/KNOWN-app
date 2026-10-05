/**
 * WEB ONLY. The browser handles right-to-left through <html dir>. "Restart"
 * reloads the page from the app's start, as the phone app restarts.
 */
export const isRTL = () => typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

export function setRTL(rtl: boolean) {
  if (typeof document !== 'undefined') document.documentElement.dir = rtl ? 'rtl' : 'ltr';
}

export async function reloadApp() {
  const base = (process.env.EXPO_BASE_URL ?? '').replace(/\/+$/, '');
  window.location.assign(`${base}/`);
}
