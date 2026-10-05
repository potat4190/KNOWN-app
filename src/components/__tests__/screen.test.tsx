import { useEffect } from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme';
import { Screen } from '../Screen';

let mounts = 0;
function Last() {
  useEffect(() => {
    mounts += 1;
  }, []);
  return <Text>last section</Text>;
}

const ui = (show: boolean) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
    <ThemeProvider>
      <Screen>
        <Text>first</Text>
        {show ? <Text>appears and goes</Text> : null}
        <Last />
      </Screen>
    </ThemeProvider>
  </SafeAreaProvider>
);

it('a section appearing or going does not remount the sections after it', () => {
  mounts = 0;
  const r = render(ui(false));
  expect(mounts).toBe(1);
  r.rerender(ui(true));
  r.rerender(ui(false));
  expect(r.getByText('last section')).toBeTruthy();
  expect(mounts).toBe(1);
});
