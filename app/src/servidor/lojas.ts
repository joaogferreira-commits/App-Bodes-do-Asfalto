import type { LugarExemplo } from '@/dados/exemplos';

import { supabase } from './supabase';

/**
 * Lojas (Visitação de Lojas). Informação sobre a Loja, só para membros (RLS). O banco nunca entrega quem cadastrou
 * (criado_por): a única pessoa ligada à Loja em público é o irmão de contato, que consentiu ao cadastrar.
 * O contato é por aceno; o app não mostra telefone. A entrada segue o procedimento da Loja.
 */
export type StatusLoja = 'pendente' | 'aprovada' | 'recusada';

export type Loja = {
  id: string;
  nome: string;
  oriente: string;
  potencia: string;
  diasSessao: string;
  endereco: string;
  cidade: string;
  lat: number | null;
  lng: number | null;
  contatoId: string | null;
  contatoNome: string | null;
  status: StatusLoja;
  motivoRecusa: string | null;
  /** o irmão logado é o contato (quem cadastrou): pode editar e apagar */
  meu: boolean;
};

export type DadosLoja = {
  nome: string;
  oriente: string;
  potencia: string;
  diasSessao: string;
  endereco: string;
  cidade: string;
  lat?: number | null;
  lng?: number | null;
};

export type LojaPendente = {
  id: string;
  nome: string;
  oriente: string;
  potencia: string;
  diasSessao: string;
  endereco: string;
  cidade: string;
  autor: string;
};

const COLUNAS =
  'id, nome, oriente, potencia, dias_sessao, endereco, cidade, lat, lng, irmao_contato, status, motivo_recusa, contato:perfis!lojas_irmao_contato_fkey(nome, apelido)';

type Contato = { nome: string; apelido: string | null };
type Linha = {
  id: string;
  nome: string;
  oriente: string | null;
  potencia: string | null;
  dias_sessao: string | null;
  endereco: string | null;
  cidade: string;
  lat: number | null;
  lng: number | null;
  irmao_contato: string | null;
  status: StatusLoja;
  motivo_recusa: string | null;
  contato?: Contato | Contato[] | null;
};

function exigir() {
  if (!supabase) throw new Error('servidor não configurado');
  return supabase;
}

async function meuId() {
  const { data } = await exigir().auth.getUser();
  return data.user?.id ?? null;
}

/** Posição aproximada da Loja: arredondada a ~1 km (duas casas decimais). */
export const arredondar = (v: number) => Math.round(v * 100) / 100;

export function paraLoja(l: Linha, eu: string | null): Loja {
  const c = Array.isArray(l.contato) ? l.contato[0] : l.contato;
  return {
    id: l.id,
    nome: l.nome,
    oriente: l.oriente ?? '',
    potencia: l.potencia ?? '',
    diasSessao: l.dias_sessao ?? '',
    endereco: l.endereco ?? '',
    cidade: l.cidade,
    lat: l.lat,
    lng: l.lng,
    contatoId: l.irmao_contato,
    contatoNome: c ? (c.apelido ? `${c.nome} “${c.apelido}”` : c.nome) : null,
    status: l.status,
    motivoRecusa: l.motivo_recusa,
    meu: !!eu && l.irmao_contato === eu,
  };
}

/** Lojas aprovadas (e as suas, ainda em revisão ou recusadas). */
export async function listarLojas(): Promise<Loja[]> {
  const sb = exigir();
  const eu = await meuId();
  const { data, error } = await sb.from('lojas').select(COLUNAS).order('nome').limit(300);
  if (error) throw error;
  return ((data ?? []) as unknown as Linha[]).map((l) => paraLoja(l, eu));
}

const vazioParaNulo = (v: string) => v.trim() || null;

function corpo(d: DadosLoja) {
  const temPos = typeof d.lat === 'number' && typeof d.lng === 'number';
  return {
    nome: d.nome.trim(),
    oriente: vazioParaNulo(d.oriente),
    potencia: vazioParaNulo(d.potencia),
    dias_sessao: vazioParaNulo(d.diasSessao),
    endereco: vazioParaNulo(d.endereco),
    cidade: d.cidade.trim(),
    lat: temPos ? arredondar(d.lat as number) : null,
    lng: temPos ? arredondar(d.lng as number) : null,
  };
}

/** Cadastra (nasce pendente). Quem cadastra declara que é da Loja e aceita ser o contato. */
export async function criarLoja(d: DadosLoja): Promise<void> {
  const sb = exigir();
  const eu = await meuId();
  if (!eu) throw new Error('sem sessão');
  const { error } = await sb.from('lojas').insert({ ...corpo(d), irmao_contato: eu, declaracao: true });
  if (error) throw error;
}

/** Editar volta a Loja para a revisão da moderação (o banco faz isso). */
export async function editarLoja(id: string, d: DadosLoja): Promise<void> {
  const { error } = await exigir().from('lojas').update(corpo(d)).eq('id', id);
  if (error) throw error;
}

export async function apagarLoja(id: string): Promise<void> {
  const { error } = await exigir().from('lojas').delete().eq('id', id);
  if (error) throw error;
}

export async function lojasPendentes(): Promise<LojaPendente[]> {
  const { data, error } = await exigir().rpc('lojas_pendentes');
  if (error) throw error;
  return ((data ?? []) as Record<string, string | null>[]).map((l) => ({
    id: l.id as string,
    nome: l.nome as string,
    oriente: l.oriente ?? '',
    potencia: l.potencia ?? '',
    diasSessao: l.dias_sessao ?? '',
    endereco: l.endereco ?? '',
    cidade: l.cidade as string,
    autor: l.autor ?? '-',
  }));
}

export async function decidirLoja(id: string, aprovar: boolean, motivo?: string): Promise<void> {
  const { error } = await exigir().rpc('decidir_loja', {
    p_id: id,
    p_aprovar: aprovar,
    p_motivo: motivo ?? null,
  });
  if (error) throw error;
}

/** Pino do mapa para uma Loja aprovada com posição. */
export function lojaParaLugar(l: Loja): LugarExemplo | null {
  if (l.status !== 'aprovada' || l.lat == null || l.lng == null) return null;
  return {
    id: `loja:${l.id}`,
    tipo: 'loja',
    nome: l.nome,
    lat: l.lat,
    lng: l.lng,
    lojaId: l.id,
    detalhe: l.diasSessao || undefined,
  };
}
