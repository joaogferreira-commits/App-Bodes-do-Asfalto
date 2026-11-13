import type { StyleSpecification } from '@maplibre/maplibre-react-native';

import { useTema, type Paleta } from '@/theme';

import estiloNoiteJson from './estilo-bodes.json';
import estiloSolJson from './estilo-bodes-sol.json';

export const estiloNoite = estiloNoiteJson as unknown as StyleSpecification;
export const estiloSol = estiloSolJson as unknown as StyleSpecification;

/** Camadas decorativas (relevo, prédios): somem no modo pilotando para o mapa ficar limpo e leve. */
export const PREFIXO_EXTRAS = 'extra-';

const cacheEstilos = new Map<string, StyleSpecification>();

/**
 * Estilo certo para o momento: sol de dia, noite à noite; pilotando tira as camadas "extra-".
 * Devolve sempre o mesmo objeto para a mesma combinação (o mapa não recarrega o estilo à toa).
 */
export function estiloDoMapa(modo: 'sol' | 'noite', pilotando = false): StyleSpecification {
  const base = modo === 'sol' ? estiloSol : estiloNoite;
  if (!pilotando) return base;
  const chave = `${modo}|p`;
  let e = cacheEstilos.get(chave);
  if (!e) {
    e = {
      ...base,
      layers: base.layers.filter((l) => !l.id.startsWith(PREFIXO_EXTRAS)),
    } as StyleSpecification;
    cacheEstilos.set(chave, e);
  }
  return e;
}

/**
 * Estilo do mapa (R41). `modo` vem do dia/noite automático (null = segue o tema do app);
 * `pilotando` esconde as camadas extras.
 */
export function useEstiloMapa(modo?: 'sol' | 'noite' | null, pilotando = false): StyleSpecification {
  const doTema = useTema().modo;
  return estiloDoMapa(modo ?? doTema, pilotando);
}

/** Largura da rota: 1,6× a rodovia no mesmo zoom (gerada em tools/gerar_estilo_mapa.py), R38. */
const larguraRota = estiloNoiteJson.metadata.larguraRota as [number, number][];

function largura(somar = 0, fator = 1) {
  const expr: unknown[] = ['interpolate', ['exponential', 1.5], ['zoom']];
  for (const [z, w] of larguraRota) expr.push(z, Math.round((w * fator + somar) * 100) / 100);
  return expr;
}

/**
 * Pintura das 3 camadas da rota planejada (R38): contorno escuro de 2 px por lado,
 * linha laranja larga e, nos trechos de terra, pesponto claro [1, 2] no centro.
 */
export function camadasDaRota(c: Paleta) {
  return {
    contorno: { 'line-color': c.contornoRota, 'line-width': largura(4) },
    linha: { 'line-color': c.acao, 'line-width': largura() },
    terra: { 'line-color': c.rotaTerra, 'line-width': largura(0, 0.3), 'line-dasharray': [1, 2] },
  } as const;
}
