import { lugaresExemplo } from '@/dados/exemplos';
import { pinos } from '@/ui';

import { agrupamento, imagensPinos, lugaresGeoJSON } from './lugares';

describe('lugares no mapa', () => {
  it('sede nunca agrupa; postos e Lojas agrupam; Ágape fica de fora (é marcador flutuante)', () => {
    const { agrupaveis, fixos } = lugaresGeoJSON(lugaresExemplo);
    const tipos = (fc: typeof fixos) => fc.features.map((f) => f.properties.tipo);
    expect(tipos(fixos)).toContain('sede');
    expect(tipos(agrupaveis)).toContain('posto');
    expect(tipos(agrupaveis)).not.toContain('sede');
    expect([...tipos(fixos), ...tipos(agrupaveis)]).not.toContain('agape');
  });

  it('agrupa com raio 50 até o zoom 13 (R44)', () => {
    expect(agrupamento).toEqual({ cluster: true, clusterRadius: 50, clusterMaxZoom: 13 });
  });

  it('tem imagem para cada tipo de pino', () => {
    expect(Object.keys(imagensPinos)).toHaveLength(Object.keys(pinos).length);
  });
});
