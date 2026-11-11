import en from './locales/en.json';
import es from './locales/es.json';
import ptBR from './locales/pt-BR.json';
import { idiomaDoAparelho } from '.';

function chaves(obj: object, prefixo = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? chaves(v, `${prefixo}${k}.`) : [`${prefixo}${k}`],
  );
}

describe('traduções', () => {
  const base = chaves(ptBR).sort();

  it.each([
    ['es', es],
    ['en', en],
  ])('%s tem exatamente as mesmas chaves do pt-BR', (_nome, idioma) => {
    expect(chaves(idioma).sort()).toEqual(base);
  });

  it('nenhum texto vazio', () => {
    for (const idioma of [ptBR, es, en]) {
      const valores = JSON.stringify(idioma);
      expect(valores).not.toMatch(/:\s*""/);
    }
  });

  it.each([
    ['pt', 'pt-BR'],
    ['es', 'es'],
    ['en', 'en'],
    ['fr', 'pt-BR'],
    [null, 'pt-BR'],
  ])('idioma do aparelho %s vira %s', (codigo, esperado) => {
    expect(idiomaDoAparelho(codigo)).toBe(esperado);
  });
});
