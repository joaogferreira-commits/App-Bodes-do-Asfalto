import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { desafiosExemplo, type Desafio } from '@/dados/desafios';

import { useGuardado } from './guardado';

/** Desafios no aparelho (até o Supabase): criados por mim, os que entrei (km do GPS na entrada). */
export function useDesafios() {
  const [criados, setCriados] = useGuardado<Desafio[]>('desafiosCriados', []);
  const [entrei, setEntrei] = useGuardado<Record<string, number>>('desafiosEntrei', {});
  const [kmGps, setKmGps] = useState(0);
  useEffect(() => {
    void AsyncStorage.getItem('bodes.kmGps')
      .then((v) => setKmGps(v ? Number(JSON.parse(v)) || 0 : 0))
      .catch(() => undefined);
  }, []);
  const todos = [...desafiosExemplo, ...criados];
  return {
    todos,
    criados,
    kmGps,
    entrei,
    criar: (d: Desafio) => setCriados((l) => [...l, d]),
    /** Modo de teste: a aprovação de verdade é da diretoria ou de um moderador, no painel. */
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
      d.tipo === 'km' && d.id in entrei ? Math.max(0, kmGps - (entrei[d.id] ?? 0)) : 0,
  };
}
