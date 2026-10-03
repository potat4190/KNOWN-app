/**
 * Judge panel (modal). Always English, always left-to-right, never translated.
 * Demo controls for the hackathon judges; not part of the student's app.
 */
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, type TextStyle } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePrefs } from '@/state/prefs';
import { useUi } from '@/state/ui';
import { useSession, cleanupPaused, daysLeft } from '@/state/session-store';
import { now } from '@/state/clock';
import { recoverOffered } from '@/state/launch';
import { getStore } from '@/data/store';
import { DAY_MS, PAUSE_TTL_MS } from '@/config/privacy';
import { BIBLE_TRACK } from '@/config/bible-track';
import { BIBLE_VERSIONS } from '@/config/bible-versions';
import { AI_RELAY_URL, VARIANT, YOUVERSION_APP_KEY } from '@/config/flags';
import { MUSIC, type MusicMoment } from '@/config/music';
import { MATRIX, NW, PATHS, ROTATION, ref, SEL_KEYS } from '@/lib/content';
import { LANGS, LANG_INFO } from '@/i18n/langs';
import { peek, type RotationEntry } from '@/services/rotation/rotation';
import { music } from '@/services/music/MusicController';
import { resetTour } from '@/features/tour/TourProvider';
import { EMO, GOLDEN, JUMPS, jump, openSelection } from '@/features/panel/golden';
import overrides from '@/content/overrides.applied.json';

const INK = '#22283A';
const LAMP = '#F2B35E';
const BG = '#FBF8F2';
const MUTED = '#5b6070';

const T = ({ children, style, b }: { children: React.ReactNode; style?: TextStyle; b?: boolean }) => (
  <Text
    style={[
      {
        color: INK,
        fontSize: 14,
        lineHeight: 20,
        writingDirection: 'ltr',
        textAlign: 'left',
        fontWeight: b ? '700' : '400',
      },
      style,
    ]}
  >
    {children}
  </Text>
);

function Btn({ label, onPress, cur, testID }: { label: string; onPress: () => void; cur?: boolean; testID?: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      testID={testID}
      style={{
        minHeight: 40,
        paddingHorizontal: 12,
        justifyContent: 'center',
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: cur ? LAMP : '#d8d2c6',
        backgroundColor: cur ? '#FCEBD0' : '#fff',
      }}
    >
      <T b>{label}</T>
    </Pressable>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View
      style={{ gap: 8, padding: 14, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#ebe5da' }}
    >
      <T b style={{ fontSize: 15 }}>
        {title}
      </T>
      {children}
    </View>
  );
}

const KV = ({ k, v }: { k: string; v: string }) => (
  <View style={{ flexDirection: 'row', gap: 8 }}>
    <T style={{ width: 110, color: MUTED }}>{k}</T>
    <T style={{ flex: 1 }}>{v}</T>
  </View>
);

export default function Panel() {
  const p = usePrefs();
  const s = useSession((x) => x.s);
  const aiLog = useUi((u) => u.aiLog);
  const lastScripture = useUi((u) => u.lastScripture);
  const [days, setDays] = useState('4');
  const [paused, setPaused] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [rot, setRot] = useState<Record<string, RotationEntry>>({});
  const [cleaned, setCleaned] = useState('');

  const refresh = useCallback(async () => {
    const st = getStore();
    setPaused((await st.session.get())?.ts ?? null);
    setCount(await st.moments.count());
    setRot(await st.rotation.getAll());
  }, []);
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );
  useEffect(() => () => music.stop(), []);

  /** Re-run the launch logic after changing the clock. */
  const relaunch = async () => {
    recoverOffered.done = false; // re-run the launch logic
    const removed = await cleanupPaused();
    setCleaned(removed ? 'On reopen, a paused moment older than 3 days was deleted.' : '');
    useSession.getState().end();
    useUi.getState().closeSheet();
    await refresh();
    router.dismissAll?.();
    router.replace('/');
  };
  const ff = () => {
    const d = Math.max(1, Number(days) || 4);
    p.set({ clockOffset: p.clockOffset + d * DAY_MS });
    void relaunch();
  };
  const reset = () => {
    p.set({ clockOffset: 0 });
    void refresh();
  };
  const clear = async () => {
    const st = getStore();
    await st.session.clear();
    await st.rotation.clear(); // so Fear opens Nehemiah first again (demo)
    for (const m of await st.moments.list()) await st.moments.remove(m.id);
    p.set({ clockOffset: 0 });
    void relaunch();
  };

  const age = paused != null ? now() - paused : null;
  const tracks: [string, unknown][] = [
    ...(Object.keys(MUSIC.moments) as MusicMoment[]).map((m) => [`moment ${m}`, MUSIC.moments[m]] as [string, unknown]),
    ...Object.entries(MUSIC.bySelection).flatMap(([k, v]) =>
      Object.entries(v).map(([m, t]) => [`sel ${k} ${m}`, t] as [string, unknown]),
    ),
    ...Object.entries(MUSIC.byPath).flatMap(([k, v]) =>
      Object.entries(v).map(([m, t]) => [`path ${k} ${m}`, t] as [string, unknown]),
    ),
  ];
  const drafted = (overrides as { target: string; status: string; reviewer: string }[]).filter(
    (o) => o.status === 'drafted',
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} testID="screen-panel">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 14,
          borderBottomWidth: 1,
          borderColor: '#ebe5da',
        }}
      >
        <View>
          <T b style={{ fontSize: 18 }}>
            Judge panel
          </T>
          <T style={{ color: MUTED }}>Demo controls. Not part of the student’s app.</T>
        </View>
        <Btn label="Close" onPress={() => router.back()} testID="panel-close" />
      </View>
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
        {p.clockOffset ? (
          <View style={{ backgroundColor: '#FBE9E5', padding: 10, borderRadius: 10 }}>
            <T b style={{ color: '#A63A2A' }}>
              Clock is {Math.round(p.clockOffset / DAY_MS)} days ahead. Reset before presenting.
            </T>
          </View>
        ) : null}

        <Sec title="Golden path">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {GOLDEN.map(([n, label, fn], i) => (
              <Btn key={n} label={`${n} ${label}`} onPress={fn} testID={`golden-${i + 1}`} />
            ))}
          </View>
          <T style={{ color: MUTED }}>
            Step 3 pre-fills “I can’t reach my family anymore, and I’m scared watching the news about my country.” Tap
            Find a story to run the AI live. The stage demo uses pictures (Fear → Nehemiah).
          </T>
        </Sec>

        <Sec title="Clock and privacy">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <TextInput
              value={days}
              onChangeText={setDays}
              keyboardType="number-pad"
              accessibilityLabel="Days to fast-forward"
              style={{
                width: 56,
                minHeight: 40,
                borderWidth: 1.5,
                borderColor: '#d8d2c6',
                borderRadius: 10,
                textAlign: 'center',
                color: INK,
                backgroundColor: '#fff',
              }}
              testID="ff-days"
            />
            <Btn label="Fast-forward and reopen" onPress={ff} testID="panel-ff" />
            <Btn label="Reset clock" onPress={reset} testID="panel-reset" />
            <Btn label="Clear data" onPress={() => void clear()} testID="panel-clear" />
          </View>
          <T b style={{ color: p.clockOffset ? '#A63A2A' : '#2f7a4b' }}>
            {p.clockOffset ? 'Clock offset active' : 'Clock: real time'}
          </T>
          {cleaned ? <T b>{cleaned}</T> : null}
          <T style={{ color: MUTED }}>
            Paused moments are deleted after {Math.round(PAUSE_TTL_MS / DAY_MS)} days. Pause a moment with ✕, then
            fast-forward 4 days to show it delete itself.
          </T>
        </Sec>

        <Sec title="State">
          <KV k="screen" v={s?.screen ?? '–'} />
          <KV k="language" v={LANG_INFO[p.lang ?? 'en'].en} />
          <KV k="pictures" v={s?.pics.map((k) => EMO[k]).join(' + ') || '–'} />
          <KV k="path" v={s?.path ? `${PATHS.en[s.path].name} · ${ref(s.path, 'en')}` : '–'} />
          <KV k="from" v={s?.from ?? '–'} />
          <KV
            k="paused"
            v={
              paused != null && age != null
                ? `yes, ${Math.floor(age / 36e5)} h old, deleted in ${Math.max(0, Math.ceil((PAUSE_TTL_MS - age) / 36e5))} h (${daysLeft(paused)} d shown)`
                : 'none'
            }
          />
          <KV k="moments" v={`${count} saved on this device`} />
          <KV k="storage" v={getStore().encrypted ? 'SQLCipher (encrypted)' : 'memory only'} />
        </Sec>

        <Sec title="AI activity">
          <T style={{ color: MUTED }}>
            {AI_RELAY_URL
              ? `Relay: ${AI_RELAY_URL}`
              : 'No relay URL set: own words use the on-device matcher; Translate is hidden.'}
          </T>
          {aiLog.length ? (
            aiLog.slice(0, 3).map((e, i) => (
              <View key={i} style={{ backgroundColor: '#F6F1E7', padding: 8, borderRadius: 8 }}>
                <T b>
                  [{e.kind}] {e.source} · {e.ms} ms
                </T>
                <T>in: {String(e.input).slice(0, 140)}</T>
                <T>{e.error ? `error: ${e.error}` : `out: ${JSON.stringify(e.output)}`}</T>
              </View>
            ))
          ) : (
            <T style={{ color: MUTED }}>No AI calls yet. Type in “My own words” and tap Find a story.</T>
          )}
        </Sec>

        <Sec title="Emotion matrix (Ekman’s Atlas)">
          {[...SEL_KEYS, 'NW' as const].map((k) => (
            <View
              key={k}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                borderTopWidth: 1,
                borderColor: '#f0ebe1',
                paddingTop: 6,
              }}
            >
              <T b style={{ width: 30 }}>
                {k}
              </T>
              <View style={{ flex: 1 }}>
                <T>
                  {k === 'NW'
                    ? 'No words'
                    : k
                        .split('')
                        .map((x) => EMO[x])
                        .join(' + ')}
                </T>
                <T style={{ color: MUTED }}>
                  {k === 'NW'
                    ? `${PATHS.en[NW].name} · ${ref(NW, 'en')}`
                    : `${PATHS.en[MATRIX[k].path].name} · ${ref(MATRIX[k].path, 'en')} (alt ${PATHS.en[MATRIX[k].alt].name})`}
                </T>
              </View>
              <Btn label="Open" onPress={() => openSelection(k)} testID={`matrix-${k}`} />
            </View>
          ))}
        </Sec>

        <Sec title="Jump to any screen">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {JUMPS.map((j) => (
              <Btn key={j} label={j} onPress={() => jump(j)} cur={s?.screen === j} testID={`jump-${j}`} />
            ))}
          </View>
        </Sec>

        <Sec title="Bible track · five tests">
          {(Object.entries(BIBLE_TRACK) as [string, string][]).map(([k, v]) => (
            <T key={k}>
              <T b>{k[0].toUpperCase() + k.slice(1)}</T>: {v.trim() ? v : 'Not yet recorded'}
            </T>
          ))}
        </Sec>

        <Sec title="YouVersion">
          <KV k="app key" v={YOUVERSION_APP_KEY ? 'present' : 'missing (bundled text only)'} />
          {LANGS.map((l) => (
            <KV
              key={l}
              k={`version ${l}`}
              v={
                BIBLE_VERSIONS[l] ? `${BIBLE_VERSIONS[l]!.abbr} (${BIBLE_VERSIONS[l]!.id})` : 'not chosen yet → bundled'
              }
            />
          ))}
          <KV k="her choice" v={p.yvVersion ? `${p.yvVersion.abbr} (${p.yvVersion.id})` : '–'} />
          <KV k="last source" v={lastScripture?.source ?? '–'} />
          <KV k="last error" v={lastScripture?.error ?? '–'} />
        </Sec>

        <Sec title="Story rotation">
          {SEL_KEYS.map((sel) => (
            <View key={sel} style={{ borderTopWidth: 1, borderColor: '#f0ebe1', paddingTop: 6 }}>
              <T b>
                {sel} · next: {peek(rot[sel], MATRIX[sel].path, ROTATION[sel])}
              </T>
              <T style={{ color: MUTED }}>pool: {ROTATION[sel].join(', ')}</T>
              <T style={{ color: MUTED }}>
                bag: {rot[sel]?.bag.join(', ') || '–'} · last: {rot[sel]?.last ?? '–'} · count: {rot[sel]?.count ?? 0}
              </T>
            </View>
          ))}
          <Btn
            label="Reset rotation"
            onPress={async () => {
              await getStore().rotation.clear();
              void refresh();
            }}
            testID="rotation-reset"
          />
        </Sec>

        <Sec title="Music">
          {tracks.map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <T style={{ flex: 1 }}>
                {k}: {v == null ? 'silence' : typeof v === 'number' ? 'bundled file' : String(v)}
              </T>
              {v != null ? (
                <>
                  <Btn label="Preview" onPress={() => void music.play(v as number | string)} />
                  <Btn label="Stop" onPress={() => music.stop()} />
                </>
              ) : null}
            </View>
          ))}
          <T style={{ color: MUTED }}>Tracks are set in src/config/music.ts (see assets/audio/README.md).</T>
        </Sec>

        <Sec title="Tour">
          <Btn
            label="Reset tips and cards"
            onPress={() => {
              resetTour();
              usePrefs.getState().set({ tourDone: true });
            }}
            testID="tour-reset"
          />
          <T style={{ color: MUTED }}>Tips seen: {Object.keys(p.tipsSeen).join(', ') || 'none'}</T>
        </Sec>

        <Sec title="Content waiting for review">
          {drafted.map((o) => (
            <T key={o.target}>
              {o.target} (drafted, {o.reviewer})
            </T>
          ))}
          <T style={{ color: MUTED }}>Plus the drafted UI strings in src/i18n/drafted.ts (docs/CONTENT_REVIEW.md).</T>
        </Sec>

        <Sec title="Honesty notes">
          <T>
            • Scripture: bundled public-domain text (WEBBE, 和合本, 口語訳, Judson 1835, Van Dyck for Nehemiah 1 and
            Habakkuk 1). YouVersion text appears only when the app key works, a version id is confirmed, and the passage
            loads.
          </T>
          <T>
            • Arabic Scripture exists only for Nehemiah 1 and Habakkuk 1; other passages show English with a note.
            Arabic copy was drafted by AI and needs a native reader.
          </T>
          <T>• Character pictures are AI-generated (docs/ASSETS.md).</T>
          <T>
            • Burmese, Chinese and Japanese copy need native review. Breath-prayer lines are drafted; Deb to confirm.
          </T>
          <T>
            • Lament psalms (13, 56, 61, 62, 139): Chinese and Japanese lines were typed from memory; check every line.
            Burmese shows English for these five.
          </T>
          <T>
            • Help numbers are not yet verified (Kezia). 988 and 911 are US numbers; findahelpline.com covers other
            countries.
          </T>
          <T>• Nothing is saved unless the student chooses to; paused moments are deleted after 3 days.</T>
        </Sec>

        <Sec title="Build">
          <KV k="variant" v={VARIANT} />
          <KV k="version" v={Constants.expoConfig?.version ?? '–'} />
        </Sec>
      </ScrollView>
    </SafeAreaView>
  );
}
