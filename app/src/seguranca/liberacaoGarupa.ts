import { useSyncExternalStore } from 'react';

import { limitesMovimento } from '@/theme';

/**
 * Liberação "Sou garupa / passageiro" (decisão de 13/11/2026). Vale só na sessão do app:
 * termina após 5 min com o veículo parado ou 3 h, o que vier primeiro.
 */
export const LIBERACAO_PARADO_MS = 5 * 60 * 1000;
export const LIBERACAO_MAX_MS = 3 * 60 * 60 * 1000;

export type Liberacao = { desde: number; paradoDesde: number | null } | null;

/** Função pura: devolve a liberação atualizada (ou null se acabou). */
export function proximaLiberacao(lib: Liberacao, velocidadeKmh: number | null, agora: number): Liberacao {
  if (!lib) return null;
  if (agora - lib.desde >= LIBERACAO_MAX_MS) return null;
  if (velocidadeKmh == null || Number.isNaN(velocidadeKmh)) return lib;
  if (velocidadeKmh >= limitesMovimento.liberaKmh) {
    return lib.paradoDesde == null ? lib : { desde: lib.desde, paradoDesde: null };
  }
  const desde = lib.paradoDesde ?? agora;
  if (agora - desde >= LIBERACAO_PARADO_MS) return null;
  return lib.paradoDesde === desde ? lib : { desde: lib.desde, paradoDesde: desde };
}

let atual: Liberacao = null;
const ouvintes = new Set<() => void>();
const definir = (nova: Liberacao) => {
  if (nova === atual) return;
  atual = nova;
  ouvintes.forEach((o) => o());
};

export const liberarGarupa = (agora = Date.now()) => definir({ desde: agora, paradoDesde: null });
export const avaliarLiberacaoGarupa = (kmh: number | null, agora = Date.now()) =>
  definir(proximaLiberacao(atual, kmh, agora));
export const reiniciarLiberacaoGarupa = () => definir(null);

const assinar = (o: () => void) => {
  ouvintes.add(o);
  return () => void ouvintes.delete(o);
};
export const useLiberadoGarupa = () =>
  useSyncExternalStore(
    assinar,
    () => atual != null,
    () => false,
  );
