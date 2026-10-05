import { now } from '@/state/clock';
import { defaultPrefs, usePrefs } from '@/state/prefs';
import { DAY_MS } from '@/config/privacy';

describe('app clock', () => {
  beforeEach(() => usePrefs.setState({ ...defaultPrefs() }));

  it('runs on real time while the judge panel is off, even with an offset left over', () => {
    usePrefs.setState({ panelOn: false, clockOffset: 4 * DAY_MS });
    expect(Math.abs(now() - Date.now())).toBeLessThan(1000);
  });

  it('applies the fast-forward while the judge panel is on', () => {
    usePrefs.setState({ panelOn: true, clockOffset: 4 * DAY_MS });
    expect(Math.abs(now() - (Date.now() + 4 * DAY_MS))).toBeLessThan(1000);
  });
});
