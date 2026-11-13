import { montarData } from './passeios';
import { supabase } from './supabase';

/**
 * Eventos de Lojas, Potências, eventos maçônicos e de motoclubes (divulgação gratuita). Qualquer irmão cadastra;
 * a moderação aprova (decidir_evento). Até 3 por dia. Os irmãos veem só os aprovados que ainda não terminaram.
 */
export const TIPOS_EVENTO = ['loja', 'potencia', 'maconico', 'motoclube', 'outro'] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];
export type StatusEvento = 'pendente' | 'aprovado' | 'recusado';

export type DadosEvento = {
  titulo: string;
  descricao: string;
  tipo: TipoEvento;
  inicio: Date;
  fim: Date | null;
  local: string;
  cidade: string;
  lat?: number | null;
  lng?: number | null;
};

export type Evento = {
  id: string;
  titulo: string;
  descricao: string;
  tipo: TipoEvento;
  inicio: string;
  fim: string | null;
  local: string;
  cidade: string;
  lat: number | null;
  lng: number | null;
  status: StatusEvento;
  motivoRecusa: string | null;
  autorId: string;
  autorNome: string;
  meu: boolean;
};

export type EventoPendente = {
  id: string;
  titulo: string;
  tipo: TipoEvento;
  inicio: string;
  fim: string | null;
  local: string;
  cidade: string;
  descricao: string;
  autorNome: string;
};

const COLUNAS =
  'id, autor, titulo, descricao, tipo, inicio, fim, local, cidade, lat, lng, status, motivo_recusa, autor_perfil:perfis!eventos_autor_fkey(nome, apelido)';

type Autor = { nome: string; apelido: string | null };
type Linha = {
  id: string;
  autor: string;
  titulo: string;
  descricao: string | null;
  tipo: TipoEvento;
  inicio: string;
  fim: string | null;
  local: string | null;
  cidade: string;
  lat: number | null;
  lng: number | null;
  status: StatusEvento;
  motivo_recusa: string | null;
  autor_perfil?: Autor | Autor[] | null;
};

function exigir() {
  if (!supabase) throw new Error('servidor não configurado');
  return supabase;
}

async function meuId() {
  const { data } = await exigir().auth.getUser();
  return data.user?.id ?? null;
}

export function paraEvento(l: Linha, eu: string | null): Evento {
  const a = Array.isArray(l.autor_perfil) ? l.autor_perfil[0] : l.autor_perfil;
  return {
    id: l.id,
    titulo: l.titulo,
    descricao: l.descricao ?? '',
    tipo: l.tipo,
    inicio: l.inicio,
    fim: l.fim,
    local: l.local ?? '',
    cidade: l.cidade,
    lat: l.lat,
    lng: l.lng,
    status: l.status,
    motivoRecusa: l.motivo_recusa,
    autorId: l.autor,
    autorNome: a ? (a.apelido ? `${a.nome} “${a.apelido}”` : a.nome) : '',
    meu: !!eu && l.autor === eu,
  };
}

/** Ainda por vir ou em andamento (sem hora de fim, vale por 12 h a partir do início, como no banco). */
export function eventoVigente(e: Pick<Evento, 'inicio' | 'fim'>, agora = Date.now()) {
  const inicio = new Date(e.inicio).getTime();
  const fim = e.fim ? new Date(e.fim).getTime() : inicio + 12 * 3600 * 1000;
  return fim >= agora;
}

/**
 * Aprovados vigentes de todos + os meus (em revisão, recusados ou aprovados), do mais próximo ao mais distante.
 * Os meus que já passaram saem da lista.
 */
export function organizarEventos(lista: Evento[], agora = Date.now()): Evento[] {
  return lista
    .filter((e) => (e.meu ? true : e.status === 'aprovado') && eventoVigente(e, agora))
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
}

export async function listarEventos(): Promise<Evento[]> {
  const sb = exigir();
  const eu = await meuId();
  const { data, error } = await sb.from('eventos').select(COLUNAS).order('inicio').limit(200);
  if (error) throw error;
  return organizarEventos(((data ?? []) as unknown as Linha[]).map((l) => paraEvento(l, eu)));
}

const nulo = (v: string) => v.trim() || null;
/** Posição aproximada do evento: ~1 km (duas casas decimais). */
export const arredondarPosicao = (v: number) => Math.round(v * 100) / 100;

function corpo(d: DadosEvento) {
  const temPos = typeof d.lat === 'number' && typeof d.lng === 'number';
  return {
    titulo: d.titulo.trim(),
    descricao: nulo(d.descricao),
    tipo: d.tipo,
    inicio: d.inicio.toISOString(),
    fim: d.fim ? d.fim.toISOString() : null,
    local: nulo(d.local),
    cidade: d.cidade.trim(),
    lat: temPos ? arredondarPosicao(d.lat as number) : null,
    lng: temPos ? arredondarPosicao(d.lng as number) : null,
  };
}

/** Cadastra (nasce pendente). */
export async function criarEvento(d: DadosEvento): Promise<void> {
  const { error } = await exigir().from('eventos').insert(corpo(d));
  if (error) throw error;
}

/** Editar volta o evento para a revisão (o banco faz isso). */
export async function editarEvento(id: string, d: DadosEvento): Promise<void> {
  const { error } = await exigir().from('eventos').update(corpo(d)).eq('id', id);
  if (error) throw error;
}

export async function apagarEvento(id: string): Promise<void> {
  const { error } = await exigir().from('eventos').delete().eq('id', id);
  if (error) throw error;
}

export async function eventosPendentes(): Promise<EventoPendente[]> {
  const { data, error } = await exigir().rpc('eventos_pendentes');
  if (error) throw error;
  return ((data ?? []) as Record<string, string | null>[]).map((e) => ({
    id: e.id as string,
    titulo: e.titulo as string,
    tipo: e.tipo as TipoEvento,
    inicio: e.inicio as string,
    fim: e.fim ?? null,
    local: e.local ?? '',
    cidade: e.cidade as string,
    descricao: e.descricao ?? '',
    autorNome: e.autor_nome ?? '-',
  }));
}

export async function decidirEvento(id: string, aprovar: boolean, motivo?: string): Promise<void> {
  const { error } = await exigir().rpc('decidir_evento', {
    p_id: id,
    p_aprovar: aprovar,
    p_motivo: motivo ?? null,
  });
  if (error) throw error;
}

/** Valida e monta início e fim (mesmo dia) a partir de "dd/mm/aaaa" + "hh:mm". Hora de fim vazia = sem fim. */
export function montarPeriodo(
  dia: string,
  hora: string,
  horaFim: string,
  agora: number = Date.now(),
): { inicio: Date; fim: Date | null } | 'inicio' | 'fim' {
  const inicio = montarData(dia, hora, agora);
  if (!inicio) return 'inicio';
  if (!horaFim.trim()) return { inicio, fim: null };
  const fim = montarData(dia, horaFim, 0);
  if (!fim || fim.getTime() < inicio.getTime()) return 'fim';
  return { inicio, fim };
}
