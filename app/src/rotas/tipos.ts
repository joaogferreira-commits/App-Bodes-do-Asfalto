import type { Coordenada } from '@/navegacao/destinos';

/** Escolha do irmão no planejamento (pedido do dono em 12/11/2026). */
export type TipoEstrada = 'asfalto' | 'misto' | 'terra';

export type Trecho = { pontos: Coordenada[]; terra: boolean; km?: number };

export type RotaPlanejada = {
  forma: Coordenada[];
  trechos: Trecho[];
  km: number;
  kmTerra: number;
  minutos: number;
  tipo: TipoEstrada;
  /** "Só asfalto" pedido, mas não há caminho sem terra até o destino (R42). */
  aviso?: 'semCaminhoSoAsfalto';
  /** Km até o primeiro trecho de terra. */
  kmAteTerra?: number;
  /** Até 2 caminhos alternativos (só em rota até um destino). */
  alternativas?: RotaPlanejada[];
};
