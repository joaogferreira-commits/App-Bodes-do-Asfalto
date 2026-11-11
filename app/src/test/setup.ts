import i18n from '@/i18n';

beforeAll(async () => {
  await i18n.changeLanguage('pt-BR');
});

jest.mock(
  'react-native-safe-area-context',
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react-native-safe-area-context/jest/mock').default,
);
