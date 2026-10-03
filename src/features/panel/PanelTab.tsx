/** The small "Judge panel" tab on the screen edge. Off (clean version) = no trace of the panel anywhere. */
import { Pressable, Text } from 'react-native';
import { router, usePathname } from 'expo-router';
import { usePrefs } from '@/state/prefs';
import { SHOW_PANEL_TOGGLE } from '@/config/flags';

export function PanelTab() {
  const on = usePrefs((p) => p.panelOn);
  const offset = usePrefs((p) => p.clockOffset);
  const pathname = usePathname();
  if (!SHOW_PANEL_TOGGLE || !on || pathname === '/panel') return null;
  return (
    <Pressable
      onPress={() => router.push('/panel')}
      accessibilityRole="button"
      accessibilityLabel="Judge panel"
      testID="panel-tab"
      style={{
        position: 'absolute',
        right: 0,
        top: '42%',
        backgroundColor: offset ? '#A63A2A' : '#22283A',
        paddingVertical: 14,
        paddingHorizontal: 6,
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
        minWidth: 32,
        minHeight: 44,
        justifyContent: 'center',
      }}
    >
      {/* Always English and left-to-right (panel only). */}
      <Text style={{ color: '#F2B35E', fontWeight: '700', fontSize: 12, writingDirection: 'ltr' }}>
        {'JUDGE\nPANEL'}
      </Text>
    </Pressable>
  );
}
