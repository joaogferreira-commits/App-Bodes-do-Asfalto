import type { ConteudoStory } from '@/stories/estilos';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

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
  publicar: (p: Omit<MeuPost, 'id' | 'criadoEm'>) => void;
  editar: (id: string, p: Partial<Omit<MeuPost, 'id' | 'criadoEm'>>) => void;
  excluir: (id: string) => void;
  comentar: (postId: string, texto: string, autor: string) => void;
  apagarComentario: (postId: string, id: string) => void;
  salvos: string[];
  alternarSalvo: (postId: string) => void;
  stories: MeuStory[];
  publicarStory: (conteudo: ConteudoStory) => void;
  apagarStory: (id: string) => void;
};

const Contexto = createContext<Valor | null>(null);
const CHAVE = 'bodes.meusPosts';

export function ProvedorMeusPosts({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<MeuPost[]>([]);
  const [comentarios, setComentarios] = useState<Record<string, Comentario[]>>({});
  const [salvos, setSalvos] = useState<string[]>([]);
  const [stories, setStories] = useState<MeuStory[]>([]);
  const [carregou, setCarregou] = useState(false);

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
    if (carregou)
      void AsyncStorage.setItem(CHAVE, JSON.stringify({ posts, comentarios, salvos, stories })).catch(
        () => undefined,
      );
  }, [posts, comentarios, salvos, stories, carregou]);

  const valor = useMemo<Valor>(
    () => ({
      posts,
      comentarios,
      publicar: (p) => setPosts((l) => [{ ...p, id: `meu-${Date.now()}`, criadoEm: Date.now() }, ...l]),
      editar: (id, p) =>
        setPosts((l) => l.map((x) => (x.id === id ? { ...x, ...p, editadoEm: Date.now() } : x))),
      excluir: (id) => setPosts((l) => l.filter((x) => x.id !== id)),
      comentar: (postId, texto, autor) =>
        setComentarios((c) => ({
          ...c,
          [postId]: [...(c[postId] ?? []), { id: `c-${Date.now()}`, autor, texto, meu: true }],
        })),
      apagarComentario: (postId, id) =>
        setComentarios((c) => ({ ...c, [postId]: (c[postId] ?? []).filter((x) => x.id !== id) })),
      salvos,
      alternarSalvo: (id) => setSalvos((l) => (l.includes(id) ? l.filter((x) => x !== id) : [id, ...l])),
      stories: storiesAtivos(stories),
      publicarStory: (conteudo) =>
        setStories((l) => [
          {
            id: `story-${Date.now()}`,
            foto: conteudo.uri,
            legenda: conteudo.textos[0]?.texto ?? '',
            criadoEm: Date.now(),
            conteudo,
          },
          ...storiesAtivos(l),
        ]),
      apagarStory: (id) => setStories((l) => l.filter((x) => x.id !== id)),
    }),
    [posts, comentarios, salvos, stories],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useMeusPosts(): Valor {
  const v = useContext(Contexto);
  if (!v) throw new Error('useMeusPosts precisa do ProvedorMeusPosts');
  return v;
}
