import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { agapeExemplo } from '@/dados/agape';

export type Agape = typeof agapeExemplo;

type Valor = { agapes: Agape[]; criar: (a: Omit<Agape, 'id' | 'vao' | 'comecaEm'>) => void };
const Contexto = createContext<Valor>({ agapes: [agapeExemplo], criar: () => undefined });

/** Ágapes Relâmpago visíveis (exemplo + os criados pelo irmão nesta sessão; servidor na Etapa 4). */
export function ProvedorAgapes({ children }: { children: ReactNode }) {
  const [criados, setCriados] = useState<Agape[]>([]);
  const valor = useMemo<Valor>(
    () => ({
      agapes: [...criados, agapeExemplo],
      criar: (a) =>
        setCriados((l) => [
          { ...a, id: `agape-${Date.now()}`, vao: [a.organizador], comecaEm: a.horario },
          ...l,
        ]),
    }),
    [criados],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export const useAgapes = () => useContext(Contexto);
