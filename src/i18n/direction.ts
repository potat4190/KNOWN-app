/** Reading direction and app reload (phone). See direction.web.ts for the browser. */
import { DevSettings, I18nManager } from 'react-native';
import * as Updates from 'expo-updates';

export const isRTL = () => I18nManager.isRTL;

export function setRTL(rtl: boolean) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(rtl);
}

/** Restart so the new direction applies. Throws if a reload isn't possible. */
export async function reloadApp() {
  if (__DEV__) DevSettings.reload();
  else await Updates.reloadAsync();
}
