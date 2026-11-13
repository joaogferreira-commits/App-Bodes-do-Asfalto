import type { Desafio, OrigemDesafio, SituacaoDesafio, TipoDesafio } from '@/dados/desafios';

import { supabase } from './supabase';

/**
 * Desafios, XP, selos e ranking no servidor (P11). Tabelas e funções vêm da migration pendente
 * desafios_xp: criar_desafio, decidir_desafio, entrar_desafio, registrar_progresso, ranking, meu_xp.
 * Toda regra de verdade (aprovação, XP, antifraude) é do banco; aqui só chamamos e mostramos.
 * Limite honesto: o servidor confere salto, velocidade implícita e teto diário do que o app informa,
 * mas não consegue validar o GPS de verdade. Nunca há pontos por velocidade ou tempo.
 */
export const CHAVE_DESAFIOS = ['desafios'] as const;
export const CHAVE_RANKING = ['ranking'] as const;

export type ErroServidor =
  | 'titulo'
  | 'meta'
  | 'prazo'
  | 'um_por_mes'
  | 'limite_capitulo'
  | 'sem_acesso'
  | 'sem_capitulo'
  | 'sem_permissao'
  | 'ja_decidido'
  | 'motivo'
  | 'indisponivel'
  | 'nao_participa'
  | 'ja_concluido'
  | 'fora_do_prazo'
  | 'salto'
  | 'limite_diario'
  | 'valor'
  | 'rede';

const CONHECIDOS: ErroServidor[] = [
  'titulo',
  'meta',
  'prazo',
  'um_por_mes',
  'limite_capitulo',
  'sem_acesso',
  'sem_capitulo',
  'sem_permissao',
  'ja_decidido',
  'motivo',
  'indisponivel',
  'nao_participa',
  'ja_concluido',
  'fora_do_prazo',
  'salto',
  'limite_diario',
  'valor',
];

/** Mensagem do banco → código conhecido (qualquer outra coisa é falha de rede/servidor). */
export function codigoDoErro(e: { message?: string } | null | undefined): ErroServidor {
  const m = (e?.message ?? '').trim();
  return (CONHECIDOS as string[]).includes(m) ? (m as ErroServidor) : 'rede';
}

type Um<T> = T | T[] | null;
const um = <T>(v: Um<T> | undefined): T | undefined => (Array.isArray(v) ? v[0] : (v ?? undefined));

type LinhaDesafio = {
  id: string;
  criador: string;
  titulo: string;
  modalidade: TipoDesafio;
  meta: number;
  xp: number;
  tipo: 'membro' | 'diretoria' | 'capitulos';
  status: 'pendente' | 'aprovado' | 'recusado';
  inicio: string | null;
  fim: string | null;
  dias: number;
  participantes: number;
  perfis: Um<{ nome: string; apelido: string | null }>;
  capitulos: Um<{ nome: string }>;
  desafio_capitulos: { capitulos: Um<{ nome: string }> }[] | null;
  participacoes: { km_feitos: number; concluido_em: string | null }[] | null;
};

const ORIGEM: Record<LinhaDesafio['tipo'], OrigemDesafio> = {
  membro: 'irmao',
  diretoria: 'diretoria',
  capitulos: 'capitulos',
};

const hojeISO = (agora: number) => new Date(agora).toISOString().slice(0, 10);

export function linhaParaDesafio(l: LinhaDesafio, agora: number = Date.now()): Desafio {
  const p = um(l.perfis);
  const nomes = (l.desafio_capitulos ?? []).map((c) => um(c.capitulos)?.nome ?? '').filter(Boolean);
  const cap = um(l.capitulos)?.nome;
  const minha = l.participacoes?.[0];
  const hoje = hojeISO(agora);
  let situacao: SituacaoDesafio = 'ativo';
  if (l.status === 'pendente') situacao = 'aguardando';
  else if (l.status === 'recusado') situacao = 'recusado';
  else if (l.fim && l.fim < hoje) situacao = 'encerrado';
  return {
    id: l.id,
    titulo: l.titulo,
    tipo: l.modalidade,
    meta: l.meta,
    origem: ORIGEM[l.tipo],
    criador: p?.apelido?.trim() || p?.nome || '',
    criadorId: l.criador,
    capitulos: nomes.length ? nomes : cap ? [cap] : [],
    inicio: l.inicio ?? '',
    fim: l.fim ?? '',
    situacao,
    participantes: l.participantes,
    xpServidor: l.xp,
    kmFeitos: minha ? Number(minha.km_feitos) : 0,
    participo: !!minha,
    concluido: !!minha?.concluido_em,
  };
}

const COLUNAS =
  'id, criador, titulo, modalidade, meta, xp, tipo, status, inicio, fim, dias, participantes, perfis!criador(nome, apelido), capitulos!capitulo_id(nome), desafio_capitulos(capitulos(nome)), participacoes(km_feitos, concluido_em)';

/** Desafios que a RLS deixa ver: aprovados, os meus (pendentes) e os que posso decidir. */
export async function listarDesafios(): Promise<Desafio[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('desafios')
      .select(COLUNAS)
      .order('criado_em', { ascending: false })
      .limit(100);
    if (error || !data) return [];
    return (data as unknown as LinhaDesafio[]).map((l) => linhaParaDesafio(l));
  } catch {
    return [];
  }
}

export type NovoDesafioServidor = {
  titulo: string;
  descricao?: string;
  modalidade: TipoDesafio;
  meta: number;
  dias: number;
};

export type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: ErroServidor };

async function chamar<T>(nome: string, args: Record<string, unknown>): Promise<Resultado<T>> {
  if (!supabase) return { ok: false, erro: 'rede' };
  try {
    const { data, error } = await supabase.rpc(nome, args);
    if (error) return { ok: false, erro: codigoDoErro(error) };
    return { ok: true, valor: data as T };
  } catch {
    return { ok: false, erro: 'rede' };
  }
}

/** Cria o desafio: irmão fica pendente (diretoria/moderador decide); diretoria publica direto. */
export const criarDesafioServidor = (d: NovoDesafioServidor) =>
  chamar<string>('criar_desafio', {
    p_titulo: d.titulo,
    p_descricao: d.descricao ?? '',
    p_modalidade: d.modalidade,
    p_meta: d.meta,
    p_dias: d.dias,
  });

export const entrarDesafioServidor = (id: string) => chamar<boolean>('entrar_desafio', { p_desafio: id });
export const sairDesafioServidor = (id: string) => chamar<boolean>('sair_desafio', { p_desafio: id });

/** Devolve o total de km (ou unidades) já aceito pelo servidor. */
export const registrarProgressoServidor = (id: string, km: number) =>
  chamar<number>('registrar_progresso', { p_desafio: id, p_km: Math.round(km * 100) / 100 });

/** Aprova ou recusa (recusar exige motivo). Devolve 'aprovado' | 'recusado' | 'pendente' (falta outro capítulo). */
export const decidirDesafioServidor = (id: string, aprovar: boolean, motivo?: string) =>
  chamar<string>('decidir_desafio', { p_desafio: id, p_aprovar: aprovar, p_motivo: motivo ?? null });

/** Pendentes que EU posso decidir (a RLS filtra; os meus ficam de fora). */
export async function desafiosParaAprovar(meuId: string | null): Promise<Desafio[]> {
  const todos = await listarDesafios();
  return todos.filter((d) => d.situacao === 'aguardando' && meuId !== null && d.criadorId !== meuId);
}

/**
 * Sincroniza o odômetro do aparelho com os desafios de km em que o irmão está. Salto/limite diário são
 * descartados (o servidor recusou: leitura de GPS suspeita) e o marcador avança; falha de rede mantém o marcador.
 * Cada chamada leva no máximo 200 km (teto do servidor).
 */
export async function sincronizarKm(
  desafios: Desafio[],
  kmGps: number,
  marcadores: Record<string, number>,
): Promise<Record<string, number>> {
  const novos = { ...marcadores };
  for (const d of desafios) {
    if (d.tipo !== 'km' || !d.participo || d.concluido || d.situacao !== 'ativo') continue;
    const base = marcadores[d.id];
    if (base === undefined) {
      novos[d.id] = kmGps;
      continue;
    }
    const delta = kmGps - base;
    if (delta < 0.5) continue;
    const r = await registrarProgressoServidor(d.id, Math.min(delta, 200));
    if (r.ok) novos[d.id] = base + Math.min(delta, 200);
    else if (r.erro === 'salto' || r.erro === 'limite_diario' || r.erro === 'fora_do_prazo')
      novos[d.id] = kmGps;
  }
  return novos;
}

// --- XP, selos e ranking ---------------------------------------------------

export type PeriodoRanking = 'mes' | 'sempre';
export type LinhaRanking = {
  posicao: number;
  usuarioId: string;
  nome: string;
  apelido: string | null;
  xp: number;
  eu: boolean;
};

type LinhaRpcRanking = {
  posicao: number | string;
  usuario_id: string;
  nome: string;
  apelido: string | null;
  xp: number | string;
};

/** Top 50 por XP (nunca velocidade). Sem quem escolheu sair do ranking. `capitulo` null = geral. */
export async function carregarRanking(
  capitulo: string | null,
  periodo: PeriodoRanking,
  meuId: string | null,
): Promise<LinhaRanking[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc('ranking', { p_capitulo: capitulo, p_periodo: periodo });
    if (error || !Array.isArray(data)) return [];
    return (data as LinhaRpcRanking[]).map((l) => ({
      posicao: Number(l.posicao),
      usuarioId: l.usuario_id,
      nome: l.nome,
      apelido: l.apelido,
      xp: Number(l.xp),
      eu: l.usuario_id === meuId,
    }));
  } catch {
    return [];
  }
}

export type MeuProgresso = {
  xp: number;
  selos: string[];
  capituloId: string | null;
  foraDoRanking: boolean;
  id: string | null;
};

export async function carregarMeuProgresso(): Promise<MeuProgresso> {
  const vazio: MeuProgresso = { xp: 0, selos: [], capituloId: null, foraDoRanking: false, id: null };
  if (!supabase) return vazio;
  try {
    const { data: u } = await supabase.auth.getUser();
    const id = u.user?.id ?? null;
    if (!id) return vazio;
    const [xp, selos, perfil] = await Promise.all([
      supabase.rpc('meu_xp'),
      supabase.from('conquistas').select('selo').eq('usuario_id', id),
      supabase.from('perfis').select('capitulo_id, fora_do_ranking').eq('id', id).maybeSingle(),
    ]);
    const p = perfil.data as { capitulo_id: string | null; fora_do_ranking: boolean } | null;
    return {
      id,
      xp: xp.error ? 0 : Number(xp.data) || 0,
      selos: ((selos.data ?? []) as { selo: string }[]).map((s) => s.selo),
      capituloId: p?.capitulo_id ?? null,
      foraDoRanking: !!p?.fora_do_ranking,
    };
  } catch {
    return vazio;
  }
}

/** "Sair do ranking": continua com XP e selos, só some da lista. */
export async function definirForaDoRanking(fora: boolean): Promise<boolean> {
  const r = await chamar<boolean>('definir_fora_do_ranking', { p_fora: fora });
  return r.ok && r.valor === true;
}
