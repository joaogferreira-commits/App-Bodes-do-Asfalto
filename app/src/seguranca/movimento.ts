import { limitesMovimento } from '@/theme';

/**
 * Bloqueio por velocidade (R3, NHTSA 2013): acima de 8 km/h trava feed, chat em texto,
 * digitação, busca, listas e configurações. Só libera depois de 5 s abaixo de 3 km/h
 * (histerese: semáforo e trânsito lento não ficam travando e destravando).
 */
export type EstadoMovimento = { travado: boolean; paradoDesde: number | null };

export const estadoInicialMovimento: EstadoMovimento = { travado: false, paradoDesde: null };

/** Velocidade em km/h (null = sem leitura). `agora` em milissegundos. */
export function proximoEstadoMovimento(
  estado: EstadoMovimento,
  velocidadeKmh: number | null,
  agora: number,
  limites = limitesMovimento,
): EstadoMovimento {
  if (velocidadeKmh == null || Number.isNaN(velocidadeKmh)) return estado;
  if (velocidadeKmh >= limites.travaKmh) return { travado: true, paradoDesde: null };
  if (!estado.travado) return estado;
  if (velocidadeKmh < limites.liberaKmh) {
    const desde = estado.paradoDesde ?? agora;
    if (agora - desde >= limites.liberaMs) return { travado: false, paradoDesde: null };
    return { travado: true, paradoDesde: desde };
  }
  // entre 3 e 8 km/h: continua travado e zera a contagem de parada
  return { travado: true, paradoDesde: null };
}

/** m/s (como o GPS informa) para km/h. Valores negativos = sem leitura. */
export const msParaKmh = (ms: number | null | undefined) => (ms == null || ms < 0 ? null : ms * 3.6);
