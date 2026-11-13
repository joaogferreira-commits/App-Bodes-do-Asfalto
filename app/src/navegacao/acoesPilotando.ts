import type { LugarExemplo } from '@/dados/exemplos';
import type { Area } from '@/servidor/pontos';

import { distanciaKm, type Coordenada } from './destinos';
import { postoMaisProximo, postoNaRota, RAIO_POSTO_KM, type PostoEscolhido } from './postos';

/** Caixa de busca: ~15 km em volta (modo próximo) ou o trecho da rota nos próximos ~60 km. */
export function areaDeBusca(atual: Coordenada, rota?: Coordenada[] | null): Area {
  const grau = RAIO_POSTO_KM / 110;
  let pontos: Coordenada[] = [atual];
  let folga = grau;
  if (rota && rota.length > 1) {
    const perto = rota.filter((p) => distanciaKm(atual, p) <= 60);
    if (perto.length) pontos = [atual, ...perto];
    folga = 0.03;
  }
  const folgaLng = folga / Math.max(0.2, Math.cos((atual.lat * Math.PI) / 180));
  return {
    minLat: Math.min(...pontos.map((p) => p.lat)) - folga,
    maxLat: Math.max(...pontos.map((p) => p.lat)) + folga,
    minLon: Math.min(...pontos.map((p) => p.lng)) - folgaLng,
    maxLon: Math.max(...pontos.map((p) => p.lng)) + folgaLng,
  };
}

/**
 * Escolhe o posto: 'proximo' = mais perto em linha reta (até 15 km); 'rota' = à frente na rota com
 * menor desvio (até 1,5 km), ou o mais próximo se não houver rota ativa.
 */
export async function escolherPosto(
  modo: 'proximo' | 'rota',
  atual: Coordenada,
  rota: Coordenada[] | null | undefined,
  carregar: (area: Area) => Promise<LugarExemplo[]>,
): Promise<PostoEscolhido | null> {
  const naRota = modo === 'rota' && !!rota && rota.length > 1;
  const postos = await carregar(areaDeBusca(atual, naRota ? rota : null));
  return naRota ? postoNaRota(rota, atual, postos) : postoMaisProximo(atual, postos);
}
