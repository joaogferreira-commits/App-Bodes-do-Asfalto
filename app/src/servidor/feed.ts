import type { ConteudoStory } from '@/stories/estilos';

import { supabase } from './supabase';

/**
 * Feed, comentários, TFA, salvos, stories, denúncias e bloqueios no servidor (P4).
 * Tudo passa pela RLS do banco; mídias ficam em buckets privados e são exibidas por URL assinada.
 */
export type VisibilidadeServidor = 'todos' | 'capitulo' | 'amigos';

export type PostServidor = {
  id: string;
  autorId: string;
  autorNome: string;
  autorApelido: string | null;
  capitulo: string | null;
  texto: string;
  visibilidade: VisibilidadeServidor;
  /** URLs assinadas (expiram): só para exibir. */
  fotos: string[];
  enquete: string[] | null;
  criadoEm: string;
  tfa: number;
  comentarios: number;
  euDeiTfa: boolean;
  salvo: boolean;
  meu: boolean;
};

export type ComentarioServidor = {
  id: string;
  autorId: string;
  autor: string;
  texto: string;
  criadoEm: string;
  meu: boolean;
};

export type StoryServidor = {
  id: string;
  autorId: string;
  autor: string;
  criadoEm: string;
  expiraEm: string;
  meu: boolean;
  conteudo: ConteudoStory;
};

export type AlvoDenuncia = 'post' | 'comentario' | 'mensagem' | 'story' | 'usuario' | 'classificado';

export const TAMANHO_PAGINA = 20;
const VALIDADE_URL_S = 3600;

function exigir() {
  if (!supabase) throw new Error('servidor não configurado');
  return supabase;
}

async function meuId() {
  const { data } = await exigir().auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('sem sessão');
  return id;
}

async function assinar(bucket: 'feed' | 'stories', caminhos: string[]): Promise<Record<string, string>> {
  if (!caminhos.length) return {};
  const { data } = await exigir().storage.from(bucket).createSignedUrls(caminhos, VALIDADE_URL_S);
  const mapa: Record<string, string> = {};
  for (const x of data ?? []) if (x.path && x.signedUrl) mapa[x.path] = x.signedUrl;
  return mapa;
}

async function subir(bucket: 'feed' | 'stories', uid: string, uri: string, ext: 'jpg' | 'mp4', indice = 0) {
  const corpo = await (await fetch(uri)).arrayBuffer();
  const caminho = `${uid}/${Date.now()}-${indice}.${ext}`;
  const { error } = await exigir()
    .storage.from(bucket)
    .upload(caminho, corpo, { contentType: ext === 'jpg' ? 'image/jpeg' : 'video/mp4' });
  if (error) throw error;
  return caminho;
}

type Embutido<T> = T | T[] | null;
const um = <T>(v: Embutido<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);
const contagem = (v: { count: number }[] | null | undefined) => v?.[0]?.count ?? 0;

type LinhaPost = {
  id: string;
  autor: string;
  texto: string;
  visibilidade: VisibilidadeServidor;
  midias: { path: string; tipo: string }[] | null;
  enquete: { opcoes?: string[] } | null;
  criado_em: string;
  perfis: Embutido<{ nome: string; apelido: string | null; capitulos: Embutido<{ nome: string }> }>;
  reacoes_tfa: { count: number }[] | null;
  comentarios: { count: number }[] | null;
};

/** Posts mais recentes primeiro. `antesDe` = criadoEm do último post já carregado (paginação). */
export async function listarPosts(antesDe?: string, limite = TAMANHO_PAGINA): Promise<PostServidor[]> {
  const sb = exigir();
  const eu = await meuId();
  let q = sb
    .from('posts')
    .select(
      'id, autor, texto, visibilidade, midias, enquete, criado_em, perfis!autor(nome, apelido, capitulos(nome)), reacoes_tfa(count), comentarios(count)',
    )
    .order('criado_em', { ascending: false })
    .limit(limite);
  if (antesDe) q = q.lt('criado_em', antesDe);
  const { data, error } = await q;
  if (error) throw error;
  const linhas = (data ?? []) as unknown as LinhaPost[];
  const ids = linhas.map((l) => l.id);
  const [minhas, salvos, urls] = await Promise.all([
    ids.length
      ? sb.from('reacoes_tfa').select('post_id').eq('usuario_id', eu).in('post_id', ids)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    ids.length
      ? sb.from('salvos').select('post_id').eq('usuario_id', eu).in('post_id', ids)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    assinar(
      'feed',
      linhas.flatMap((l) => (l.midias ?? []).filter((m) => m.tipo === 'foto').map((m) => m.path)),
    ),
  ]);
  const dei = new Set((minhas.data ?? []).map((x) => x.post_id));
  const guardados = new Set((salvos.data ?? []).map((x) => x.post_id));
  return linhas.map((l) => {
    const perfil = um(l.perfis);
    return {
      id: l.id,
      autorId: l.autor,
      autorNome: perfil?.nome ?? '',
      autorApelido: perfil?.apelido ?? null,
      capitulo: um(perfil?.capitulos ?? null)?.nome ?? null,
      texto: l.texto,
      visibilidade: l.visibilidade,
      fotos: (l.midias ?? [])
        .filter((m) => m.tipo === 'foto')
        .map((m) => urls[m.path])
        .filter((u): u is string => !!u),
      enquete: l.enquete?.opcoes ?? null,
      criadoEm: l.criado_em,
      tfa: contagem(l.reacoes_tfa),
      comentarios: contagem(l.comentarios),
      euDeiTfa: dei.has(l.id),
      salvo: guardados.has(l.id),
      meu: l.autor === eu,
    };
  });
}

/** Publica um post. As fotos (já sem EXIF) sobem para feed/<uid>/ antes da linha do post. */
export async function publicarPost(p: {
  texto: string;
  visibilidade: VisibilidadeServidor;
  fotos?: string[];
  enquete?: string[];
}): Promise<string> {
  const sb = exigir();
  const uid = await meuId();
  const caminhos: string[] = [];
  try {
    for (const [i, uri] of (p.fotos ?? []).entries()) caminhos.push(await subir('feed', uid, uri, 'jpg', i));
    const { data, error } = await sb
      .from('posts')
      .insert({
        texto: p.texto,
        visibilidade: p.visibilidade,
        midias: caminhos.map((path) => ({ path, tipo: 'foto' })),
        enquete: p.enquete?.length ? { opcoes: p.enquete } : null,
      })
      .select('id')
      .single();
    if (error) throw error;
    return (data as { id: string }).id;
  } catch (e) {
    // não deixa arquivo órfão se o post não foi criado
    if (caminhos.length)
      await sb.storage
        .from('feed')
        .remove(caminhos)
        .catch(() => undefined);
    throw e;
  }
}

export async function apagarPost(id: string) {
  const sb = exigir();
  const { data } = await sb.from('posts').select('midias').eq('id', id).maybeSingle();
  const { error } = await sb.from('posts').delete().eq('id', id);
  if (error) throw error;
  const caminhos = ((data as { midias?: { path: string }[] } | null)?.midias ?? []).map((m) => m.path);
  if (caminhos.length)
    await sb.storage
      .from('feed')
      .remove(caminhos)
      .catch(() => undefined);
}

/** Dá ou tira o TFA. Devolve o novo estado (true = agora tem TFA). */
export async function alternarTfa(postId: string, jaDei: boolean): Promise<boolean> {
  const sb = exigir();
  const uid = await meuId();
  if (jaDei) {
    const { error } = await sb.from('reacoes_tfa').delete().eq('post_id', postId).eq('usuario_id', uid);
    if (error) throw error;
    return false;
  }
  const { error } = await sb.from('reacoes_tfa').insert({ post_id: postId });
  if (error) throw error;
  return true;
}

export async function alternarSalvo(postId: string, jaSalvo: boolean): Promise<boolean> {
  const sb = exigir();
  const uid = await meuId();
  if (jaSalvo) {
    const { error } = await sb.from('salvos').delete().eq('post_id', postId).eq('usuario_id', uid);
    if (error) throw error;
    return false;
  }
  const { error } = await sb.from('salvos').insert({ post_id: postId });
  if (error) throw error;
  return true;
}

export async function listarComentarios(postId: string): Promise<ComentarioServidor[]> {
  const eu = await meuId();
  const { data, error } = await exigir()
    .from('comentarios')
    .select('id, autor, texto, criado_em, perfis!autor(nome, apelido)')
    .eq('post_id', postId)
    .order('criado_em');
  if (error) throw error;
  type L = {
    id: string;
    autor: string;
    texto: string;
    criado_em: string;
    perfis: Embutido<{ nome: string; apelido: string | null }>;
  };
  return ((data ?? []) as unknown as L[]).map((c) => {
    const p = um(c.perfis);
    return {
      id: c.id,
      autorId: c.autor,
      autor: p?.apelido || p?.nome || '',
      texto: c.texto,
      criadoEm: c.criado_em,
      meu: c.autor === eu,
    };
  });
}

export async function comentar(postId: string, texto: string) {
  const { error } = await exigir().from('comentarios').insert({ post_id: postId, texto });
  if (error) throw error;
}

export async function apagarComentario(id: string) {
  const { error } = await exigir().from('comentarios').delete().eq('id', id);
  if (error) throw error;
}

/** Denúncia: o servidor confere que o denunciante enxerga o alvo e copia um trecho para a moderação. */
export async function denunciar(alvoTipo: AlvoDenuncia, alvoId: string, motivo: string) {
  const { error } = await exigir().from('denuncias').insert({ alvo_tipo: alvoTipo, alvo_id: alvoId, motivo });
  if (error) throw error;
}

export async function bloquear(usuario: string) {
  const { error } = await exigir().from('bloqueios').insert({ bloqueado: usuario });
  if (error) throw error;
}

/** Stories ainda válidos (a RLS já esconde os expirados; o filtro aqui é só por segurança). */
export async function listarStories(): Promise<StoryServidor[]> {
  const eu = await meuId();
  const { data, error } = await exigir()
    .from('stories')
    .select('id, autor, midia_path, tipo, conteudo, criado_em, expira_em, perfis!autor(nome, apelido)')
    .gt('expira_em', new Date().toISOString())
    .order('criado_em', { ascending: false });
  if (error) throw error;
  type L = {
    id: string;
    autor: string;
    midia_path: string | null;
    tipo: 'foto' | 'video' | 'texto';
    conteudo: Partial<ConteudoStory>;
    criado_em: string;
    expira_em: string;
    perfis: Embutido<{ nome: string; apelido: string | null }>;
  };
  const linhas = (data ?? []) as unknown as L[];
  const urls = await assinar(
    'stories',
    linhas.map((l) => l.midia_path).filter((p): p is string => !!p),
  );
  return linhas.map((l) => {
    const p = um(l.perfis);
    const c = l.conteudo ?? {};
    return {
      id: l.id,
      autorId: l.autor,
      autor: p?.apelido || p?.nome || '',
      criadoEm: l.criado_em,
      expiraEm: l.expira_em,
      meu: l.autor === eu,
      conteudo: {
        ...c,
        uri: (l.midia_path && urls[l.midia_path]) || '',
        tipo: l.tipo === 'video' ? 'video' : 'foto',
        filtro: c.filtro ?? 'nenhum',
        textos: c.textos ?? [],
        selos: c.selos ?? {},
      },
    };
  });
}

/** Sobe a mídia para stories/<uid>/ e grava o conteúdo (sem o caminho local do aparelho). */
export async function publicarStory(c: ConteudoStory): Promise<string> {
  const sb = exigir();
  const uid = await meuId();
  const caminho = await subir('stories', uid, c.uri, c.tipo === 'video' ? 'mp4' : 'jpg');
  const { uri: _local, ...resto } = c;
  void _local;
  const { data, error } = await sb
    .from('stories')
    .insert({ midia_path: caminho, tipo: c.tipo, conteudo: resto })
    .select('id')
    .single();
  if (error) {
    await sb.storage
      .from('stories')
      .remove([caminho])
      .catch(() => undefined);
    throw error;
  }
  return (data as { id: string }).id;
}

export async function apagarStory(id: string) {
  const sb = exigir();
  const { data } = await sb.from('stories').select('midia_path').eq('id', id).maybeSingle();
  const { error } = await sb.from('stories').delete().eq('id', id);
  if (error) throw error;
  const caminho = (data as { midia_path?: string | null } | null)?.midia_path;
  if (caminho)
    await sb.storage
      .from('stories')
      .remove([caminho])
      .catch(() => undefined);
}
