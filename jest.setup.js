/* Jest setup: mock native modules and the YouVersion SDK. Unit tests never call the network. */

jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

// YouVersion SDK: real design tokens (read from the SDK's own theme files), stubbed components.
jest.mock('@youversion/platform-react-native-expo-ui', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  const tokens = require(
    require('path').join(__dirname, 'node_modules/@youversion/platform-react-native-expo-ui/build/theme/tokens.js'),
  );
  const stub = (name) => (props) =>
    React.createElement(
      View,
      { testID: name },
      React.createElement(Text, null, `${name} ${props.reference ?? ''} ${props.versionId ?? ''}`),
    );
  return {
    getTokens: tokens.getTokens,
    useTokens: () => tokens.getTokens('light'),
    YouVersionProvider: ({ children }) => children,
    BibleTextView: stub('BibleTextView'),
    BibleReader: stub('BibleReader'),
    BibleCard: stub('BibleCard'),
    BibleVersionPickerSheet: () => null,
  };
});

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
    remove: jest.fn(),
    volume: 0,
    loop: false,
    playing: false,
  })),
  setAudioModeAsync: jest.fn(async () => {}),
}));

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(async () => ({ isConnected: false, isInternetReachable: false })),
}));

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(async () => true) }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(async () => ({})) }));
jest.mock('expo-updates', () => ({ reloadAsync: jest.fn(async () => {}) }));

// No real fetch in unit tests.
global.fetch = jest.fn(async () => {
  throw new Error('network disabled in tests');
});

// MMKV (Nitro native module) → in-memory store per instance id.
jest.mock('react-native-mmkv', () => {
  const stores = new Map();
  const createMMKV = (cfg = {}) => {
    const id = cfg.id || 'mmkv.default';
    if (!stores.has(id)) stores.set(id, new Map());
    const m = stores.get(id);
    return {
      set: (k, v) => m.set(k, v),
      getString: (k) => (typeof m.get(k) === 'string' ? m.get(k) : undefined),
      getBoolean: (k) => (typeof m.get(k) === 'boolean' ? m.get(k) : undefined),
      getNumber: (k) => (typeof m.get(k) === 'number' ? m.get(k) : undefined),
      remove: (k) => m.delete(k),
      contains: (k) => m.has(k),
      getAllKeys: () => [...m.keys()],
      clearAll: () => m.clear(),
    };
  };
  return { createMMKV };
});
