import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAcessoOpcional } from '@/acesso/acesso';
import { desafiosExemplo, type Desafio } from '@/dados/desafios';
import { clienteConsultas } from '@/servidor/consulta';
import {
  CHAVE_DESAFIOS,
  carregarMeuProgresso,
  criarDesafioServidor,
  entrarDesafioServidor,
  listarDesafios,
  sairDesafioServidor,
  sincronizarKm,
  type NovoDesafioServidor,
} from '@/servidor/desafios';
import { CHAVE_MEU_PROGRESSO } from '@/servidor/useGamificacao';
import { servidorConfigurado } from '@/servidor/supabase';

import { useGuardado } from './guardado';

const VAZIO: Desafio[] = [];

/**
 * Desafios. No modo servidor (membro aprovado) vêm do banco: criar vai para a aprovação, participar e o
 * progresso valem no servidor. No modo local seguem no aparelho (criados por mim, os que entrei).
 */
export function useDesafios() {
  const acesso = useAcessoOpcional();
  const servidor = servidorConfigurado && acesso?.modo === 'supabase' && acesso.estado === 'membro';
  const [criadosLocal, setCriados] = useGuardado<Desafio[]>('desafiosCriados', []);
  const [entreiLocal, setEntrei] = useGuardado<Record<string, number>>('desafiosEntrei', {});
  const [marcadores, setMarcadores] = useGuardado<Record<string, number>>('desafiosEnviado', {});
  const [kmGps, setKmGps] = useState(0);
  useEffect(() => {
    void AsyncStorage.getItem('bodes.kmGps')
      .then((v) => setKmGps(v ? Number(JSON.parse(v)) || 0 : 0))
      .catch(() => undefined);
  }, []);

  const consulta = useQuery(
    { queryKey: CHAVE_DESAFIOS, queryFn: () => listarDesafios(), enabled: servidor, staleTime: 15_000 },
    clienteConsultas,
  );
  const eu = useQuery(
    {
      queryKey: CHAVE_MEU_PROGRESSO,
      queryFn: () => carregarMeuProgresso(),
      enabled: servidor,
      staleTime: 60_000,
    },
    clienteConsultas,
  );
  const lista = servidor ? (consulta.data ?? VAZIO) : VAZIO;

  // Leva o odômetro do aparelho ao servidor (o banco confere salto, velocidade e teto diário).
  useEffect(() => {
    if (!servidor || !lista.length || !kmGps) return;
    let vivo = true;
    void sincronizarKm(lista, kmGps, marcadores).then((novos) => {
      if (!vivo) return;
      if (JSON.stringify(novos) !== JSON.stringify(marcadores)) setMarcadores(novos);
      if (lista.some((d) => d.participo && novos[d.id] !== marcadores[d.id]))
        void clienteConsultas.invalidateQueries({ queryKey: CHAVE_DESAFIOS });
    });
    return () => {
      vivo = false;
    };
    // só quando a lista ou o odômetro mudam
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servidor, lista, kmGps]);

  const recarregar = useCallback(() => clienteConsultas.invalidateQueries({ queryKey: CHAVE_DESAFIOS }), []);

  return useMemo(() => {
    if (servidor) {
      const meuId = eu.data?.id ?? null;
      const entrei: Record<string, number> = {};
      for (const d of lista) if (d.participo) entrei[d.id] = d.kmFeitos ?? 0;
      return {
        servidor: true as const,
        carregando: consulta.isLoading,
        todos: lista,
        criados: lista.filter((d) => d.situacao === 'aguardando' && meuId !== null && d.criadorId === meuId),
        kmGps,
        entrei,
        criar: async (d: NovoDesafioServidor) => {
          const r = await criarDesafioServidor(d);
          if (r.ok) await recarregar();
          return r;
        },
        aprovarTeste: undefined,
        participar: async (id: string) => {
          const r = await entrarDesafioServidor(id);
          if (r.ok) {
            setMarcadores((m) => ({ ...m, [id]: kmGps }));
            await recarregar();
          }
          return r;
        },
        sair: async (id: string) => {
          const r = await sairDesafioServidor(id);
          if (r.ok) await recarregar();
          return r;
        },
        progresso: (d: Desafio) => (d.participo ? Math.round(d.kmFeitos ?? 0) : 0),
      };
    }
    return {
      servidor: false as const,
      carregando: false,
      todos: [...desafiosExemplo, ...criadosLocal],
      criados: criadosLocal,
      kmGps,
      entrei: entreiLocal,
      criar: (d: Desafio) => setCriados((l) => [...l, d]),
      /** Modo de teste: a aprovação de verdade é da diretoria ou de um moderador. */
      aprovarTeste: (id: string) =>
        setCriados((l) =>
          l.map((d) => (d.id === id ? { ...d, situacao: 'ativo', aprovadoPor: 'moderador' } : d)),
        ),
      participar: (id: string) => setEntrei((e) => (id in e ? e : { ...e, [id]: kmGps })),
      sair: (id: string) =>
        setEntrei((e) => {
          const n = { ...e };
          delete n[id];
          return n;
        }),
      progresso: (d: Desafio) =>
        d.tipo === 'km' && d.id in entreiLocal ? Math.max(0, kmGps - (entreiLocal[d.id] ?? 0)) : 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servidor, lista, consulta.isLoading, eu.data, kmGps, criadosLocal, entreiLocal]);
}
