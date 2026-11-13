import type { LugarExemplo } from '@/dados/exemplos';
import type { Area } from '@/servidor/pontos';
import { pinos, type TipoPino } from '@/ui';

/** GeoJSON dos lugares, separado em "agrupáveis" (postos, Lojas, oficinas…) e "fixos" (sede, SOS, socorro, alerta). */
export function lugaresGeoJSON(
  lugares: LugarExemplo[],
  opcoes: { area?: Area; limiteEmblemas?: number } = {},
) {
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
  const agrup = visiveis.filter((l) => pinos[l.tipo].agrupa);
  return {
    agrupaveis: {
      type: 'FeatureCollection' as const,
      features: agrup.map(feature),
    },
    emblemas: {
      type: 'FeatureCollection' as const,
      features: escolherEmblemas(agrup, opcoes.area, opcoes.limiteEmblemas ?? LIMITE_EMBLEMAS).map(feature),
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

/** De perto (zoom 14 ou mais) os lugares comuns viram emblemas; abaixo disso, pontinhos coloridos de ~10 px. */
export const ZOOM_EMBLEMA_LUGARES = 14;

/** No máximo ~20 emblemas ao mesmo tempo na área visível; o resto continua como pontinho. */
export const LIMITE_EMBLEMAS = 20;

/** Os mais importantes da área visível (prioridade do tipo; empate: mais perto do centro). */
export function escolherEmblemas(lugares: LugarExemplo[], area?: Area, limite = LIMITE_EMBLEMAS) {
  const dentro = area
    ? lugares.filter(
        (l) => l.lng >= area.minLon && l.lng <= area.maxLon && l.lat >= area.minLat && l.lat <= area.maxLat,
      )
    : lugares;
  const cx = area ? (area.minLon + area.maxLon) / 2 : 0;
  const cy = area ? (area.minLat + area.maxLat) / 2 : 0;
  const dist = (l: LugarExemplo) => (l.lng - cx) ** 2 + (l.lat - cy) ** 2;
  return [...dentro]
    .sort((a, b) => pinos[a.tipo].prioridade - pinos[b.tipo].prioridade || dist(a) - dist(b))
    .slice(0, limite);
}

/** Avatar dos irmãos: 36 px de longe (abaixo do zoom 12), 44 px de perto. */
export const tamanhoAvatarNoMapa = (zoom: number) => (zoom < 12 ? 36 : 44);
