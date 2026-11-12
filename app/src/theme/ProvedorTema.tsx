import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { paletaNoite, paletaSol, type Paleta } from './tokens';

export type ModoTema = 'noite' | 'sol';
export type PreferenciaTema = 'auto' | ModoTema;

const CHAVE = 'bodes.tema';

/**
 * Troca automática (R17): "sol" das 6h às 18h, "noite" no resto do dia.
 * Aproximação do nascer e pôr do sol no Brasil, sem pedir localização.
 */
export function modoPelaHora(data: Date): ModoTema {
  const h = data.getHours();
  return h >= 6 && h < 18 ? 'sol' : 'noite';
}

export function resolverModo(preferencia: PreferenciaTema, agora: Date): ModoTema {
  return preferencia === 'auto' ? modoPelaHora(agora) : preferencia;
}

type ValorTema = {
  modo: ModoTema;
  cores: Paleta;
  preferencia: PreferenciaTema;
  definirPreferencia: (p: PreferenciaTema) => void;
};

const Contexto = createContext<ValorTema>({
  modo: 'noite',
  cores: paletaNoite,
  preferencia: 'auto',
  definirPreferencia: () => undefined,
});

export function ProvedorTema({ children, inicial }: { children: ReactNode; inicial?: PreferenciaTema }) {
  const [preferencia, setPreferencia] = useState<PreferenciaTema>(inicial ?? 'auto');
  const [agora, setAgora] = useState(() => new Date());

  useEffect(() => {
    if (inicial) return;
    let ativo = true;
    AsyncStorage.getItem(CHAVE)
      .then((v) => {
        if (ativo && (v === 'auto' || v === 'noite' || v === 'sol')) setPreferencia(v);
      })
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, [inicial]);

  // Confere a hora a cada minuto (só importa no modo automático).
  useEffect(() => {
    if (preferencia !== 'auto') return;
    const id = setInterval(() => setAgora(new Date()), 60_000);
    return () => clearInterval(id);
  }, [preferencia]);

  const valor = useMemo<ValorTema>(() => {
    const modo = resolverModo(preferencia, agora);
    return {
      modo,
      cores: modo === 'sol' ? paletaSol : paletaNoite,
      preferencia,
      definirPreferencia: (p) => {
        setPreferencia(p);
        setAgora(new Date());
        void AsyncStorage.setItem(CHAVE, p).catch(() => undefined);
      },
    };
  }, [preferencia, agora]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export const useTema = () => useContext(Contexto);
export const useCores = () => useContext(Contexto).cores;

const cache = new WeakMap<object, WeakMap<Paleta, unknown>>();

/** Estilos que dependem da paleta: `const e = useEstilos(criarEstilos)`, com cache por paleta. */
export function useEstilos<T>(fabrica: (c: Paleta) => T): T {
  const c = useCores();
  let porPaleta = cache.get(fabrica) as WeakMap<Paleta, T> | undefined;
  if (!porPaleta) {
    porPaleta = new WeakMap();
    cache.set(fabrica, porPaleta as WeakMap<Paleta, unknown>);
  }
  let estilos = porPaleta.get(c);
  if (!estilos) {
    estilos = fabrica(c);
    porPaleta.set(c, estilos);
  }
  return estilos;
}
