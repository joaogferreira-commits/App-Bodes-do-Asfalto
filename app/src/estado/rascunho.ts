import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useAcessoOpcional } from '@/acesso/acesso';

import { chaveRascunho, VALIDADE_PADRAO_MS } from './rascunhoArmazem';

export { limparTodosRascunhos } from './rascunhoArmazem';

type Opcoes = { validadeMs?: number; atrasoMs?: number };
type Guardado<T> = { v: T; t: number };

/**
 * Estado que sobrevive a voltar, trocar de aba, fechar ou mudar de app (rascunho de formulário).
 * Fica no aparelho, separado por conta, e expira em 24 h. Retorna [valor, setValor, limpar];
 * chame `limpar()` depois de enviar com sucesso.
 */
export function useRascunho<T>(chave: string, inicial: T, opcoes: Opcoes = {}) {
  const { validadeMs = VALIDADE_PADRAO_MS, atrasoMs = 400 } = opcoes;
  const dono = useAcessoOpcional()?.email;
  const chaveCompleta = chaveRascunho(chave, dono);
  const [valor, setValorBruto] = useState<T>(inicial);
  const ref = useRef<T>(inicial);
  const sujo = useRef(false);
  const carregado = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const gravar = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = undefined;
    if (!sujo.current || !carregado.current) return;
    sujo.current = false;
    const g: Guardado<T> = { v: ref.current, t: Date.now() };
    void AsyncStorage.setItem(chaveCompleta, JSON.stringify(g)).catch(() => undefined);
  }, [chaveCompleta]);

  useEffect(() => {
    let vivo = true;
    carregado.current = false;
    void AsyncStorage.getItem(chaveCompleta)
      .then((bruto) => {
        if (!vivo) return;
        if (bruto) {
          try {
            const g = JSON.parse(bruto) as Guardado<T>;
            if (Date.now() - g.t < validadeMs) {
              // Só restaura se a pessoa ainda não digitou nada nesse meio tempo.
              if (!sujo.current) {
                ref.current = g.v;
                setValorBruto(g.v);
              }
            } else void AsyncStorage.removeItem(chaveCompleta).catch(() => undefined);
          } catch {
            void AsyncStorage.removeItem(chaveCompleta).catch(() => undefined);
          }
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!vivo) return;
        carregado.current = true;
        if (sujo.current) gravar();
      });
    return () => {
      vivo = false;
    };
  }, [chaveCompleta, validadeMs, gravar]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (e) => {
      if (e === 'background' || e === 'inactive') gravar();
    });
    return () => {
      sub?.remove?.();
      gravar();
    };
  }, [gravar]);

  const setValor = useCallback(
    (v: T | ((a: T) => T)) => {
      const novo = typeof v === 'function' ? (v as (a: T) => T)(ref.current) : v;
      ref.current = novo;
      sujo.current = true;
      setValorBruto(novo);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(gravar, atrasoMs);
    },
    [gravar, atrasoMs],
  );

  const limpar = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = undefined;
    sujo.current = false;
    void AsyncStorage.removeItem(chaveCompleta).catch(() => undefined);
  }, [chaveCompleta]);

  return [valor, setValor, limpar] as const;
}

type FormRHF<V> = {
  watch: (cb: (v: V) => void) => { unsubscribe: () => void };
  getValues: () => V;
  reset: (v: V) => void;
};

/** Mesma ideia para formulários react-hook-form: observa o form e o restaura do rascunho. */
export function useRascunhoForm<V>(chave: string, form: FormRHF<V>, opcoes?: Opcoes) {
  const [guardado, setGuardado, limpar] = useRascunho<V>(chave, form.getValues(), opcoes);
  const restaurou = useRef(false);
  useEffect(() => {
    if (restaurou.current) return;
    restaurou.current = true;
    form.reset(guardado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guardado]);
  useEffect(() => {
    const s = form.watch((v) => setGuardado(v));
    return () => s.unsubscribe();
  }, [form, setGuardado]);
  return limpar;
}
