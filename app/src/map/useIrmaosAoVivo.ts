import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { clienteConsultas } from '@/servidor/consulta';
import { ATUALIZAR_IRMAOS_MS, irmaosNaArea, type IrmaoAoVivo } from '@/servidor/aoVivo';
import type { Area } from '@/servidor/pontos';

import { areaDaChave, chaveDaArea } from './pontos';

const SEM_IRMAOS: IrmaoAoVivo[] = [];

/** Irmãos ao vivo na área visível: espera o mapa parar, e atualiza a cada 30 s só com o app aberto. */
export function useIrmaosAoVivo(ativo: boolean, area: Area | null): IrmaoAoVivo[] {
  const [alvo, setAlvo] = useState<Area | null>(area);
  useEffect(() => {
    const espera = setTimeout(() => setAlvo(area), 600);
    return () => clearTimeout(espera);
  }, [area]);
  const [aberto, setAberto] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    const s = AppState.addEventListener('change', (e) => setAberto(e === 'active'));
    return () => s.remove();
  }, []);

  const chave = useMemo(() => (alvo ? chaveDaArea(alvo, 0.05) : null), [alvo]);
  const consulta = useQuery(
    {
      queryKey: ['irmaos-ao-vivo', ...(chave ?? [])],
      queryFn: () => irmaosNaArea(areaDaChave(chave!)),
      enabled: ativo && !!chave,
      staleTime: ATUALIZAR_IRMAOS_MS / 2,
      gcTime: 60_000,
      refetchInterval: ativo && aberto ? ATUALIZAR_IRMAOS_MS : false,
      placeholderData: keepPreviousData,
    },
    clienteConsultas,
  );
  return ativo ? (consulta.data ?? SEM_IRMAOS) : SEM_IRMAOS;
}
