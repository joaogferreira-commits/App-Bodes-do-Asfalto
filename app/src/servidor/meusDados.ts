import { supabase } from './supabase';

/**
 * "Baixar meus dados" (LGPD) no modo servidor: junta as linhas do próprio irmão. Cada consulta passa pela
 * RLS, então só volta o que é dele. Dados maçônicos entram só com o consentimento ativo (são dele mesmo).
 * Não incluímos o conteúdo das mensagens de outros: só a contagem das que ele enviou.
 */
export async function exportarMeusDadosServidor(): Promise<Record<string, unknown> | null> {
  if (!supabase) return null;
  const { data: u } = await supabase.auth.getUser();
  const id = u.user?.id;
  if (!id) return null;
  const sb = supabase;
  const [perfil, motos, contatos, consentimentos, posts, mensagens, suporte] = await Promise.all([
    sb.from('perfis').select('*').eq('id', id).maybeSingle(),
    sb.from('motos').select('*').eq('dono', id),
    sb.from('contatos_emergencia').select('*').eq('dono', id),
    sb.from('consentimentos').select('*').eq('usuario_id', id),
    sb.from('posts').select('*').eq('autor', id),
    sb.from('mensagens').select('id', { count: 'exact', head: true }).eq('autor', id),
    sb.from('pedidos_suporte').select('*').eq('usuario_id', id),
  ]);
  for (const r of [perfil, motos, contatos, consentimentos, posts, mensagens, suporte]) {
    if (r.error) throw r.error;
  }
  const lista = (consentimentos.data ?? []) as { finalidade: string; revogado_em: string | null }[];
  const macomAtivo = lista.some((c) => c.finalidade === 'dados_macons' && !c.revogado_em);
  let macom: unknown = null;
  if (macomAtivo) {
    const r = await sb.rpc('ler_macom', { alvo: id });
    if (r.error) throw r.error;
    macom = (r.data as unknown[] | null)?.[0] ?? null;
  }
  return {
    perfil: perfil.data,
    garagem: motos.data ?? [],
    contatosEmergencia: contatos.data ?? [],
    consentimentos: lista,
    dadosMaconicos: macom,
    posts: posts.data ?? [],
    mensagensEnviadas: mensagens.count ?? 0,
    pedidosSuporte: suporte.data ?? [],
  };
}
