// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'android/*', 'ios/*', '.expo/*'] },
  { files: ['**/*.test.js'], languageOptions: { globals: globals.jest } },
  {
    // Alert nativo é cinza e difícil de fechar: use avisar()/abrirMenu() de '@/ui/dialogo'.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/app/(abas)/index.tsx', 'src/componentes/FichaMapa.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='Alert'][property.name='alert']",
          message: "Não use Alert.alert. Use avisar() ou abrirMenu() de '@/ui/dialogo'.",
        },
        {
          selector: "ImportSpecifier[imported.name='Alert'][parent.source.value='react-native']",
          message: "Não importe Alert. Use avisar() ou abrirMenu() de '@/ui/dialogo'.",
        },
      ],
    },
  },
  { files: ['plugins/**/*.js'], languageOptions: { globals: globals.node } },
]);
