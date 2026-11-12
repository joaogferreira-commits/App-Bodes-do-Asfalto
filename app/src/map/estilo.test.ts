import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';

import { contraste, cores } from '@/theme';

import estilo from './estilo-bodes.json';

type Camada = { id: string; paint: Record<string, unknown>; filter?: unknown };
const camada = (id: string) => estilo.layers.find((l) => l.id === id) as unknown as Camada;

describe('estilo do mapa (Interface v2)', () => {
  it('é um estilo MapLibre válido', () => {
    expect(validateStyleMin(estilo as never)).toEqual([]);
  });

  it('usa os dados do OpenFreeMap com atribuição ao OpenStreetMap', () => {
    expect(estilo.sources.openmaptiles.url).toContain('openfreemap.org');
    expect(estilo.sources.openmaptiles.attribution).toContain('OpenStreetMap');
  });

  it('asfalto em creme contínuo', () => {
    expect(camada('rodovias').paint['line-color']).toBe(cores.asfalto);
    expect(camada('rodovias').paint['line-dasharray']).toBeUndefined();
  });

  it('terra em tracejado ocre sobre marrom, separada do asfalto pelo campo surface', () => {
    expect(camada('terra').paint['line-color']).toBe(cores.terra);
    expect(camada('terra').paint['line-dasharray']).toBeDefined();
    expect(camada('terra-base').paint['line-color']).toBe(cores.terraEscura);
    expect(JSON.stringify(camada('terra').filter)).toContain('unpaved');
    expect(JSON.stringify(camada('rodovias').filter)).toContain('unpaved');
  });

  it('terra e asfalto bem diferentes em claridade', () => {
    expect(contraste(cores.asfalto, cores.terra)).toBeGreaterThanOrEqual(2);
  });
});
