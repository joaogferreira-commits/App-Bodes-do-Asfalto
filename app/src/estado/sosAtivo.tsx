import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  atualizarPosicaoSos,
  encerrarSosServidor,
  INTERVALO_SOS_MS,
  iniciarSosServidor,
  lerSos,
  type PosicaoSos,
} from '@/servidor/sos';
import { servidorConfigurado } from '@/servidor/supabase';

/**
 * SOS ativo do próprio irmão (P10). Enquanto está ativo, a posição exata vai para o servidor a cada 30 s
 * (só com o app aberto) e a faixa "SOS ativo" aparece em todas as telas. O id fica guardado no aparelho
 * para a faixa voltar se o app reiniciar; o servidor encerra sozinho em 6 h.
 */
const CHAVE = 'bodes.sosServidor';
export const LIMITE_SOS_MS = 6 * 3_600_000;

export type SosEmCurso = { id: string; tipo: string | null; em: number };

type Valor = {
  ativo: SosEmCurso | null;
  iniciando: boolean;
  /** Avisa o servidor. Pega a posição sozinho se não vier. Devolve false se não foi possível. */
  iniciar: (o: { tipo: string | null; mensagem?: string; posicao?: PosicaoSos | null }) => Promise<boolean>;
  encerrar: () => Promise<void>;
};

const Contexto = createContext<Valor | null>(null);

/** Versão que não exige o provedor (telas testadas sem ele): devolve null. */
export const useSosAtivoOpcional = () => useContext(Contexto);

export function useSosAtivo(): Valor {
  const v = useContext(Contexto);
  if (!v) throw new Error('useSosAtivo fora do ProvedorSosAtivo');
  return v;
}

/**
 * SOS de um gesto (segurar 3 s no modo pilotando, atalho, Android Auto): avisa o servidor sem tipo nem texto,
 * a menos que já exista um SOS ativo ou o app esteja sem servidor (modo local). Nunca lança erro.
 */
export async function sosRapido(
  sos: Valor | null,
  comServidor: boolean = servidorConfigurado,
): Promise<boolean> {
  if (!sos || !comServidor || sos.ativo) return false;
  try {
    return await sos.iniciar({ tipo: null });
  } catch {
    return false;
  }
}

async function posicaoAtual(): Promise<PosicaoSos | null> {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return null;
    const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { lat: p.coords.latitude, lng: p.coords.longitude };
  } catch {
    return null;
  }
}

export function ProvedorSosAtivo({ children }: { children: ReactNode }) {
  const [ativo, setAtivo] = useState<SosEmCurso | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const idAtual = useRef<string | null>(null);
  useEffect(() => {
    idAtual.current = ativo?.id ?? null;
  }, [ativo]);

  // Restaura a faixa depois de reiniciar o app (só se o servidor ainda diz que está ativo).
  useEffect(() => {
    if (!servidorConfigurado) return;
    let vivo = true;
    void (async () => {
      try {
        const bruto = await AsyncStorage.getItem(CHAVE);
        if (!bruto) return;
        const guardado = JSON.parse(bruto) as SosEmCurso;
        if (Date.now() - guardado.em > LIMITE_SOS_MS) throw new Error('vencido');
        const s = await lerSos(guardado.id);
        if (!s || s.encerrado) throw new Error('encerrado');
        if (vivo) setAtivo(guardado);
      } catch {
        void AsyncStorage.removeItem(CHAVE).catch(() => undefined);
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  // Posição exata a cada 30 s enquanto ativo (primeiro plano).
  useEffect(() => {
    if (!ativo) return;
    const id = ativo.id;
    const timer = setInterval(() => {
      void (async () => {
        if (Date.now() - ativo.em > LIMITE_SOS_MS) {
          setAtivo(null);
          void AsyncStorage.removeItem(CHAVE).catch(() => undefined);
          return;
        }
        const p = await posicaoAtual();
        if (p && idAtual.current === id) await atualizarPosicaoSos(id, p);
      })();
    }, INTERVALO_SOS_MS);
    return () => clearInterval(timer);
  }, [ativo]);

  const iniciar = useCallback<Valor['iniciar']>(async (o) => {
    setIniciando(true);
    try {
      const posicao = o.posicao ?? (await posicaoAtual());
      if (!posicao) return false;
      const id = await iniciarSosServidor({ tipo: o.tipo, mensagem: o.mensagem, posicao });
      if (!id) return false;
      const novo = { id, tipo: o.tipo, em: Date.now() };
      setAtivo(novo);
      void AsyncStorage.setItem(CHAVE, JSON.stringify(novo)).catch(() => undefined);
      return true;
    } finally {
      setIniciando(false);
    }
  }, []);

  const encerrar = useCallback(async () => {
    const id = idAtual.current;
    if (!id) return;
    await encerrarSosServidor(id); // se já tinha vencido no servidor, a faixa sai do mesmo jeito
    setAtivo(null);
    void AsyncStorage.removeItem(CHAVE).catch(() => undefined);
  }, []);

  const valor = useMemo(
    () => ({ ativo, iniciando, iniciar, encerrar }),
    [ativo, iniciando, iniciar, encerrar],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
