import type { CategoriaNegocio, Negocio } from '@/dados/negocios';
import type { LugarExemplo } from '@/dados/exemplos';
import type { TipoPino } from '@/ui';

import { supabase } from './supabase';

/**
 * Guia de Negócios de irmãos (docs/COMERCIAL.md). Cadastro grátis, revisado pela moderação.
 * O destaque (destaque_ate) é pago FORA do app e só o admin o define (função definir_destaque). Nenhum link de pagamento no app.
 * Fotos no bucket "negocios" (só membros veem), por link temporário.
 */
export const MAX_FOTOS_NEGOCIO = 3;

export type DadosNegocio = {
  nome: string;
  categoria: CategoriaNegocio;
  descricao: string;
  cidade: string;
  beneficio: string;
  telefone: string;
  whatsapp: string;
  site: string;
  lat?: number | null;
  lng?: number | null;
  /** caminhos já enviados ao bucket */
  fotos: string[];
};

export type NegocioServidor = DadosNegocio & {
  id: string;
  donoId: string;
  donoNome: string;
  status: 'pendente' | 'aprovado' | 'recusado';
  motivoRecusa: string | null;
  destaqueAte: string | null;
  meu: boolean;
};

export type NegocioPendente = {
  id: string;
  nome: string;
  categoria: CategoriaNegocio;
  cidade: string;
  beneficio: string;
  descricao: string;
  donoNome: string;
};

const COLUNAS =
  'id, dono, nome, categoria, descricao, cidade, lat, lng, telefone, whatsapp, site, beneficio_irmaos, fotos, destaque_ate, status, motivo_recusa, dono_perfil:perfis!negocios_dono_fkey(nome)';

type Linha = {
  id: string;
  dono: string;
  nome: string;
  categoria: CategoriaNegocio;
  descricao: string | null;
  cidade: string;
  lat: number | null;
  lng: number | null;
  telefone: string | null;
  whatsapp: string | null;
  site: string | null;
  beneficio_irmaos: string;
  fotos: string[] | null;
  destaque_ate: string | null;
  status: NegocioServidor['status'];
  motivo_recusa: string | null;
  dono_perfil?: { nome: string } | { nome: string }[] | null;
};

function exigir() {
  if (!supabase) throw new Error('servidor não configurado');
  return supabase;
}

async function meuId() {
  const { data } = await exigir().auth.getUser();
  return data.user?.id ?? null;
}

/** AAAA-MM-DD de hoje no fuso do aparelho. */
export function hojeISO(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** O destaque vale até o fim do dia da data (inclusive). */
export const destaqueVigente = (ate: string | null | undefined, hoje = hojeISO()) => !!ate && ate >= hoje;

/** Data AAAA-MM-DD real (rejeita 2026-02-31). */
export function dataValida(v: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim());
  if (!m) return false;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return (
    d.getFullYear() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3])
  );
}

/** Só aceita http(s); sem protocolo vira https. Vazio fica vazio; inválido devolve null. */
export function normalizarSite(v: string): string | null {
  const t = v.trim();
  if (!t) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(t) && !/^https?:\/\//i.test(t)) return null;
  const url = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  return /^https?:\/\/[^\s]+$/i.test(url) ? url : null;
}

export function paraNegocio(l: Linha, eu: string | null): NegocioServidor {
  const d = Array.isArray(l.dono_perfil) ? l.dono_perfil[0] : l.dono_perfil;
  return {
    id: l.id,
    donoId: l.dono,
    donoNome: d?.nome ?? '',
    nome: l.nome,
    categoria: l.categoria,
    descricao: l.descricao ?? '',
    cidade: l.cidade,
    lat: l.lat,
    lng: l.lng,
    telefone: l.telefone ?? '',
    whatsapp: l.whatsapp ?? '',
    site: l.site ?? '',
    beneficio: l.beneficio_irmaos,
    fotos: l.fotos ?? [],
    status: l.status,
    motivoRecusa: l.motivo_recusa,
    destaqueAte: l.destaque_ate,
    meu: !!eu && l.dono === eu,
  };
}

export async function listarNegocios(): Promise<NegocioServidor[]> {
  const sb = exigir();
  const eu = await meuId();
  const { data, error } = await sb.from('negocios').select(COLUNAS).order('nome').limit(300);
  if (error) throw error;
  return ((data ?? []) as unknown as Linha[]).map((l) => paraNegocio(l, eu));
}

const nulo = (v: string) => v.trim() || null;

function corpo(d: DadosNegocio) {
  const temPos = typeof d.lat === 'number' && typeof d.lng === 'number';
  return {
    nome: d.nome.trim(),
    categoria: d.categoria,
    descricao: nulo(d.descricao),
    cidade: d.cidade.trim(),
    lat: temPos ? Math.round((d.lat as number) * 10000) / 10000 : null,
    lng: temPos ? Math.round((d.lng as number) * 10000) / 10000 : null,
    telefone: nulo(d.telefone),
    whatsapp: nulo(d.whatsapp),
    site: nulo(d.site),
    beneficio_irmaos: d.beneficio.trim(),
    fotos: d.fotos.slice(0, MAX_FOTOS_NEGOCIO),
  };
}

export async function criarNegocio(d: DadosNegocio): Promise<void> {
  const { error } = await exigir().from('negocios').insert(corpo(d));
  if (error) throw error;
}

/** Editar volta o negócio para a revisão (o banco faz isso). */
export async function editarNegocio(id: string, d: DadosNegocio): Promise<void> {
  const { error } = await exigir().from('negocios').update(corpo(d)).eq('id', id);
  if (error) throw error;
}

export async function apagarNegocio(id: string): Promise<void> {
  const { error } = await exigir().from('negocios').delete().eq('id', id);
  if (error) throw error;
}

/** Envia uma foto já preparada (sem EXIF) para a pasta do irmão. */
export async function subirFotoNegocio(uri: string): Promise<string> {
  const sb = exigir();
  const eu = await meuId();
  if (!eu) throw new Error('sem sessão');
  const bytes = await (await fetch(uri)).arrayBuffer();
  const caminho = `${eu}/${Date.now()}-${Math.floor(Math.random() * 1e6)}.jpg`;
  const { error } = await sb.storage.from('negocios').upload(caminho, bytes, { contentType: 'image/jpeg' });
  if (error) throw error;
  return caminho;
}

/** Links temporários (1 h) das fotos, na mesma ordem; o que falhar fica de fora. */
export async function urlsDasFotos(caminhos: string[]): Promise<Record<string, string>> {
  if (!caminhos.length) return {};
  const { data } = await exigir().storage.from('negocios').createSignedUrls(caminhos, 3600);
  const mapa: Record<string, string> = {};
  for (const x of data ?? []) if (x.path && x.signedUrl) mapa[x.path] = x.signedUrl;
  return mapa;
}

export async function negociosPendentes(): Promise<NegocioPendente[]> {
  const { data, error } = await exigir().rpc('negocios_pendentes');
  if (error) throw error;
  return ((data ?? []) as Record<string, string | null>[]).map((n) => ({
    id: n.id as string,
    nome: n.nome as string,
    categoria: n.categoria as CategoriaNegocio,
    cidade: n.cidade as string,
    beneficio: n.beneficio_irmaos ?? '',
    descricao: n.descricao ?? '',
    donoNome: n.dono_nome ?? '-',
  }));
}

export async function decidirNegocio(id: string, aprovar: boolean, motivo?: string): Promise<void> {
  const { error } = await exigir().rpc('decidir_negocio', {
    p_id: id,
    p_aprovar: aprovar,
    p_motivo: motivo ?? null,
  });
  if (error) throw error;
}

/** Só o admin: data AAAA-MM-DD define o destaque; null tira. O pagamento acontece fora do app. */
export async function definirDestaque(id: string, ate: string | null): Promise<void> {
  if (ate !== null && !dataValida(ate)) throw new Error('data inválida');
  const { error } = await exigir().rpc('definir_destaque', { p_id: id, p_ate: ate });
  if (error) throw error;
}

const pinoDaCategoria: Record<CategoriaNegocio, TipoPino> = {
  oficina: 'oficina',
  comida: 'restaurante',
  pouso: 'hospedagem',
  pecas: 'oficina',
  servicos: 'oficina',
};

/** Pino do mapa para um negócio aprovado com posição. */
export function negocioParaLugar(n: NegocioServidor): LugarExemplo | null {
  if (n.status !== 'aprovado' || n.lat == null || n.lng == null) return null;
  return {
    id: `negocio:${n.id}`,
    tipo: pinoDaCategoria[n.categoria],
    nome: n.nome,
    lat: n.lat,
    lng: n.lng,
    negocioId: n.id,
    detalhe: n.beneficio,
  };
}

/** Do formato do servidor para o das telas do Guia (plano "parceiro" enquanto o destaque vale). */
export function paraGuia(n: NegocioServidor, urls: Record<string, string>): Negocio {
  return {
    id: n.id,
    nome: n.nome,
    categoria: n.categoria,
    pino: pinoDaCategoria[n.categoria],
    cidade: n.cidade,
    dono: n.donoNome,
    beneficio: n.beneficio,
    descricao: n.descricao,
    comodidades: [],
    fotos: n.fotos
      .map((f) => urls[f])
      .filter((u): u is string => !!u)
      .map((uri) => ({ uri })),
    whatsapp: n.whatsapp || undefined,
    telefone: n.telefone || undefined,
    posicao: n.lat != null && n.lng != null ? { lat: n.lat, lng: n.lng } : undefined,
    plano: n.destaqueAte ? 'parceiro' : 'gratis',
    validade: n.destaqueAte ?? undefined,
    recomendacoes: 0,
    servidor: true,
    meu: n.meu,
    status: n.status,
    motivoRecusa: n.motivoRecusa,
    destaqueAte: n.destaqueAte,
    site: n.site || undefined,
  };
}
