/**
 * The app clock. now() = Date.now() + the test-clock offset, which only the
 * judge panel can set (to fast-forward and show a paused moment delete itself).
 * The offset counts only while the panel is on: off is the clean student
 * version, on real time (Settings also resets the offset when the panel goes off).
 */
import { SHOW_PANEL_TOGGLE } from '@/config/flags';
import { usePrefs } from './prefs';

export const now = () => {
  const { panelOn, clockOffset } = usePrefs.getState();
  return Date.now() + (SHOW_PANEL_TOGGLE && panelOn ? clockOffset || 0 : 0);
};
