/** Mute/unmute background music (Pray, Sit). Shown only when a track is configured for this screen. */
import { Pressable } from 'react-native';
import { useT } from '@/i18n';
import { useTheme } from '@/theme';
import { usePrefs } from '@/state/prefs';
import { Icon } from './Icon';

export function SpeakerButton({ visible }: { visible: boolean }) {
  const on = usePrefs((p) => p.musicOn);
  const set = usePrefs((p) => p.set);
  const { t } = useT();
  const { c, radius } = useTheme();
  if (!visible) return null;
  return (
    <Pressable
      onPress={() => set({ musicOn: !on })}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={on ? t('music_off') : t('music_on')}
      testID="speaker"
      style={{
        width: 44,
        height: 44,
        borderRadius: radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.fillMuted,
        alignSelf: 'flex-end',
      }}
    >
      <Icon name={on ? 'speaker' : 'speakerOff'} color={c.text} size={22} />
    </Pressable>
  );
}
