import { useQuery } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { useAcessoOpcional } from '@/acesso/acesso';
import { agapeExemplo } from '@/dados/agape';
import { criarAgape, listarAgapes } from '@/servidor/agapes';
import { clienteConsultas } from '@/servidor/consulta';
import { servidorConfigurado } from '@/servidor/supabase';

export type Agape = typeof agapeExemplo;
export type NovoAgapeLocal = Omit<Agape, 'id' | 'vao' | 'comecaEm'>;

type Valor = {
  agapes: Agape[];
  /** Devolve false se o servidor recusou (modo local sempre dá certo). */
  criar: (a: NovoAgapeLocal) => Promise<boolean> | boolean;
};
const Contexto = createContext<Valor>({ agapes: [agapeExemplo], criar: () => true });

const CHAVE = ['agapes'] as const;
const SEM_AGAPES: Agape[] = [];

/**
 * Ágapes Relâmpago visíveis. Com o servidor e o irmão aprovado: os do banco (vazio se a tabela não existir).
 * No modo local: o exemplo mais os criados nesta sessão.
 */
export function ProvedorAgapes({ children }: { children: ReactNode }) {
  const acesso = useAcessoOpcional();
  const servidor = servidorConfigurado && acesso?.modo === 'supabase' && acesso.estado === 'membro';
  const [criados, setCriados] = useState<Agape[]>([]);
  const consulta = useQuery(
    {
      queryKey: CHAVE,
      queryFn: () => listarAgapes(),
      enabled: servidor,
      staleTime: 20_000,
      refetchInterval: servidor ? 60_000 : false,
    },
    clienteConsultas,
  );
  const criar = useCallback(
    async (a: NovoAgapeLocal) => {
      if (servidor) {
        const ok = await criarAgape(a);
        if (ok) await clienteConsultas.invalidateQueries({ queryKey: CHAVE });
        return ok;
      }
      setCriados((l) => [
        { ...a, id: `agape-${Date.now()}`, vao: [a.organizador], comecaEm: a.horario },
        ...l,
      ]);
      return true;
    },
    [servidor],
  );
  const valor = useMemo<Valor>(
    () => ({
      agapes: servidor
        ? (consulta.data ?? SEM_AGAPES)
        : servidorConfigurado
          ? SEM_AGAPES
          : [...criados, agapeExemplo],
      criar,
    }),
    [criados, servidor, consulta.data, criar],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export const useAgapes = () => useContext(Contexto);
