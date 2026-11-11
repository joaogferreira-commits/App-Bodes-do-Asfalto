import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';

import { cores } from '@/theme';

import estilo from './estilo-bodes.json';

describe('estilo do mapa (DESIGN.md, seção 3)', () => {
  it('é um estilo MapLibre válido', () => {
    expect(validateStyleMin(estilo as never)).toEqual([]);
  });

  it('usa os dados do OpenFreeMap com atribuição ao OpenStreetMap', () => {
    const fonte = estilo.sources.openmaptiles;
    expect(fonte.url).toContain('openfreemap.org');
    expect(fonte.attribution).toContain('OpenStreetMap');
  });

  it('rodovias em creme e demais estradas em caramelo', () => {
    const camada = (id: string) =>
      estilo.layers.find((l) => l.id === id) as { paint: Record<string, unknown> };
    expect(camada('rodovias').paint['line-color']).toBe(cores.creme);
    expect(camada('estradas-menores').paint['line-color']).toBe(cores.caramelo);
  });

  it('fundo terra quente e água azul escura', () => {
    const tintas = JSON.stringify(estilo.layers);
    expect(tintas).toContain('#1A1712');
    expect(tintas).toContain('#22323D');
  });
});
