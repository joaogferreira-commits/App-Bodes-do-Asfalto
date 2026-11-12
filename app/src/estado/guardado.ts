import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

/** Estado simples guardado no aparelho (ferramentas pessoais: checklist, manutenção, ficha, meta). */
export function useGuardado<T>(chave: string, padrao: T): [T, (v: T | ((a: T) => T)) => void] {
  const [valor, setValor] = useState<T>(padrao);
  useEffect(() => {
    let ativo = true;
    AsyncStorage.getItem(`bodes.${chave}`)
      .then((v) => {
        if (ativo && v != null) setValor(JSON.parse(v) as T);
      })
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, [chave]);
  const definir = (v: T | ((a: T) => T)) =>
    setValor((atual) => {
      const novo = typeof v === 'function' ? (v as (a: T) => T)(atual) : v;
      void AsyncStorage.setItem(`bodes.${chave}`, JSON.stringify(novo)).catch(() => undefined);
      return novo;
    });
  return [valor, definir];
}
