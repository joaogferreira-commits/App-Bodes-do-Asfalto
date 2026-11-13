import { lugaresExemplo } from '@/dados/exemplos';
import { pinos } from '@/ui';

import type { LugarExemplo } from '@/dados/exemplos';
import {
  agrupamento,
  escolherEmblemas,
  LIMITE_EMBLEMAS,
  tamanhoAvatarNoMapa,
  ZOOM_EMBLEMA_LUGARES,
  imagensPinos,
  lugaresGeoJSON,
  tamanhoPino,
  ZOOM_EMBLEMA,
} from './lugares';

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

  it('de longe vira ponto; o emblema só aparece de perto e não fica gigante', () => {
    expect(ZOOM_EMBLEMA).toBeGreaterThanOrEqual(9);
    const tamanhos = tamanhoPino.filter((_, i) => i >= 4 && i % 2 === 0) as number[];
    expect(Math.max(...tamanhos)).toBeLessThanOrEqual(0.2);
  });

  it('lugares comuns viram emblema só do zoom 14; no máximo ~20 por área, os de maior prioridade', () => {
    expect(ZOOM_EMBLEMA_LUGARES).toBe(14);
    const muitos: LugarExemplo[] = Array.from({ length: 40 }, (_, i) => ({
      id: `p${i}`,
      tipo: i === 39 ? 'hospital' : 'cachoeira',
      nome: `P${i}`,
      lng: -56 + i * 0.001,
      lat: -15.5,
    }));
    const area = { minLon: -56.1, minLat: -15.6, maxLon: -55.9, maxLat: -15.4 };
    const e = escolherEmblemas(muitos, area);
    expect(e).toHaveLength(LIMITE_EMBLEMAS);
    expect(e[0]!.tipo).toBe('hospital');
    expect(escolherEmblemas(muitos, { ...area, minLon: -50, maxLon: -49 })).toHaveLength(0);
    expect(lugaresGeoJSON(muitos, { area }).agrupaveis.features).toHaveLength(40);
    expect(lugaresGeoJSON(muitos, { area }).emblemas.features).toHaveLength(LIMITE_EMBLEMAS);
  });

  it('avatar dos irmãos: 36 px abaixo do zoom 12, 44 px acima', () => {
    expect(tamanhoAvatarNoMapa(11)).toBe(36);
    expect(tamanhoAvatarNoMapa(12)).toBe(44);
  });
});
