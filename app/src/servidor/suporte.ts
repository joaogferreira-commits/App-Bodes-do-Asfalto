import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { supabase } from './supabase';

/**
 * Ajuda e suporte (P12). O irmão manda texto, print opcional e dados do aparelho; moderador e admin
 * leem e respondem (função responder_suporte). RLS: cada um lê só os seus; moderação lê todos.
 * LGPD: dados do aparelho = versão do app, sistema, modelo e idioma. Nunca localização nem dados maçônicos.
 */
export const CATEGORIAS_SUPORTE = ['duvida', 'problema', 'sugestao', 'denuncia_outro'] as const;
export type CategoriaSuporte = (typeof CATEGORIAS_SUPORTE)[number];
export type StatusSuporte = 'aberto' | 'respondido' | 'fechado';
export const MAX_TEXTO_SUPORTE = 1000;
const MAX_TEXTO_BANCO = 2000;

export type DadosAparelho = { app: string; so: string; modelo: string; idioma: string };

export type PedidoSuporte = {
  id: string;
  texto: string;
  categoria: CategoriaSuporte;
  status: StatusSuporte;
  resposta: string | null;
  temPrint: boolean;
  printPath: string | null;
  criadoEm: string;
  autor?: string;
};

function exigir() {
  if (!supabase) throw new Error('servidor não configurado');
  return supabase;
}

/** O que será enviado, para mostrar ao irmão antes (e só enviar se ele marcar). */
export function dadosDoAparelho(idioma: string): DadosAparelho {
  const modelo = (Platform.constants as { Model?: string } | undefined)?.Model;
  return {
    app: Constants.expoConfig?.version ?? '0.0.0',
    so: `${Platform.OS} ${String(Platform.Version)}`,
    modelo: modelo ?? '-',
    idioma,
  };
}

/** Texto final: o do irmão e, se ele quiser, os erros recentes (cortados para caber no banco). */
export function montarTexto(texto: string, erros?: string): string {
  const base = texto.trim();
  const extra = erros?.trim();
  if (!extra) return base.slice(0, MAX_TEXTO_BANCO);
  const cab = '\n\n--- erros ---\n';
  return (base + cab + extra.slice(0, Math.max(0, MAX_TEXTO_BANCO - base.length - cab.length))).slice(
    0,
    MAX_TEXTO_BANCO,
  );
}

async function subirPrint(uid: string, uri: string) {
  const sb = exigir();
  const corpo = await (await fetch(uri)).arrayBuffer();
  const caminho = `${uid}/print-${Date.now()}.jpg`;
  const { error } = await sb.storage.from('suporte').upload(caminho, corpo, { contentType: 'image/jpeg' });
  if (error) throw error;
  return caminho;
}

export async function enviarPedido(p: {
  texto: string;
  categoria: CategoriaSuporte;
  aparelho?: DadosAparelho | null;
  printUri?: string | null;
  erros?: string;
}): Promise<void> {
  const sb = exigir();
  const { data } = await sb.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error('sem sessão');
  const print_path = p.printUri ? await subirPrint(uid, p.printUri) : null;
  const { error } = await sb.from('pedidos_suporte').insert({
    usuario_id: uid,
    texto: montarTexto(p.texto, p.erros),
    categoria: p.categoria,
    dados_aparelho: p.aparelho ?? null,
    print_path,
  });
  if (error) {
    if (print_path)
      await sb.storage
        .from('suporte')
        .remove([print_path])
        .catch(() => undefined);
    throw error;
  }
}

type Linha = {
  id: string;
  texto: string;
  categoria: CategoriaSuporte;
  status: StatusSuporte;
  resposta: string | null;
  print_path: string | null;
  created_at: string;
  perfis?: { nome: string; apelido: string | null } | { nome: string; apelido: string | null }[] | null;
};

const COLUNAS = 'id, texto, categoria, status, resposta, print_path, created_at';

function paraPedido(l: Linha): PedidoSuporte {
  const perf = Array.isArray(l.perfis) ? l.perfis[0] : l.perfis;
  return {
    id: l.id,
    texto: l.texto,
    categoria: l.categoria,
    status: l.status,
    resposta: l.resposta,
    temPrint: !!l.print_path,
    printPath: l.print_path,
    criadoEm: l.created_at,
    autor: perf ? (perf.apelido ? `${perf.nome} “${perf.apelido}”` : perf.nome) : undefined,
  };
}

/** Pedidos do próprio irmão (a RLS já filtra; o filtro por dono é só para moderadores não verem todos aqui). */
export async function meusPedidos(): Promise<PedidoSuporte[]> {
  const sb = exigir();
  const { data: u } = await sb.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return [];
  const { data, error } = await sb
    .from('pedidos_suporte')
    .select(COLUNAS)
    .eq('usuario_id', uid)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return ((data ?? []) as Linha[]).map(paraPedido);
}

/** Fila da moderação: pedidos abertos, os mais antigos primeiro. */
export async function pedidosAbertos(): Promise<PedidoSuporte[]> {
  const { data, error } = await exigir()
    .from('pedidos_suporte')
    .select(`${COLUNAS}, perfis!pedidos_suporte_usuario_id_fkey(nome, apelido)`)
    .eq('status', 'aberto')
    .order('created_at', { ascending: true })
    .limit(50);
  if (error) throw error;
  return ((data ?? []) as unknown as Linha[]).map(paraPedido);
}

export async function responderPedido(
  id: string,
  resposta: string,
  status: 'respondido' | 'fechado' = 'respondido',
): Promise<void> {
  const { error } = await exigir().rpc('responder_suporte', {
    p_id: id,
    p_resposta: resposta,
    p_status: status,
  });
  if (error) throw error;
}

/** Link temporário (10 min) do print; só o dono e a moderação conseguem. */
export async function urlDoPrint(path: string): Promise<string | null> {
  const { data } = await exigir().storage.from('suporte').createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}
