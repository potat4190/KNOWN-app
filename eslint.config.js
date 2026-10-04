// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  prettier,
  {
    ignores: [
      'dist/*',
      'reference/*',
      'src/content/*',
      'android/*',
      'ios/*',
      'relay/node_modules/*',
      'relay/.wrangler/*',
      'coverage/*', '.expo/*',
    ],
  },
  {
    files: ['jest.setup.js', '**/__tests__/**', 'relay/test/**'],
    languageOptions: { globals: { ...globals.jest, ...globals.node } },
    rules: { 'react/display-name': 'off', 'import/first': 'off', '@typescript-eslint/no-require-imports': 'off' },
  },
]);
