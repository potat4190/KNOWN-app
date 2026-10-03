/**
 * Jest: the app (jest-expo preset) and the relay (plain Node).
 * Unit tests never call the network (YouVersion and the relay are mocked).
 */
module.exports = {
  projects: [
    {
      displayName: 'app',
      preset: 'jest-expo',
      setupFiles: ['<rootDir>/jest.setup.js'],
      testPathIgnorePatterns: [
        '/node_modules/',
        '<rootDir>/relay/',
        '<rootDir>/e2e/',
        '<rootDir>/android/',
        '<rootDir>/ios/',
      ],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-svg|@youversion/.*|@gorhom/.*|i18next|react-i18next|zustand|standard-navigation|@rn-primitives/.*)',
      ],
    },
    {
      displayName: 'relay',
      testEnvironment: 'node',
      roots: ['<rootDir>/relay/test'],
      transform: { '^.+\.[jt]sx?$': ['babel-jest', { presets: ['babel-preset-expo'] }] },
    },
  ],
};
