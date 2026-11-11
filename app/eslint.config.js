// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'android/*', 'ios/*', '.expo/*'] },
  { files: ['**/*.test.js'], languageOptions: { globals: globals.jest } },
  { files: ['plugins/**/*.js'], languageOptions: { globals: globals.node } },
]);
