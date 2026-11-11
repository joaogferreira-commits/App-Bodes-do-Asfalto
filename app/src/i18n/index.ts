import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import ptBR from './locales/pt-BR.json';

export const idiomas = ['pt-BR', 'es', 'en'] as const;
export type Idioma = (typeof idiomas)[number];

export const recursos = {
  'pt-BR': { translation: ptBR },
  es: { translation: es },
  en: { translation: en },
} as const;

/** Escolhe o idioma do aparelho; português do Brasil é o padrão. */
export function idiomaDoAparelho(codigo: string | null | undefined): Idioma {
  const base = (codigo ?? '').toLowerCase().split('-')[0];
  if (base === 'es') return 'es';
  if (base === 'en') return 'en';
  return 'pt-BR';
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources: recursos,
  lng: idiomaDoAparelho(getLocales()[0]?.languageCode),
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
});

export default i18n;
