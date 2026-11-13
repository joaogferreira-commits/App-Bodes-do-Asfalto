import type { TFunction } from 'i18next';

import type { CategoriaClassificado, Classificado } from '@/dados/classificados';

import { supabase } from './supabase';

/**
 * Classificados entre irmãos com o servidor ligado. Sem aprovação prévia: a moderação age por denúncia.
 * No máximo 5 anúncios ativos por irmão; o anúncio vale 60 dias (o servidor fixa a data).
 * O contato é por aceno/chat; o WhatsApp é opcional e só membros leem. Nenhum pagamento passa pelo app.
 * Fotos no bucket privado "classificados" (só membros), por link temporário.
 */
export const MAX_FOTOS_CLASSIFICADO = 6;
export const MAX_ATIVOS = 5;

export type CategoriaServidor = 'moto' | 'pecas' | 'equipamento' | 'vestuario' | 'outro';
export type StatusClassificado = 'ativo' | 'vendido' | 'removido';

export type DadosClassificado = {
  titulo: string;
  descricao: string;
  /** reais; 0 ou vazio = "a combinar" */
  preco: number;
  categoria: CategoriaClassificado;
  cidade: string;
  whatsapp: string;
  /** caminhos já enviados ao bucket */
  fotos: string[];
};

export type ClassificadoServidor = {
  id: string;
  autorId: string;
  autorNome: string;
  autorCapitulo: string;
  titulo: string;
  descricao: string;
  preco: number | null;
  categoria: CategoriaServidor;
  cidade: string;
  fotos: string[];
  whatsapp: string;
  status: StatusClassificado;
  expiraEm: string;
  criadoEm: string;
  meu: boolean;
};

const COLUNAS =
  'id, autor, titulo, descricao, preco, categoria, cidade, fotos, whatsapp, status, expira_em, created_at, autor_perfil:perfis!classificados_autor_fkey(nome, apelido, capitulos(nome))';

type Embutido<T> = T | T[] | null | undefined;
type Linha = {
  id: string;
  autor: string;
  titulo: string;
  descricao: string | null;
  preco: number | string | null;
  categoria: CategoriaServidor;
  cidade: string;
  fotos: string[] | null;
  whatsapp: string | null;
  status: StatusClassificado;
  expira_em: string;
  created_at: string;
  autor_perfil?: Embutido<{ nome: string; apelido: string | null; capitulos?: Embutido<{ nome: string }> }>;
};

const um = <T>(v: Embutido<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

function exigir() {
  if (!supabase) throw new Error('servidor não configurado');
  return supabase;
}

async function meuId() {
  const { data } = await exigir().auth.getUser();
  return data.user?.id ?? null;
}

/** Categorias do app (plural) <-> do banco (singular; "serviços" vira "outro"). */
export const paraCategoriaServidor: Record<CategoriaClassificado, CategoriaServidor> = {
  motos: 'moto',
  pecas: 'pecas',
  equipamentos: 'equipamento',
  vestuario: 'vestuario',
  servicos: 'outro',
};
export const daCategoriaServidor: Record<CategoriaServidor, CategoriaClassificado> = {
  moto: 'motos',
  pecas: 'pecas',
  equipamento: 'equipamentos',
  vestuario: 'vestuario',
  outro: 'servicos',
};

export function paraClassificadoServidor(l: Linha, eu: string | null): ClassificadoServidor {
  const p = um(l.autor_perfil);
  const preco = l.preco == null ? null : Number(l.preco);
  return {
    id: l.id,
    autorId: l.autor,
    autorNome: p ? (p.apelido ? `${p.nome} “${p.apelido}”` : p.nome) : '',
    autorCapitulo: um(p?.capitulos)?.nome ?? '',
    titulo: l.titulo,
    descricao: l.descricao ?? '',
    preco: preco != null && Number.isFinite(preco) ? preco : null,
    categoria: l.categoria,
    cidade: l.cidade,
    fotos: l.fotos ?? [],
    whatsapp: l.whatsapp ?? '',
    status: l.status,
    expiraEm: l.expira_em,
    criadoEm: l.created_at,
    meu: !!eu && l.autor === eu,
  };
}

/** Só o que ainda vale: nem removido pela moderação nem vencido (a RLS já filtra; o app confere de novo). */
export function anuncioVigente(c: Pick<ClassificadoServidor, 'status' | 'expiraEm'>, agora = Date.now()) {
  return c.status !== 'removido' && new Date(c.expiraEm).getTime() > agora;
}

export async function listarClassificados(): Promise<ClassificadoServidor[]> {
  const sb = exigir();
  const eu = await meuId();
  const { data, error } = await sb
    .from('classificados')
    .select(COLUNAS)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return ((data ?? []) as unknown as Linha[])
    .map((l) => paraClassificadoServidor(l, eu))
    .filter((c) => anuncioVigente(c));
}

/** "há 2 h", "há 3 dias": o texto vem da tradução (`classificados.quando.*`). */
export function quandoPublicado(criadoEm: string, t: TFunction, agora = Date.now()) {
  const min = Math.max(0, Math.floor((agora - new Date(criadoEm).getTime()) / 60000));
  if (min < 60) return t('classificados.quando.agora');
  const h = Math.floor(min / 60);
  if (h < 24) return t('classificados.quando.horas', { n: h });
  return t('classificados.quando.dias', { n: Math.floor(h / 24) });
}

/** Do formato do servidor para o das telas (sem estado/troca/ano/km, que o servidor não guarda). */
export function paraAnuncio(
  c: ClassificadoServidor,
  urls: Record<string, string>,
  quando = '',
): Classificado {
  return {
    id: c.id,
    categoria: daCategoriaServidor[c.categoria],
    titulo: c.titulo,
    preco: c.preco ?? 0,
    aceitaTroca: false,
    estado: 'usado',
    semFicha: true,
    cidade: c.cidade,
    vendedor: c.autorNome,
    capitulo: c.autorCapitulo,
    quando,
    descricao: c.descricao,
    fotos: c.fotos
      .map((f) => urls[f])
      .filter((u): u is string => !!u)
      .map((uri) => ({ uri })),
    vendido: c.status === 'vendido',
    meu: c.meu,
    whatsapp: c.whatsapp || undefined,
    autorId: c.autorId,
    servidor: true,
  };
}

const nulo = (v: string) => v.trim() || null;

function corpo(d: DadosClassificado) {
  return {
    titulo: d.titulo.trim(),
    descricao: nulo(d.descricao),
    preco: d.preco > 0 ? d.preco : null,
    categoria: paraCategoriaServidor[d.categoria],
    cidade: d.cidade.trim(),
    fotos: d.fotos.slice(0, MAX_FOTOS_CLASSIFICADO),
    whatsapp: nulo(d.whatsapp),
  };
}

export type ErroClassificado = 'limite' | 'erro';

/** Erro do banco -> motivo para a tela. */
export function motivoDoErro(e: unknown): ErroClassificado {
  return /limite_ativos/.test((e as { message?: string } | null)?.message ?? '') ? 'limite' : 'erro';
}

export async function criarClassificado(d: DadosClassificado): Promise<void> {
  const { error } = await exigir().from('classificados').insert(corpo(d));
  if (error) throw error;
}

export async function marcarVendidoServidor(id: string, vendido: boolean): Promise<void> {
  const { error } = await exigir()
    .from('classificados')
    .update({ status: vendido ? 'vendido' : 'ativo' })
    .eq('id', id);
  if (error) throw error;
}

export async function apagarClassificado(id: string): Promise<void> {
  const { error } = await exigir().from('classificados').delete().eq('id', id);
  if (error) throw error;
}

/** Envia uma foto já preparada (sem EXIF) para a pasta do irmão. */
export async function subirFotoClassificado(uri: string): Promise<string> {
  const sb = exigir();
  const eu = await meuId();
  if (!eu) throw new Error('sem sessão');
  const bytes = await (await fetch(uri)).arrayBuffer();
  const caminho = `${eu}/${Date.now()}-${Math.floor(Math.random() * 1e6)}.jpg`;
  const { error } = await sb.storage
    .from('classificados')
    .upload(caminho, bytes, { contentType: 'image/jpeg' });
  if (error) throw error;
  return caminho;
}

/** Links temporários (1 h) das fotos; o que falhar fica de fora. */
export async function urlsDasFotosClassificados(caminhos: string[]): Promise<Record<string, string>> {
  if (!caminhos.length) return {};
  const { data } = await exigir().storage.from('classificados').createSignedUrls(caminhos, 3600);
  const mapa: Record<string, string> = {};
  for (const x of data ?? []) if (x.path && x.signedUrl) mapa[x.path] = x.signedUrl;
  return mapa;
}
