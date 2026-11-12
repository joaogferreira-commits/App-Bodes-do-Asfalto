import { useGuardado } from './guardado';

/** Como o irmão aparece no mapa ao vivo (CLAUDE.md). A posição aproximada é calculada no servidor. */
export const modosVisibilidade = [
  'invisivel',
  'cidade',
  'aproximado',
  'precisoAmigos',
  'precisoComboio',
] as const;
export type ModoVisibilidade = (typeof modosVisibilidade)[number];

export const statusMapa = ['estrada', 'cafe', 'aberto', 'naoPerturbe'] as const;
export type StatusMapa = (typeof statusMapa)[number];

/** Duração do modo temporário (2 h): depois dela volta sozinho ao modo de antes. */
export const DURACAO_TEMPORARIO_MS = 2 * 60 * 60 * 1000;

export type EstadoVisibilidade = {
  modo: ModoVisibilidade;
  status: StatusMapa;
  /** Modo temporário ligado: até quando vale e para qual modo volta. */
  temporario: { ate: number; volta: ModoVisibilidade } | null;
};

export const visibilidadePadrao: EstadoVisibilidade = {
  modo: 'aproximado',
  status: 'estrada',
  temporario: null,
};

/** Modo em vigor agora: se o temporário já venceu, vale o modo de antes. */
export function modoEfetivo(e: EstadoVisibilidade, agora: number = Date.now()): ModoVisibilidade {
  return e.temporario && agora >= e.temporario.ate ? e.temporario.volta : e.modo;
}

/** O modo temporário está ligado e ainda não venceu? */
export function temporarioAtivo(e: EstadoVisibilidade, agora: number = Date.now()): boolean {
  return !!e.temporario && agora < e.temporario.ate;
}

/** Escolhe um modo; com `temporario`, vale por 2 h e depois volta ao modo anterior. */
export function escolherModo(
  e: EstadoVisibilidade,
  modo: ModoVisibilidade,
  temporario: boolean,
  agora: number = Date.now(),
): EstadoVisibilidade {
  const base = modoEfetivo(e, agora);
  const volta = e.temporario && agora < e.temporario.ate ? e.temporario.volta : base;
  return temporario
    ? { ...e, modo, temporario: { ate: agora + DURACAO_TEMPORARIO_MS, volta } }
    : { ...e, modo, temporario: null };
}

export function useVisibilidadeMapa() {
  const [estado, setEstado] = useGuardado<EstadoVisibilidade>('visibilidadeMapa', visibilidadePadrao);
  return {
    estado,
    modo: modoEfetivo(estado),
    escolher: (modo: ModoVisibilidade, temporario: boolean) =>
      setEstado((e) => escolherModo(e, modo, temporario)),
    definirStatus: (status: StatusMapa) => setEstado((e) => ({ ...e, status })),
  };
}
