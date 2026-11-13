import { distanciaKm, type Coordenada } from '@/navegacao/destinos';

import type { NomeIcone } from '@/ui/icones';

export type TipoAjuda =
  'acidente' | 'pane' | 'pneu' | 'combustivel' | 'perdido' | 'saude' | 'bateria' | 'outro';

/** Tipos de pedido de ajuda (máx. 8). `urgente` destaca o 192/193. */
export const tiposAjuda: { id: TipoAjuda; icone: NomeIcone; urgente: boolean }[] = [
  { id: 'acidente', icone: 'alerta', urgente: true },
  { id: 'saude', icone: 'hospital', urgente: true },
  { id: 'pane', icone: 'oficina', urgente: false },
  { id: 'pneu', icone: 'pneu', urgente: false },
  { id: 'combustivel', icone: 'posto', urgente: false },
  { id: 'perdido', icone: 'navegar', urgente: false },
  { id: 'bateria', icone: 'bateria', urgente: false },
  { id: 'outro', icone: 'comentario', urgente: false },
];

export const MAX_MENSAGEM_AJUDA = 200;

export const ehUrgente = (tipo: TipoAjuda | null) =>
  !!tipo && tiposAjuda.some((x) => x.id === tipo && x.urgente);

/** Hora e data no idioma do app, com rótulo ("Enviado às 20:33 de 13/11"). */
export function horaDataRotulada(
  agora: Date,
  idioma: string,
  modelo: (hora: string, data: string) => string,
) {
  const hora = agora.toLocaleTimeString(idioma, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const data = agora.toLocaleDateString(idioma, { day: '2-digit', month: '2-digit' });
  return modelo(hora, data);
}

/**
 * Texto do pedido de ajuda para o WhatsApp: quem, o que houve, mensagem opcional, onde (link do mapa),
 * hora rotulada e, se houver, a ficha de emergência. Nunca inclui dados maçônicos.
 */
export function mensagemSOS(o: {
  nome: string;
  apelido?: string;
  tipo?: string | null;
  mensagem?: string;
  posicao: Coordenada | null;
  agora: Date;
  idioma?: string;
  ficha?: { sangue?: string; alergias?: string; remedios?: string; plano?: string } | null;
  textos: {
    titulo: string;
    quem: string;
    oQueHouve: string;
    onde: string;
    enviadoAs: (hora: string, data: string) => string;
    semPosicao: string;
    sangue: string;
    alergias: string;
    remedios: string;
    plano: string;
    rodape: string;
  };
}): string {
  const onde = o.posicao
    ? `https://maps.google.com/?q=${o.posicao.lat.toFixed(5)},${o.posicao.lng.toFixed(5)}`
    : o.textos.semPosicao;
  const f = o.ficha ?? {};
  const apelido = o.apelido?.trim();
  const livre = o.mensagem?.trim().slice(0, MAX_MENSAGEM_AJUDA);
  const linhas = [
    o.textos.titulo,
    `${o.textos.quem}: ${o.nome}${apelido ? ` (${apelido})` : ''}`,
    o.tipo && `${o.textos.oQueHouve}: ${o.tipo}`,
    livre,
    `${o.textos.onde}: ${onde}`,
    horaDataRotulada(o.agora, o.idioma ?? 'pt-BR', o.textos.enviadoAs),
    f.sangue && `${o.textos.sangue}: ${f.sangue}`,
    f.alergias && `${o.textos.alergias}: ${f.alergias}`,
    f.remedios && `${o.textos.remedios}: ${f.remedios}`,
    f.plano && `${o.textos.plano}: ${f.plano}`,
    o.textos.rodape,
  ];
  return linhas.filter(Boolean).join('\n');
}

/**
 * Odômetro pelo GPS (para a manutenção): soma a distância entre leituras boas.
 * Antifraude da especificação: descarta leitura imprecisa (> 50 m) e saltos acima de 200 km/h.
 */
export type Leitura = { lat: number; lng: number; precisao: number | null; tempo: number };

export function somarTrecho(anterior: Leitura | null, atual: Leitura): { km: number; valida: boolean } {
  if (atual.precisao != null && atual.precisao > 50) return { km: 0, valida: false };
  if (!anterior) return { km: 0, valida: true };
  const km = distanciaKm(anterior, atual);
  const horas = (atual.tempo - anterior.tempo) / 3_600_000;
  if (horas <= 0) return { km: 0, valida: false };
  if (km / horas > 200) return { km: 0, valida: false };
  if (km < 0.005) return { km: 0, valida: true }; // parado (ruído do GPS)
  return { km, valida: true };
}
