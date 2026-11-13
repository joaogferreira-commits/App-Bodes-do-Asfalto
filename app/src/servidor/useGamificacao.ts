import { useQuery } from '@tanstack/react-query';

import { useAcessoOpcional } from '@/acesso/acesso';

import { clienteConsultas } from './consulta';
import {
  CHAVE_RANKING,
  carregarMeuProgresso,
  carregarRanking,
  type LinhaRanking,
  type MeuProgresso,
  type PeriodoRanking,
} from './desafios';
import { servidorConfigurado } from './supabase';

export const CHAVE_MEU_PROGRESSO = ['meuProgresso'] as const;

/** Servidor vale para membro aprovado com o Supabase configurado; senão a aba segue com os números de exemplo. */
export function useGamificacaoServidor() {
  const acesso = useAcessoOpcional();
  return servidorConfigurado && acesso?.modo === 'supabase' && acesso.estado === 'membro';
}

export function useMeuProgresso(): { servidor: boolean; dados: MeuProgresso | undefined } {
  const servidor = useGamificacaoServidor();
  const q = useQuery(
    {
      queryKey: CHAVE_MEU_PROGRESSO,
      queryFn: () => carregarMeuProgresso(),
      enabled: servidor,
      staleTime: 30_000,
    },
    clienteConsultas,
  );
  return { servidor, dados: q.data };
}

export function useRanking(capitulo: string | null, periodo: PeriodoRanking, meuId: string | null) {
  const servidor = useGamificacaoServidor();
  const q = useQuery(
    {
      queryKey: [...CHAVE_RANKING, capitulo, periodo],
      queryFn: (): Promise<LinhaRanking[]> => carregarRanking(capitulo, periodo, meuId),
      enabled: servidor && meuId !== null,
      staleTime: 30_000,
    },
    clienteConsultas,
  );
  return { carregando: q.isLoading, linhas: q.data ?? [] };
}
