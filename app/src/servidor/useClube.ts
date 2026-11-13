import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAcessoOpcional } from '@/acesso/acesso';
import type { LugarExemplo } from '@/dados/exemplos';
import type { Negocio } from '@/dados/negocios';

import { clienteConsultas } from './consulta';
import { listarLojas, lojaParaLugar, type Loja } from './lojas';
import { listarMembros, meuAniversario, type Membro, type MeuAniversario } from './membros';
import { listarNegocios, negocioParaLugar, paraGuia, urlsDasFotos, type NegocioServidor } from './negocios';
import { servidorConfigurado } from './supabase';

export const CHAVE_LOJAS = ['lojas'] as const;
export const CHAVE_NEGOCIOS = ['negocios'] as const;
export const CHAVE_MEMBROS = ['membros'] as const;
export const CHAVE_MEU_ANIVERSARIO = ['meuAniversario'] as const;

/** Lojas, Guia, membros e aniversários só existem para membro aprovado com o servidor ligado. */
export function useClubeNoServidor() {
  const acesso = useAcessoOpcional();
  return servidorConfigurado && acesso?.modo === 'supabase' && acesso.estado === 'membro';
}

export function recarregarClube() {
  void clienteConsultas.invalidateQueries({ queryKey: CHAVE_LOJAS });
  void clienteConsultas.invalidateQueries({ queryKey: CHAVE_NEGOCIOS });
}

export function useLojas(): { carregando: boolean; erro: boolean; lojas: Loja[] } {
  const ativo = useClubeNoServidor();
  const q = useQuery({ queryKey: CHAVE_LOJAS, queryFn: listarLojas, enabled: ativo }, clienteConsultas);
  return { carregando: ativo && q.isPending, erro: q.isError, lojas: q.data ?? [] };
}

export function useNegociosServidor(): {
  carregando: boolean;
  erro: boolean;
  brutos: NegocioServidor[];
  guia: Negocio[];
} {
  const ativo = useClubeNoServidor();
  const q = useQuery({ queryKey: CHAVE_NEGOCIOS, queryFn: listarNegocios, enabled: ativo }, clienteConsultas);
  const brutos = useMemo(() => q.data ?? [], [q.data]);
  const caminhos = useMemo(() => brutos.flatMap((n) => n.fotos), [brutos]);
  const urls = useQuery(
    {
      queryKey: ['negociosFotos', caminhos],
      queryFn: () => urlsDasFotos(caminhos).catch(() => ({})),
      enabled: ativo && caminhos.length > 0,
      staleTime: 30 * 60 * 1000,
    },
    clienteConsultas,
  );
  const guia = useMemo(() => brutos.map((n) => paraGuia(n, urls.data ?? {})), [brutos, urls.data]);
  return { carregando: ativo && q.isPending, erro: q.isError, brutos, guia };
}

export function useMembros(): { carregando: boolean; erro: boolean; membros: Membro[] } {
  const ativo = useClubeNoServidor();
  const q = useQuery({ queryKey: CHAVE_MEMBROS, queryFn: listarMembros, enabled: ativo }, clienteConsultas);
  return { carregando: ativo && q.isPending, erro: q.isError, membros: q.data ?? [] };
}

export function useMeuAniversario(): { carregando: boolean; aniversario: MeuAniversario | null } {
  const ativo = useClubeNoServidor();
  const q = useQuery(
    { queryKey: CHAVE_MEU_ANIVERSARIO, queryFn: meuAniversario, enabled: ativo },
    clienteConsultas,
  );
  return { carregando: ativo && q.isPending, aniversario: q.data ?? null };
}

/** Lojas e negócios aprovados com posição, como pinos do mapa (reaproveita os tipos de pino existentes). */
export function useLugaresDoClube(): LugarExemplo[] {
  const ativo = useClubeNoServidor();
  const lojas = useQuery({ queryKey: CHAVE_LOJAS, queryFn: listarLojas, enabled: ativo }, clienteConsultas);
  const neg = useQuery(
    { queryKey: CHAVE_NEGOCIOS, queryFn: listarNegocios, enabled: ativo },
    clienteConsultas,
  );
  return useMemo(
    () => [
      ...(lojas.data ?? []).map(lojaParaLugar).filter((l): l is LugarExemplo => l !== null),
      ...(neg.data ?? []).map(negocioParaLugar).filter((l): l is LugarExemplo => l !== null),
    ],
    [lojas.data, neg.data],
  );
}
