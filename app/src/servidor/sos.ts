import { supabase } from './supabase';

/**
 * SOS real (P10). Tabela sos_ativos e funções iniciar_sos / atualizar_posicao_sos / encerrar_sos vêm da
 * migration pendente. O servidor avisa por push o grupo do passeio/comboio de hoje e a diretoria; a posição
 * exata só existe nessa tabela enquanto o SOS está ativo. Qualquer falha devolve null/false: o fluxo do
 * WhatsApp continua valendo como reserva.
 */
export const INTERVALO_SOS_MS = 30_000;

export type PosicaoSos = { lat: number; lng: number };

export type SosAtivo = {
  id: string;
  quem: string;
  tipo: string | null;
  mensagem: string;
  telefone: string | null;
  posicao: PosicaoSos;
  atualizadoEm: string;
  encerrado: boolean;
};

type LinhaSos = {
  id: string;
  tipo: string | null;
  mensagem: string | null;
  telefone: string | null;
  lat: number;
  lng: number;
  atualizado_em: string;
  encerrado_em: string | null;
  perfis: { nome: string; apelido: string | null } | { nome: string; apelido: string | null }[] | null;
};

const um = <T>(v: T | T[] | null | undefined): T | undefined => (Array.isArray(v) ? v[0] : (v ?? undefined));

/** Inicia o SOS no servidor e devolve o id (null se não deu). */
export async function iniciarSosServidor(o: {
  tipo: string | null;
  mensagem?: string;
  posicao: PosicaoSos;
}): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('iniciar_sos', {
      p_tipo: o.tipo ?? '',
      p_mensagem: o.mensagem ?? '',
      p_lat: o.posicao.lat,
      p_lng: o.posicao.lng,
    });
    return error || typeof data !== 'string' ? null : data;
  } catch {
    return null;
  }
}

/** Atualiza a posição exata. Devolve false se o SOS não está mais ativo (encerrado ou vencido) ou falhou. */
export async function atualizarPosicaoSos(id: string, posicao: PosicaoSos): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.rpc('atualizar_posicao_sos', {
      p_id: id,
      p_lat: posicao.lat,
      p_lng: posicao.lng,
    });
    return !error && data === true;
  } catch {
    return false;
  }
}

export async function encerrarSosServidor(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.rpc('encerrar_sos', { p_id: id });
    return !error && data === true;
  } catch {
    return false;
  }
}

/** Lê um SOS (a RLS só deixa quem deve receber). null se não existe ou não pode ver. */
export async function lerSos(id: string): Promise<SosAtivo | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('sos_ativos')
      .select(
        'id, tipo, mensagem, telefone, lat, lng, atualizado_em, encerrado_em, perfis!usuario_id(nome, apelido)',
      )
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    const l = data as unknown as LinhaSos;
    const p = um(l.perfis);
    return {
      id: l.id,
      quem: p?.apelido?.trim() || p?.nome || '',
      tipo: l.tipo,
      mensagem: l.mensagem ?? '',
      telefone: l.telefone,
      posicao: { lat: l.lat, lng: l.lng },
      atualizadoEm: l.atualizado_em,
      encerrado: l.encerrado_em != null,
    };
  } catch {
    return null;
  }
}

/** Link do Google Maps com a rota até o irmão (abre o navegador/app de mapas do aparelho). */
export function linkRotaAte(p: PosicaoSos): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat.toFixed(6)},${p.lng.toFixed(6)}&travelmode=driving`;
}

/** Só dígitos (e +) para o discador. */
export function linkLigar(telefone: string): string {
  return `tel:${telefone.replace(/[^\d+]/g, '')}`;
}
