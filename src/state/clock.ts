/**
 * The app clock. now() = Date.now() + the test-clock offset, which only the
 * judge panel can set (to fast-forward and show a paused moment delete itself).
 */
import { usePrefs } from './prefs';

export const now = () => Date.now() + (usePrefs.getState().clockOffset || 0);
