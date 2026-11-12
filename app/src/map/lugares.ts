import type { LugarExemplo } from '@/dados/exemplos';
import { pinos, type TipoPino } from '@/ui';

/** GeoJSON dos lugares, separado em "agrupáveis" (postos, Lojas, oficinas…) e "fixos" (sede, SOS, socorro, alerta). */
export function lugaresGeoJSON(lugares: LugarExemplo[]) {
  const feature = (l: LugarExemplo) => ({
    type: 'Feature' as const,
    id: l.id,
    properties: {
      id: l.id,
      tipo: l.tipo,
      nome: l.nome,
      rotulo: l.rotulo ?? '',
      prioridade: pinos[l.tipo].prioridade,
    },
    geometry: { type: 'Point' as const, coordinates: [l.lng, l.lat] },
  });
  const visiveis = lugares.filter((l) => l.tipo !== 'agape');
  return {
    agrupaveis: {
      type: 'FeatureCollection' as const,
      features: visiveis.filter((l) => pinos[l.tipo].agrupa).map(feature),
    },
    fixos: {
      type: 'FeatureCollection' as const,
      features: visiveis.filter((l) => !pinos[l.tipo].agrupa).map(feature),
    },
  };
}

/** Imagens dos emblemas para as camadas de símbolo do mapa ("pino-<tipo>"). */
export const imagensPinos = Object.fromEntries(
  (Object.keys(pinos) as TipoPino[]).map((t) => [`pino-${t}`, pinos[t].imagem]),
) as Record<string, number>;

/**
 * Tamanho do emblema conforme o zoom: pequeno de longe, normal de perto
 * (imagens de 256 px de altura → ~28 px no z10, ~49 px no z16; abaixo do z10 vira ponto).
 */
export const tamanhoPino = ['interpolate', ['linear'], ['zoom'], 10, 0.11, 13, 0.15, 16, 0.19] as const;

/**
 * Abaixo deste zoom o emblema some e o lugar vira um pontinho colorido (pedido do dono em 12/11:
 * "não dá para manter um ícone gigante indefinidamente no mapa").
 */
export const ZOOM_EMBLEMA = 10;

/** Agrupamento (R44): raio 50, até o zoom 13; acima disso cada lugar aparece sozinho. */
export const agrupamento = { cluster: true, clusterRadius: 50, clusterMaxZoom: 13 } as const;

/** Irmãos (avatares) só aparecem do zoom 9 para perto, para não poluir o mapa de longe. */
export const ZOOM_MINIMO_IRMAOS = 9;
