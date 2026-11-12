import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { classificadosExemplo, type Classificado } from '@/dados/classificados';

import { useGuardado } from './guardado';

/** Anúncios do irmão (no aparelho até o Supabase) + os de exemplo; favoritos dos classificados. */
type Valor = {
  todos: Classificado[];
  anunciar: (c: Omit<Classificado, 'id' | 'meu' | 'quando'>) => void;
  marcarVendido: (id: string, vendido: boolean) => void;
  excluir: (id: string) => void;
  favoritos: string[];
  alternarFavorito: (id: string) => void;
};

const Contexto = createContext<Valor | null>(null);

export function ProvedorClassificados({ children }: { children: ReactNode }) {
  const [meus, setMeus] = useGuardado<Classificado[]>('classificados', []);
  const [favoritos, setFavoritos] = useGuardado<string[]>('classificadosFavoritos', []);
  const valor = useMemo<Valor>(
    () => ({
      todos: [...meus, ...classificadosExemplo],
      anunciar: (c) => setMeus((l) => [{ ...c, id: `meu-${Date.now()}`, meu: true, quando: '' }, ...l]),
      marcarVendido: (id, vendido) => setMeus((l) => l.map((x) => (x.id === id ? { ...x, vendido } : x))),
      excluir: (id) => setMeus((l) => l.filter((x) => x.id !== id)),
      favoritos,
      alternarFavorito: (id) =>
        setFavoritos((l) => (l.includes(id) ? l.filter((x) => x !== id) : [id, ...l])),
    }),
    [meus, favoritos, setMeus, setFavoritos],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useClassificados(): Valor {
  const v = useContext(Contexto);
  if (!v) throw new Error('useClassificados precisa do ProvedorClassificados');
  return v;
}
