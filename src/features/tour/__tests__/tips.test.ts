import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { targetOnScreen, withShownSeen } from '@/features/tour/TourProvider';
import { isFixedTarget, registerTarget, unregisterTarget } from '@/features/tour/targets';

describe('coach marks', () => {
  // Content area from y=112 (below the header) to y=700 (top of the actions bar).
  it('draws a tip only when its target is wholly between the header and the actions bar', () => {
    expect(targetOnScreen({ x: 0, y: 200, width: 100, height: 44 }, 0, 112, 700)).toBe(true);
    // Below the fold: the ring would land on the Continue button.
    expect(targetOnScreen({ x: 0, y: 690, width: 100, height: 44 }, 0, 112, 700)).toBe(false);
    expect(targetOnScreen({ x: 0, y: 900, width: 100, height: 44 }, 0, 112, 700)).toBe(false);
    // Scrolled up under the header.
    expect(targetOnScreen({ x: 0, y: 80, width: 100, height: 44 }, 0, 112, 700)).toBe(false);
    // Window coordinates are made relative to the overlay (e.g. a status-bar offset).
    expect(targetOnScreen({ x: 0, y: 724, width: 100, height: 44 }, 100, 112, 700)).toBe(true);
  });

  it('tips on the header ✕ and the actions bar are fixed targets (always on screen)', () => {
    const ref = { current: null };
    registerTarget('test_target', ref, true);
    expect(isFixedTarget('test_target')).toBe(true);
    unregisterTarget('test_target', ref);
    expect(isFixedTarget('test_target')).toBe(false);
    const root = join(__dirname, '../../../..');
    for (const [file, id] of [
      ['src/components/Header.tsx', 'header_x'],
      ['app/session/scripture.tsx', 'scripture_nofit'],
      ['app/session/feel.tsx', 'feel_nowords'],
    ])
      expect(readFileSync(join(root, file), 'utf8')).toContain(`<TourTarget id="${id}" fixed>`);
  });

  it('leaving a screen counts the tips she was shown as seen, without "Got it"', () => {
    expect(withShownSeen({ feel_tabs: true }, new Set(['scripture_full']))).toEqual({
      feel_tabs: true,
      scripture_full: true,
    });
    expect(withShownSeen({}, [])).toEqual({});
  });
});
