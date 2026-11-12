import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Posts e comentários feitos pelo irmão neste aparelho (até o Supabase da Etapa 5).
 * Visibilidade conforme o CLAUDE.md: todos os membros (padrão), só o capítulo ou só amigos.
 */
export type VisibilidadePost = 'todos' | 'capitulo' | 'amigos';
export type Comentario = { id: string; autor: string; texto: string; meu: boolean };
export type MeuPost = {
  id: string;
  texto: string;
  foto?: string;
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
};

const Contexto = createContext<Valor | null>(null);
const CHAVE = 'bodes.meusPosts';

export function ProvedorMeusPosts({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<MeuPost[]>([]);
  const [comentarios, setComentarios] = useState<Record<string, Comentario[]>>({});
  const [carregou, setCarregou] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CHAVE)
      .then((v) => {
        if (v) {
          const d = JSON.parse(v) as { posts: MeuPost[]; comentarios: Record<string, Comentario[]> };
          setPosts(d.posts ?? []);
          setComentarios(d.comentarios ?? {});
        }
      })
      .catch(() => undefined)
      .finally(() => setCarregou(true));
  }, []);

  useEffect(() => {
    if (carregou)
      void AsyncStorage.setItem(CHAVE, JSON.stringify({ posts, comentarios })).catch(() => undefined);
  }, [posts, comentarios, carregou]);

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
    }),
    [posts, comentarios],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useMeusPosts(): Valor {
  const v = useContext(Contexto);
  if (!v) throw new Error('useMeusPosts precisa do ProvedorMeusPosts');
  return v;
}
