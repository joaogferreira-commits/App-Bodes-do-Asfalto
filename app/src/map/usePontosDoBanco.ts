import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import type { LugarExemplo } from '@/dados/exemplos';
import { clienteConsultas } from '@/servidor/consulta';
import { carregarPontosDaArea, type Area } from '@/servidor/pontos';

import { areaDaChave, chaveDaArea } from './pontos';

/** De longe o pedido seria enorme e o mapa só mostra pontinhos: não busca abaixo deste zoom. */
export const ZOOM_MINIMO_BANCO = 9;
export const ESPERA_REGIAO_MS = 600;
export const VALIDADE_MS = 10 * 60 * 1000;

/**
 * Pontos do banco (public.pontos_osm) para a área visível: espera o mapa parar (debounce), usa a área
 * arredondada como chave (arrastar um pouco não refaz a busca) e guarda por 10 min. Falha = lista vazia.
 */
export function usePontosDoBanco(ativo: boolean, area: Area | null, zoom: number): LugarExemplo[] {
  const [alvo, setAlvo] = useState<Area | null>(area);
  useEffect(() => {
    const espera = setTimeout(() => setAlvo(area), ESPERA_REGIAO_MS);
    return () => clearTimeout(espera);
  }, [area]);

  const chave = useMemo(() => (alvo ? chaveDaArea(alvo) : null), [alvo]);
  const consulta = useQuery(
    {
      queryKey: ['pontos-osm', ...(chave ?? [])],
      queryFn: () => carregarPontosDaArea(areaDaChave(chave!)),
      enabled: ativo && !!chave && zoom >= ZOOM_MINIMO_BANCO,
      staleTime: VALIDADE_MS,
      gcTime: VALIDADE_MS,
      placeholderData: keepPreviousData,
    },
    clienteConsultas,
  );
  return ativo && zoom >= ZOOM_MINIMO_BANCO ? (consulta.data ?? SEM_PONTOS) : SEM_PONTOS;
}

const SEM_PONTOS: LugarExemplo[] = [];
