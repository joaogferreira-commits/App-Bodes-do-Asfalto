import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from './supabase';

/**
 * Login real (Etapa B): link mágico por e-mail e Google, os dois voltando ao app por
 * bodesdoasfalto://acesso/retorno?code=... (PKCE: o código só vale neste aparelho).
 */
export type EstadoServidor = 'deslogado' | 'semSolicitacao' | 'pendente' | 'membro' | 'desativado';

export const enderecoRetorno = () => Linking.createURL('acesso/retorno');

function exigir() {
  if (!supabase) throw new Error('servidor não configurado');
  return supabase;
}

export async function pedirLinkPorEmail(email: string) {
  const { error } = await exigir().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: enderecoRetorno(), shouldCreateUser: true },
  });
  if (error) throw error;
}

/** Troca o código do link por uma sessão. Devolve true se entrou. */
export async function concluirCodigo(code: string): Promise<boolean> {
  const { error } = await exigir().auth.exchangeCodeForSession(code);
  return !error;
}

/** Mesmo que concluirCodigo, a partir do endereço completo de retorno. */
export async function concluirRetorno(url: string): Promise<boolean> {
  const params = Linking.parse(url).queryParams ?? {};
  const code = typeof params.code === 'string' ? params.code : null;
  return code ? concluirCodigo(code) : false;
}

export async function entrarComGoogle(): Promise<boolean> {
  const sb = exigir();
  const retorno = enderecoRetorno();
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: retorno, skipBrowserRedirect: true },
  });
  if (error || !data.url) throw error ?? new Error('sem endereço do Google');
  const r = await WebBrowser.openAuthSessionAsync(data.url, retorno);
  return r.type === 'success' ? concluirRetorno(r.url) : false;
}

/** Situação do irmão no servidor: perfil aprovado, pedido aberto ou nada ainda. */
export async function situacao(): Promise<{ estado: EstadoServidor; email?: string; papel?: string }> {
  const sb = exigir();
  const { data } = await sb.auth.getSession();
  const usuario = data.session?.user;
  if (!usuario) return { estado: 'deslogado' };
  const { data: perfil } = await sb
    .from('perfis')
    .select('papel, desativado_em')
    .eq('id', usuario.id)
    .maybeSingle();
  if (perfil?.desativado_em) return { estado: 'desativado', email: usuario.email };
  if (perfil && perfil.papel !== 'pendente')
    return { estado: 'membro', email: usuario.email, papel: perfil.papel };
  const { data: pedido } = await sb
    .from('solicitacoes_entrada')
    .select('id')
    .eq('usuario_id', usuario.id)
    .eq('status', 'aberta')
    .maybeSingle();
  return { estado: pedido ? 'pendente' : 'semSolicitacao', email: usuario.email };
}

export async function registrarConsentimento(finalidade: string, versao: string) {
  const { error } = await exigir().from('consentimentos').insert({ finalidade, versao });
  if (error) throw error;
}

export async function revogarConsentimento(finalidade: string) {
  const { error } = await exigir()
    .from('consentimentos')
    .update({ revogado_em: new Date().toISOString() })
    .eq('finalidade', finalidade)
    .is('revogado_em', null);
  if (error) throw error;
}

export async function sairDoServidor() {
  await supabase?.auth.signOut().catch(() => undefined);
}

export async function excluirContaNoServidor() {
  const { error } = await exigir().rpc('excluir_minha_conta');
  if (error) throw error;
  await sairDoServidor();
}

/** Sobe uma foto para o bucket privado "entrada" na pasta do próprio irmão. */
async function subirFoto(uid: string, nome: string, uri: string) {
  const sb = exigir();
  const corpo = await (await fetch(uri)).arrayBuffer();
  const caminho = `${uid}/${nome}-${Date.now()}.jpg`;
  const { error } = await sb.storage.from('entrada').upload(caminho, corpo, { contentType: 'image/jpeg' });
  if (error) throw error;
  return caminho;
}

/** Pedido de entrada no servidor: fotos no bucket privado + linha em solicitacoes_entrada. */
export async function enviarSolicitacaoServidor(s: {
  nome: string;
  apelido: string;
  capitulo: string;
  cidade: string;
  telefone: string;
  fotoColete?: string;
  fotoCarteirinha?: string;
  indicadoPor: string;
}) {
  const sb = exigir();
  const { data } = await sb.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error('sem sessão');
  if (!s.fotoColete || !s.fotoCarteirinha) throw new Error('faltam fotos');
  const { data: cap, error: erroCap } = await sb
    .from('capitulos')
    .select('id')
    .eq('nome', s.capitulo)
    .maybeSingle();
  if (erroCap || !cap) throw erroCap ?? new Error('capítulo não encontrado');
  const [colete, carteirinha] = await Promise.all([
    subirFoto(uid, 'colete', s.fotoColete),
    subirFoto(uid, 'carteirinha', s.fotoCarteirinha),
  ]);
  const { error } = await sb.from('solicitacoes_entrada').insert({
    usuario_id: uid,
    nome: s.nome,
    apelido: s.apelido || null,
    capitulo_id: cap.id,
    cidade: s.cidade,
    telefone: s.telefone,
    foto_colete_path: colete,
    foto_carteirinha_path: carteirinha,
    indicado_por_nome: s.indicadoPor || null,
  });
  if (error) throw error;
}
