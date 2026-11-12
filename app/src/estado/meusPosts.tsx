import type { ConteudoStory } from '@/stories/estilos';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAcessoOpcional } from '@/acesso/acesso';
import * as feed from '@/servidor/feed';
import type { AlvoDenuncia, PostServidor, StoryServidor } from '@/servidor/feed';
import { servidorConfigurado } from '@/servidor/supabase';

/**
 * Posts e comentários feitos pelo irmão neste aparelho (até o Supabase da Etapa 5).
 * Visibilidade conforme o CLAUDE.md: todos os membros (padrão), só o capítulo ou só amigos.
 */
export type VisibilidadePost = 'todos' | 'capitulo' | 'amigos';
export type Comentario = { id: string; autor: string; texto: string; meu: boolean };
/** Story do irmão: some sozinho 24 h depois. */
export type MeuStory = {
  id: string;
  foto: string;
  legenda: string;
  criadoEm: number;
  /** stories v2: vídeo, filtro, textos e selos (os antigos só têm foto e legenda) */
  conteudo?: ConteudoStory;
};
export const DURACAO_STORY_MS = 24 * 60 * 60 * 1000;
export const storiesAtivos = (l: MeuStory[], agora = Date.now()) =>
  l.filter((x) => agora - x.criadoEm < DURACAO_STORY_MS);

export type MeuPost = {
  id: string;
  texto: string;
  foto?: string;
  /** Opções da enquete (o texto é a pergunta). */
  enquete?: string[];
  visibilidade: VisibilidadePost;
  criadoEm: number;
  editadoEm?: number;
};

type Valor = {
  posts: MeuPost[];
  comentarios: Record<string, Comentario[]>;
  publicar: (p: Omit<MeuPost, 'id' | 'criadoEm'>) => void | Promise<void>;
  editar: (id: string, p: Partial<Omit<MeuPost, 'id' | 'criadoEm'>>) => void;
  excluir: (id: string) => void;
  comentar: (postId: string, texto: string, autor: string) => void;
  apagarComentario: (postId: string, id: string) => void;
  salvos: string[];
  alternarSalvo: (postId: string) => void;
  stories: MeuStory[];
  publicarStory: (conteudo: ConteudoStory) => void | Promise<void>;
  apagarStory: (id: string) => void;
  /** Ligado ao servidor (feed real): as listas abaixo valem; as locais ficam vazias. */
  servidor: boolean;
  postsServidor: PostServidor[];
  /** Stories de outros irmãos (os meus ficam em `stories`). */
  storiesDeOutros: StoryServidor[];
  carregandoServidor: boolean;
  falhaServidor: boolean;
  temMais: boolean;
  recarregar: () => Promise<void>;
  carregarMais: () => Promise<void>;
  alternarTfa: (postId: string) => Promise<void>;
  denunciar: (tipo: AlvoDenuncia, id: string, motivo: string) => Promise<void>;
  /** Bloqueia o irmão: o que ele publicou some na hora. */
  bloquear: (usuarioId: string) => Promise<void>;
};

const Contexto = createContext<Valor | null>(null);
const CHAVE = 'bodes.meusPosts';

const doServidor = (s: StoryServidor): MeuStory => ({
  id: s.id,
  foto: s.conteudo.uri,
  legenda: s.conteudo.textos[0]?.texto ?? '',
  criadoEm: Date.parse(s.criadoEm),
  conteudo: s.conteudo,
});

export function ProvedorMeusPosts({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<MeuPost[]>([]);
  const [comentarios, setComentarios] = useState<Record<string, Comentario[]>>({});
  const [salvos, setSalvos] = useState<string[]>([]);
  const [stories, setStories] = useState<MeuStory[]>([]);
  const [carregou, setCarregou] = useState(false);

  // Feed real: só com o app ligado ao servidor e o irmão aprovado.
  const acesso = useAcessoOpcional();
  const servidor = servidorConfigurado && acesso?.modo === 'supabase' && acesso.estado === 'membro';
  const [postsSrv, setPostsSrv] = useState<PostServidor[]>([]);
  const [storiesSrv, setStoriesSrv] = useState<StoryServidor[]>([]);
  const [carregandoSrv, setCarregandoSrv] = useState(false);
  const [falhaSrv, setFalhaSrv] = useState(false);
  const [temMais, setTemMais] = useState(false);

  const recarregar = useCallback(async () => {
    if (!servidor) return;
    setCarregandoSrv(true);
    try {
      const [p, s] = await Promise.all([feed.listarPosts(), feed.listarStories()]);
      setPostsSrv(p);
      setStoriesSrv(s);
      setTemMais(p.length >= feed.TAMANHO_PAGINA);
      setFalhaSrv(false);
    } catch {
      setFalhaSrv(true);
    } finally {
      setCarregandoSrv(false);
    }
  }, [servidor]);

  useEffect(() => {
    if (servidor) void Promise.resolve().then(recarregar);
  }, [servidor, recarregar]);

  const carregarMais = useCallback(async () => {
    if (!servidor || !temMais || carregandoSrv) return;
    const ultimo = postsSrv[postsSrv.length - 1];
    if (!ultimo) return;
    setCarregandoSrv(true);
    try {
      const p = await feed.listarPosts(ultimo.criadoEm);
      setPostsSrv((l) => [...l, ...p.filter((x) => !l.some((y) => y.id === x.id))]);
      setTemMais(p.length >= feed.TAMANHO_PAGINA);
    } catch {
      setFalhaSrv(true);
    } finally {
      setCarregandoSrv(false);
    }
  }, [servidor, temMais, carregandoSrv, postsSrv]);

  useEffect(() => {
    AsyncStorage.getItem(CHAVE)
      .then((v) => {
        if (v) {
          const d = JSON.parse(v) as {
            posts: MeuPost[];
            comentarios: Record<string, Comentario[]>;
            salvos?: string[];
            stories?: MeuStory[];
          };
          setPosts(d.posts ?? []);
          setComentarios(d.comentarios ?? {});
          setSalvos(d.salvos ?? []);
          setStories(storiesAtivos(d.stories ?? []));
        }
      })
      .catch(() => undefined)
      .finally(() => setCarregou(true));
  }, []);

  useEffect(() => {
    if (carregou && !servidor)
      void AsyncStorage.setItem(CHAVE, JSON.stringify({ posts, comentarios, salvos, stories })).catch(
        () => undefined,
      );
  }, [posts, comentarios, salvos, stories, carregou, servidor]);

  const valor = useMemo<Valor>(
    () => ({
      servidor,
      postsServidor: postsSrv,
      storiesDeOutros: storiesSrv.filter((x) => !x.meu),
      carregandoServidor: carregandoSrv,
      falhaServidor: falhaSrv,
      temMais,
      recarregar,
      carregarMais,
      alternarTfa: async (postId) => {
        if (!servidor) return;
        const atual = postsSrv.find((x) => x.id === postId);
        if (!atual) return;
        const agora = await feed.alternarTfa(postId, atual.euDeiTfa);
        setPostsSrv((l) =>
          l.map((x) =>
            x.id === postId ? { ...x, euDeiTfa: agora, tfa: Math.max(0, x.tfa + (agora ? 1 : -1)) } : x,
          ),
        );
      },
      denunciar: async (tipo, id, motivo) => {
        if (servidor) await feed.denunciar(tipo, id, motivo);
      },
      bloquear: async (usuarioId) => {
        if (!servidor) return;
        await feed.bloquear(usuarioId);
        setPostsSrv((l) => l.filter((x) => x.autorId !== usuarioId));
        setStoriesSrv((l) => l.filter((x) => x.autorId !== usuarioId));
      },
      posts: servidor ? [] : posts,
      comentarios: servidor ? {} : comentarios,
      publicar: (p) =>
        servidor
          ? feed
              .publicarPost({
                texto: p.texto,
                visibilidade: p.visibilidade,
                fotos: p.foto ? [p.foto] : [],
                enquete: p.enquete,
              })
              .then(recarregar)
          : setPosts((l) => [{ ...p, id: `meu-${Date.now()}`, criadoEm: Date.now() }, ...l]),
      editar: (id, p) =>
        setPosts((l) => l.map((x) => (x.id === id ? { ...x, ...p, editadoEm: Date.now() } : x))),
      excluir: (id) =>
        servidor
          ? void feed
              .apagarPost(id)
              .then(() => setPostsSrv((l) => l.filter((x) => x.id !== id)))
              .catch(() => setFalhaSrv(true))
          : setPosts((l) => l.filter((x) => x.id !== id)),
      comentar: (postId, texto, autor) =>
        setComentarios((c) => ({
          ...c,
          [postId]: [...(c[postId] ?? []), { id: `c-${Date.now()}`, autor, texto, meu: true }],
        })),
      apagarComentario: (postId, id) =>
        setComentarios((c) => ({ ...c, [postId]: (c[postId] ?? []).filter((x) => x.id !== id) })),
      salvos: servidor ? postsSrv.filter((x) => x.salvo).map((x) => x.id) : salvos,
      alternarSalvo: (id) => {
        if (!servidor) return setSalvos((l) => (l.includes(id) ? l.filter((x) => x !== id) : [id, ...l]));
        const atual = postsSrv.find((x) => x.id === id);
        if (!atual) return;
        void feed
          .alternarSalvo(id, atual.salvo)
          .then((agora) => setPostsSrv((l) => l.map((x) => (x.id === id ? { ...x, salvo: agora } : x))))
          .catch(() => setFalhaSrv(true));
      },
      stories: servidor ? storiesSrv.filter((x) => x.meu).map(doServidor) : storiesAtivos(stories),
      publicarStory: (conteudo) =>
        servidor
          ? feed.publicarStory(conteudo).then(recarregar)
          : setStories((l) => [
              {
                id: `story-${Date.now()}`,
                foto: conteudo.uri,
                legenda: conteudo.textos[0]?.texto ?? '',
                criadoEm: Date.now(),
                conteudo,
              },
              ...storiesAtivos(l),
            ]),
      apagarStory: (id) =>
        servidor
          ? void feed
              .apagarStory(id)
              .then(() => setStoriesSrv((l) => l.filter((x) => x.id !== id)))
              .catch(() => setFalhaSrv(true))
          : setStories((l) => l.filter((x) => x.id !== id)),
    }),
    [
      posts,
      comentarios,
      salvos,
      stories,
      servidor,
      postsSrv,
      storiesSrv,
      carregandoSrv,
      falhaSrv,
      temMais,
      recarregar,
      carregarMais,
    ],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useMeusPosts(): Valor {
  const v = useContext(Contexto);
  if (!v) throw new Error('useMeusPosts precisa do ProvedorMeusPosts');
  return v;
}
