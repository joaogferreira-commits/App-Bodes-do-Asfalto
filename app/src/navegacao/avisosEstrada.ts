import type { TFunction } from 'i18next';

import type { Coordenada } from './destinos';

/**
 * Avisos de estrada do modo pilotando (P9). Vão ao grupo do comboio/passeio como mensagem de texto com um
 * marcador estruturado (sem mudar o banco). A posição vai arredondada (~1 km): nunca a coordenada exata.
 */
export const TIPOS_ALERTA = ['buraco', 'policia', 'obra', 'animal', 'acidente', 'oleo'] as const;
export type TipoAlerta = (typeof TIPOS_ALERTA)[number];

export type AvisoEstrada =
  | { tipo: 'alerta'; alerta: TipoAlerta; posicao: Coordenada | null }
  | { tipo: 'reagrupar'; posicao: Coordenada | null };

const arredondar = (n: number) => Math.round(n * 100) / 100;
const sufixo = (p: Coordenada | null) => (p ? `@${arredondar(p.lat)},${arredondar(p.lng)}` : '');

export function marcadorAlerta(alerta: TipoAlerta, posicao: Coordenada | null): string {
  return `[[alerta:${alerta}${sufixo(posicao)}]]`;
}

export function marcadorReagrupar(posicao: Coordenada | null): string {
  return `[[reagrupar${sufixo(posicao)}]]`;
}

const padrao = /^\[\[(alerta|reagrupar)(?::([a-z]+))?(?:@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?))?\]\]$/;

/** Lê o marcador de uma mensagem; devolve null para texto comum ou marcador inválido. */
export function lerAviso(texto: string): AvisoEstrada | null {
  const m = padrao.exec(texto.trim());
  if (!m) return null;
  const posicao = m[3] && m[4] ? { lat: Number(m[3]), lng: Number(m[4]) } : null;
  if (m[1] === 'reagrupar') return { tipo: 'reagrupar', posicao };
  if (!TIPOS_ALERTA.includes(m[2] as TipoAlerta)) return null;
  return { tipo: 'alerta', alerta: m[2] as TipoAlerta, posicao };
}

/** Texto para mostrar no chat no lugar do marcador (o resto do texto passa direto). */
export function textoDoAviso(texto: string, t: TFunction): string {
  const a = lerAviso(texto);
  if (!a) return texto;
  return a.tipo === 'reagrupar'
    ? t('pilotando.reagruparMensagem')
    : t('pilotando.alertaMensagem', { tipo: t(`pilotando.alertas.${a.alerta}`) });
}
