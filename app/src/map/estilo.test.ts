import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';

import { contraste, paletaNoite, paletaSol, type Paleta } from '@/theme';

import noite from './estilo-bodes.json';
import sol from './estilo-bodes-sol.json';
import { camadasDaRota } from './estilos';

type Camada = { id: string; paint: Record<string, unknown>; filter?: unknown };
type Estilo = typeof noite;

const camada = (e: Estilo, id: string) => e.layers.find((l) => l.id === id) as unknown as Camada;
const indice = (e: Estilo, id: string) => e.layers.findIndex((l) => l.id === id);
/** Largura no maior zoom de uma expressão interpolate. */
const larguraMax = (expr: unknown) => {
  const a = expr as number[];
  return a[a.length - 1]!;
};

describe.each([
  ['noite', noite as Estilo, paletaNoite],
  ['sol', sol as unknown as Estilo, paletaSol],
])('estilo do mapa (%s)', (_nome, e, c: Paleta) => {
  it('é um estilo MapLibre válido', () => {
    expect(validateStyleMin(e as never)).toEqual([]);
  });

  it('usa o OpenFreeMap com atribuição ao OpenStreetMap', () => {
    expect(e.sources.openmaptiles.url).toContain('openfreemap.org');
    expect(e.sources.openmaptiles.attribution).toContain('OpenStreetMap');
  });

  it('cores iguais às do tema do app', () => {
    expect(camada(e, 'rodovias').paint['line-color']).toBe(c.asfalto);
    expect(camada(e, 'terra').paint['line-color']).toBe(c.terra);
    expect(camada(e, 'terra-base').paint['line-color']).toBe(c.terraEscura);
    expect(camada(e, 'locais').paint['line-color']).toBe(c.viaLocal);
    expect(camada(e, 'fundo').paint['background-color']).toBe(c.chao);
  });

  it('asfalto contínuo; terra tracejada [2, 1.5] com ~60 % da largura do leito (R35)', () => {
    expect(camada(e, 'rodovias').paint['line-dasharray']).toBeUndefined();
    expect(camada(e, 'terra').paint['line-dasharray']).toEqual([2, 1.5]);
    const razao =
      larguraMax(camada(e, 'terra').paint['line-width']) /
      larguraMax(camada(e, 'terra-base').paint['line-width']);
    expect(razao).toBeGreaterThanOrEqual(0.55);
    expect(razao).toBeLessThanOrEqual(0.65);
  });

  it('terra separada pelo campo surface e desenhada abaixo do asfalto', () => {
    expect(JSON.stringify(camada(e, 'terra').filter)).toContain('unpaved');
    expect(JSON.stringify(camada(e, 'rodovias').filter)).toContain('unpaved');
    expect(indice(e, 'terra')).toBeLessThan(indice(e, 'secundarias'));
    expect(indice(e, 'terra')).toBeLessThan(indice(e, 'rodovias'));
  });

  it('trilhas (class=track) com tracejado próprio (R36)', () => {
    expect(JSON.stringify(camada(e, 'trilhas').filter)).toContain('track');
    expect(camada(e, 'trilhas').paint['line-dasharray']).toEqual([2.5, 1.5, 1, 1.5]);
  });

  it('vias locais e terra visíveis sobre o chão (≥ 3:1, R39)', () => {
    expect(contraste(c.viaLocal, c.chao)).toBeGreaterThanOrEqual(3);
    expect(contraste(c.terra, c.chao)).toBeGreaterThanOrEqual(3);
  });

  it('rota ≥ 1,6× a rodovia, com contorno de 2 px por lado e pesponto na terra (R38)', () => {
    const r = camadasDaRota(c);
    const rodovia = larguraMax(camada(e, 'rodovias').paint['line-width']);
    expect(larguraMax(r.linha['line-width'])).toBeGreaterThanOrEqual(1.6 * rodovia - 0.01);
    expect(larguraMax(r.contorno['line-width']) - larguraMax(r.linha['line-width'])).toBeCloseTo(4);
    expect(r.terra['line-dasharray']).toEqual([1, 2]);
    expect(contraste(r.linha['line-color'], r.contorno['line-color'])).toBeGreaterThanOrEqual(3);
  });
});

describe('nomes de ruas', () => {
  it.each([
    ['noite', noite as Estilo],
    ['sol', sol as unknown as Estilo],
  ])('o estilo %s mostra o nome das ruas a partir do zoom 13', (_n, e) => {
    const ruas = e.layers.find((l) => l.id === 'rotulos-ruas') as unknown as {
      minzoom: number;
      filter: unknown;
      layout: Record<string, unknown>;
    };
    expect(ruas.minzoom).toBe(13);
    expect(JSON.stringify(ruas.filter)).toContain('minor');
    expect(ruas.layout['text-field']).toEqual(['get', 'name']);
  });
});
