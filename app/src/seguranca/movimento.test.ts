import { estadoInicialMovimento, msParaKmh, proximoEstadoMovimento, type EstadoMovimento } from './movimento';

/** Aplica uma sequência de [segundo, km/h] e devolve se ficou travado após cada leitura. */
function simular(seq: [number, number | null][]) {
  let e: EstadoMovimento = estadoInicialMovimento;
  return seq.map(([s, kmh]) => {
    e = proximoEstadoMovimento(e, kmh, s * 1000);
    return e.travado;
  });
}

describe('bloqueio em movimento (R3)', () => {
  it('parado ou empurrando a moto não trava', () => {
    expect(
      simular([
        [0, 0],
        [1, 5],
        [2, 7.9],
      ]),
    ).toEqual([false, false, false]);
  });

  it('trava a partir de 8 km/h', () => {
    expect(
      simular([
        [0, 0],
        [1, 8],
        [2, 40],
      ]),
    ).toEqual([false, true, true]);
  });

  it('só libera depois de 5 s abaixo de 3 km/h', () => {
    const r = simular([
      [0, 60],
      [1, 2],
      [3, 1],
      [5, 0],
      [5.9, 0],
    ]);
    expect(r).toEqual([true, true, true, true, true]);
    expect(
      simular([
        [0, 60],
        [1, 2],
        [6, 0],
      ]),
    ).toEqual([true, true, false]);
  });

  it('semáforo: andar devagar (3–8 km/h) zera a contagem', () => {
    expect(
      simular([
        [0, 60],
        [1, 1],
        [4, 5],
        [6, 1],
        [10, 1],
        [11, 0],
      ]),
    ).toEqual([true, true, true, true, true, false]);
  });

  it('sem leitura de velocidade mantém o estado', () => {
    expect(
      simular([
        [0, 60],
        [10, null],
      ]),
    ).toEqual([true, true]);
  });

  it('converte m/s para km/h e ignora velocidade negativa (sem leitura)', () => {
    expect(msParaKmh(10)).toBeCloseTo(36);
    expect(msParaKmh(-1)).toBeNull();
    expect(msParaKmh(null)).toBeNull();
  });
});
