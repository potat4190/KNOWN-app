/**
 * "Open in YouVersion": the YouVersion SDK's BibleReader at the passage's
 * chapter, in exactly the version the card showed (the label matches what opens).
 */
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BibleReader } from '@youversion/platform-react-native-expo-ui';
import { Header } from '@/components/Header';
import { useTheme } from '@/theme';
import { BOOKS, PASSAGES, isPathKey } from '@/lib/content';
import { withSessionMood } from '@/features/mood/SessionMood';

function Reader() {
  const { path, versionId } = useLocalSearchParams<{ path: string; versionId: string }>();
  const { c, scheme } = useTheme();
  if (!isPathKey(path) || !versionId) return null;
  const p = PASSAGES[path];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} testID="screen-reader">
      <Header onBack={() => router.back()} hideGear />
      <View style={{ flex: 1 }}>
        <BibleReader
          theme={scheme}
          defaultBook={BOOKS[p.book].usfm}
          defaultChapter={String(p.ch)}
          versionId={Number(versionId)}
          backgroundColor={c.background}
          foregroundColor={c.text}
        />
      </View>
    </SafeAreaView>
  );
}

export default withSessionMood(Reader);
