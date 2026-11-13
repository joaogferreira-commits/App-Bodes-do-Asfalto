import type { Agape } from '@/estado/agapes';

import { supabase } from './supabase';

/**
 * Ágape Relâmpago real (P8). Tabelas agapes/presencas_agape vêm da migration pendente: se ainda não existirem
 * (ou qualquer coisa falhar), a lista vem vazia e criar devolve false, sem quebrar o mapa.
 */
export const DURACAO_AGAPE_MIN = 180;

type LinhaAgape = {
  id: string;
  local: string;
  texto: string | null;
  lat: number;
  lng: number;
  comeca_em: string;
  criador: string;
  perfis: { nome: string } | { nome: string }[] | null;
  presencas_agape: { status: string; perfis: { nome: string } | { nome: string }[] | null }[] | null;
};

const um = <T>(v: T | T[] | null | undefined): T | undefined => (Array.isArray(v) ? v[0] : (v ?? undefined));

/** "1h20" / "45 min" para quanto falta (0 se já começou). */
export function textoFalta(min: number): string {
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m} min`;
  return m % 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m / 60}h`;
}

/** Relógio do horário, no estilo do app: "19h30" ou "19h". */
export function textoHorario(d: Date): string {
  return d.getMinutes() ? `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}` : `${d.getHours()}h`;
}

/** Chip do formulário ("30 min", "1 h", "2 h", "19h", "20h30") → instante de início. */
export function inicioDoHorario(horario: string, agora: number = Date.now()): Date {
  // Relativo: "30 min", "1 h" (com espaço). "19h" sem espaço é horário de relógio.
  const rel = /^(\d+)\s*(min)$|^(\d+) (h)$/.exec(horario.trim());
  if (rel) return new Date(agora + Number(rel[1] ?? rel[3]) * (rel[4] === 'h' ? 60 : 1) * 60_000);
  const rel2 = /^(\d{1,2})h(\d{2})?$/.exec(horario.trim());
  if (!rel2) return new Date(agora);
  const d = new Date(agora);
  d.setHours(Number(rel2[1]), Number(rel2[2] ?? 0), 0, 0);
  if (d.getTime() < agora - 30 * 60_000) d.setDate(d.getDate() + 1);
  return d;
}

export function linhaParaAgape(l: LinhaAgape, agora: number = Date.now()): Agape {
  const comeca = new Date(l.comeca_em);
  const vao = (l.presencas_agape ?? [])
    .filter((p) => p.status === 'vou')
    .map((p) => um(p.perfis)?.nome ?? '');
  return {
    id: l.id,
    local: l.local,
    texto: l.texto ?? '',
    lat: l.lat,
    lng: l.lng,
    horario: textoHorario(comeca),
    comecaEm: textoFalta((comeca.getTime() - agora) / 60_000),
    organizador: um(l.perfis)?.nome ?? '',
    vao: vao.filter(Boolean),
  };
}

/** Ágapes ainda não encerrados (a RLS já esconde os vencidos). */
export async function listarAgapes(agora: number = Date.now()): Promise<Agape[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('agapes')
      .select(
        'id, local, texto, lat, lng, comeca_em, criador, perfis!criador(nome), presencas_agape(status, perfis!usuario_id(nome))',
      )
      .gt('termina_em', new Date(agora).toISOString())
      .order('comeca_em', { ascending: true })
      .limit(50);
    if (error || !Array.isArray(data)) return [];
    return (data as unknown as LinhaAgape[]).map((l) => linhaParaAgape(l, agora));
  } catch {
    return [];
  }
}

export type NovoAgape = { local: string; texto: string; horario: string; lat: number; lng: number };

/** Cria o Ágape (o grupo temporário nasce no banco). Devolve false se o banco recusar ou não tiver a tabela. */
export async function criarAgape(a: NovoAgape, agora: number = Date.now()): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data: u } = await supabase.auth.getUser();
    const id = u.user?.id;
    if (!id) return false;
    const { data: perfil } = await supabase.from('perfis').select('capitulo_id').eq('id', id).maybeSingle();
    const comeca = inicioDoHorario(a.horario, agora);
    const { error } = await supabase.from('agapes').insert({
      criador: id,
      capitulo_id: (perfil as { capitulo_id: string | null } | null)?.capitulo_id ?? null,
      local: a.local.trim(),
      texto: a.texto.trim() || null,
      lat: a.lat,
      lng: a.lng,
      comeca_em: comeca.toISOString(),
      termina_em: new Date(comeca.getTime() + DURACAO_AGAPE_MIN * 60_000).toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

/** Vou / Não vou (o grupo do Ágape acompanha por gatilho do banco). */
export async function responderAgape(agapeId: string, vou: boolean): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data: u } = await supabase.auth.getUser();
    const id = u.user?.id;
    if (!id) return false;
    const status = vou ? 'vou' : 'nao_vou';
    const { data, error } = await supabase
      .from('presencas_agape')
      .update({ status })
      .eq('agape_id', agapeId)
      .eq('usuario_id', id)
      .select('agape_id');
    if (error) return false;
    if (Array.isArray(data) && data.length > 0) return true;
    const { error: e2 } = await supabase
      .from('presencas_agape')
      .insert({ agape_id: agapeId, usuario_id: id, status });
    return !e2;
  } catch {
    return false;
  }
}
