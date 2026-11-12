import type { Coordenada } from '@/navegacao/destinos';

/** Escolha do irmão no planejamento (pedido do dono em 12/11/2026). */
export type TipoEstrada = 'asfalto' | 'misto' | 'terra';

export type Trecho = { pontos: Coordenada[]; terra: boolean };

export type RotaPlanejada = {
  forma: Coordenada[];
  trechos: Trecho[];
  km: number;
  kmTerra: number;
  minutos: number;
  tipo: TipoEstrada;
};
