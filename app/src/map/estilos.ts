import type { StyleSpecification } from '@maplibre/maplibre-react-native';

import { useTema, type Paleta } from '@/theme';

import estiloNoiteJson from './estilo-bodes.json';
import estiloSolJson from './estilo-bodes-sol.json';

export const estiloNoite = estiloNoiteJson as unknown as StyleSpecification;
export const estiloSol = estiloSolJson as unknown as StyleSpecification;

/** Estilo do mapa que acompanha o tema (noite ou sol), R41. */
export function useEstiloMapa(): StyleSpecification {
  return useTema().modo === 'sol' ? estiloSol : estiloNoite;
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
