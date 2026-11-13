import {
  limparPrefetchGoogle,
  LIMITE_GOOGLE_MS,
  prefetchGoogle,
  tokenDaRota,
  tokenParaSair,
  URL_ROUTES,
} from './google';
import { codificarPolyline, decodificarPolyline } from './polyline';
import { distanciaKm } from '@/navegacao/destinos';

import {
  amostrarPassagens,
  ErroRota,
  opcoesDeCusto,
  planejarBateVolta,
  planejarRota,
  pontosBateVolta,
  separarTrechos,
} from './valhalla';

const cuiaba = { lat: -15.601, lng: -56.0974 };
const chapada = { lat: -15.4604, lng: -55.7497 };
const forma = [
  cuiaba,
  { lat: -15.55, lng: -56.0 },
  { lat: -15.5, lng: -55.9 },
  { lat: -15.48, lng: -55.8 },
  chapada,
];

describe('polyline', () => {
  it('codifica e decodifica sem perder precisão (6 casas)', () => {
    const volta = decodificarPolyline(codificarPolyline(forma, 6), 6);
    volta.forEach((p, i) => {
      expect(p.lat).toBeCloseTo(forma[i]!.lat, 6);
      expect(p.lng).toBeCloseTo(forma[i]!.lng, 6);
    });
  });

  it('decodifica o exemplo oficial do Google (precisão 5)', () => {
    const pts = decodificarPolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@', 5);
    expect(pts[0]).toEqual({ lat: 38.5, lng: -120.2 });
    expect(pts[2]).toEqual({ lat: 43.252, lng: -126.453 });
  });
});

describe('tipo de estrada', () => {
  it('só asfalto exclui terra; prefiro terra puxa para trilhas', () => {
    expect(opcoesDeCusto('asfalto')).toMatchObject({ exclude_unpaved: true, use_trails: 0 });
    expect(opcoesDeCusto('terra').use_trails).toBe(1);
    expect(opcoesDeCusto('misto').use_trails).toBe(0.4);
    expect(opcoesDeCusto('asfalto', true)).toEqual({ use_trails: 0, use_highways: 1 });
  });

  it('separa trechos de terra e junta trechos vizinhos iguais', () => {
    const trechos = separarTrechos(forma, [
      { unpaved: false, begin_shape_index: 0, end_shape_index: 1 },
      { unpaved: false, begin_shape_index: 1, end_shape_index: 2 },
      { unpaved: true, begin_shape_index: 2, end_shape_index: 4 },
    ]);
    expect(trechos.map((t) => t.terra)).toEqual([false, true]);
    expect(trechos[0]!.pontos).toHaveLength(3);
    expect(trechos[1]!.pontos).toHaveLength(3);
  });
});

describe('planejarRota', () => {
  const respostaRota = {
    ok: true,
    status: 200,
    json: async () => ({
      trip: { legs: [{ shape: codificarPolyline(forma) }], summary: { length: 74.2, time: 5700 } },
    }),
  };
  const respostaAtributos = {
    ok: true,
    status: 200,
    json: async () => ({
      edges: [
        { unpaved: false, length: 43, begin_shape_index: 0, end_shape_index: 2 },
        { unpaved: true, length: 31.2, begin_shape_index: 2, end_shape_index: 4 },
      ],
    }),
  };

  it('pede rota de moto com a preferência escolhida e calcula km de terra', async () => {
    const buscar = jest.fn().mockResolvedValueOnce(respostaRota).mockResolvedValueOnce(respostaAtributos);
    const rota = await planejarRota(cuiaba, chapada, 'terra', buscar);
    const corpo = JSON.parse(buscar.mock.calls[0][1].body);
    expect(corpo.costing).toBe('motorcycle');
    expect(corpo.costing_options.motorcycle.use_trails).toBe(1);
    expect(rota).toMatchObject({ km: 74.2, kmTerra: 31.2, minutos: 95, tipo: 'terra' });
    expect(rota.trechos.map((t) => t.terra)).toEqual([false, true]);
  });

  it('"Só asfalto" sem caminho sem terra: refaz evitando a terra e avisa (R42)', async () => {
    const semRota = { ok: false, status: 400, json: async () => ({}) };
    const buscar = jest
      .fn()
      .mockResolvedValueOnce(semRota)
      .mockResolvedValueOnce(respostaRota)
      .mockResolvedValueOnce(respostaAtributos);
    const rota = await planejarRota(cuiaba, chapada, 'asfalto', buscar);
    expect(JSON.parse(buscar.mock.calls[0][1].body).costing_options.motorcycle.exclude_unpaved).toBe(true);
    expect(
      JSON.parse(buscar.mock.calls[1][1].body).costing_options.motorcycle.exclude_unpaved,
    ).toBeUndefined();
    expect(rota.aviso).toBe('semCaminhoSoAsfalto');
    expect(rota.kmTerra).toBe(31.2);
  });

  it('"Só asfalto" com caminho asfaltado não traz aviso', async () => {
    const buscar = jest.fn().mockResolvedValueOnce(respostaRota).mockResolvedValueOnce(respostaAtributos);
    const rota = await planejarRota(cuiaba, chapada, 'asfalto', buscar);
    expect(buscar).toHaveBeenCalledTimes(2);
    expect(rota.aviso).toBeUndefined();
  });

  it('sem os atributos, a rota vem inteira como asfalto', async () => {
    const buscar = jest.fn().mockResolvedValueOnce(respostaRota).mockRejectedValueOnce(new Error('x'));
    const rota = await planejarRota(cuiaba, chapada, 'misto', buscar);
    expect(rota.kmTerra).toBe(0);
    expect(rota.trechos).toHaveLength(1);
  });

  it('sem internet vira erro semRede; rota impossível vira semRota', async () => {
    await expect(
      planejarRota(cuiaba, chapada, 'misto', jest.fn().mockRejectedValue(new Error('x'))),
    ).rejects.toEqual(new ErroRota('semRede'));
    await expect(
      planejarRota(
        cuiaba,
        chapada,
        'misto',
        jest.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({}) }),
      ),
    ).rejects.toEqual(new ErroRota('semRota'));
  });
});

describe('passagens para o Google', () => {
  it('espalha pontos pela rota sem repetir início e fim', () => {
    const pts = amostrarPassagens(forma, 3);
    expect(pts).toHaveLength(3);
    expect(pts).not.toContainEqual(cuiaba);
    expect(pts).not.toContainEqual(chapada);
  });

  it('pede token de moto com pontos "via" (sem parar)', async () => {
    const buscar = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ routes: [{ routeToken: 'abc' }] }) });
    await expect(tokenDaRota('chave', cuiaba, chapada, amostrarPassagens(forma, 3), buscar)).resolves.toBe(
      'abc',
    );
    const [url, init] = buscar.mock.calls[0];
    expect(url).toBe(URL_ROUTES);
    const corpo = JSON.parse(init.body);
    expect(corpo.travelMode).toBe('DRIVE');
    expect(corpo.intermediates.every((p: { via: boolean }) => p.via)).toBe(true);
  });

  it('sem chave ou com falha devolve null (a navegação segue sem token)', async () => {
    await expect(tokenDaRota('', cuiaba, chapada, [])).resolves.toBeNull();
    await expect(
      tokenDaRota('k', cuiaba, chapada, [], jest.fn().mockRejectedValue(new Error('x'))),
    ).resolves.toBeNull();
  });
});

describe('bate-volta', () => {
  const casa = { lat: -15.6, lng: -56.1 };

  it('laço com perímetro em linha reta ≈ distância pedida ÷ 1,3', () => {
    const [a, b] = pontosBateVolta(casa, 150, 0);
    const perimetro = distanciaKm(casa, a!) + distanciaKm(a!, b!) + distanciaKm(b!, casa);
    expect(perimetro * 1.3).toBeGreaterThan(140);
    expect(perimetro * 1.3).toBeLessThan(160);
  });

  it('vai para o lado escolhido (norte = latitude maior)', () => {
    const [a, b] = pontosBateVolta(casa, 100, 0);
    expect(a!.lat).toBeGreaterThan(casa.lat);
    expect(b!.lat).toBeGreaterThan(casa.lat);
    const [c] = pontosBateVolta(casa, 100, 90);
    expect(c!.lng).toBeGreaterThan(casa.lng);
  });

  it('"outra opção" gira o laço', () => {
    expect(pontosBateVolta(casa, 100, 0, 1)).not.toEqual(pontosBateVolta(casa, 100, 0, 0));
  });

  it('pede volta à origem passando pelos pontos, sem paradas, e "mais curvas" evita rodovias', async () => {
    const forma = [casa, { lat: -15.2, lng: -56 }, casa];
    const buscar = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          trip: {
            legs: [
              { shape: codificarPolyline(forma.slice(0, 2)) },
              { shape: codificarPolyline(forma.slice(1)) },
            ],
            summary: { length: 98, time: 7200 },
          },
        }),
      })
      .mockRejectedValueOnce(new Error('sem atributos'));
    const rota = await planejarBateVolta(casa, { km: 100, rumo: 'N', tipo: 'terra', curvas: true }, buscar);
    const corpo = JSON.parse(buscar.mock.calls[0][1].body);
    expect(corpo.locations).toHaveLength(4);
    expect(corpo.locations[0]).toEqual({ lat: casa.lat, lon: casa.lng });
    expect(corpo.locations[3]).toEqual({ lat: casa.lat, lon: casa.lng });
    expect(corpo.locations[1].type).toBe('through');
    expect(corpo.costing_options.motorcycle.use_highways).toBe(0);
    expect(rota.forma).toHaveLength(3);
    expect(rota.km).toBe(98);
  });
});

describe('rota no Google (por que recusa e como suavizar)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { rotaNoGoogle } = require('./google') as typeof import('./google');
  const longa = Array.from({ length: 50 }, (_, i) => ({ lat: -15.6 + i * 0.002, lng: -56.1 + i * 0.002 }));
  const ok = (km: number) => ({
    ok: true,
    status: 200,
    json: async () => ({ routes: [{ routeToken: 'T', distanceMeters: km * 1000 }] }),
  });
  const semRota = { ok: false, status: 400, json: async () => ({}) };

  it('chave sem a Routes API (403): para na hora e diz o motivo', async () => {
    const buscar = jest.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) });
    await expect(rotaNoGoogle('k', longa, 50, buscar)).resolves.toEqual({
      aceita: false,
      motivo: 'chaveSemRoutes',
    });
    expect(buscar).toHaveBeenCalledTimes(3); // em paralelo
  });

  it('se recusar com 10 e 5 pontos, usa a de 2', async () => {
    const buscar = jest
      .fn()
      .mockResolvedValueOnce(semRota)
      .mockResolvedValueOnce(semRota)
      .mockResolvedValueOnce(ok(52));
    const r = await rotaNoGoogle('k', longa, 50, buscar);
    expect(r).toMatchObject({ aceita: true, passagens: 2, kmGoogle: 52, fiel: true });
    const vias = buscar.mock.calls.map((c) => JSON.parse(c[1].body).intermediates.length);
    expect(vias).toEqual([10, 5, 2]);
  });

  it('tentativas em paralelo: as 3 saem antes de qualquer resposta, e vale a mais detalhada aceita', async () => {
    const pendentes: ((v: unknown) => void)[] = [];
    const buscar = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          pendentes.push(resolve);
        }),
    );
    const p = rotaNoGoogle('k', longa, 50, buscar);
    expect(buscar).toHaveBeenCalledTimes(3);
    // a de 2 pontos responde primeiro, depois a de 10
    pendentes[2]!({ ok: true, status: 200, json: async () => ({ routes: [{ routeToken: 'dois' }] }) });
    pendentes[1]!(semRota);
    pendentes[0]!({ ok: true, status: 200, json: async () => ({ routes: [{ routeToken: 'dez' }] }) });
    await expect(p).resolves.toMatchObject({ aceita: true, token: 'dez', passagens: 10 });
  });

  it('teto de ~6 s: Google calado vira semRede e cancela os pedidos', async () => {
    jest.useFakeTimers();
    const buscar = jest.fn().mockImplementation(
      (_u: string, init: { signal: AbortSignal }) =>
        new Promise((_ok, falha) => {
          init.signal.addEventListener('abort', () => falha(new Error('abort')));
        }),
    );
    const p = rotaNoGoogle('k', longa, 50, buscar);
    await jest.advanceTimersByTimeAsync(LIMITE_GOOGLE_MS + 10);
    await expect(p).resolves.toEqual({ aceita: false, motivo: 'semRede' });
    expect(LIMITE_GOOGLE_MS).toBeLessThanOrEqual(6000);
    jest.useRealTimers();
  });

  it('prefetch: o "Iniciar" reaproveita o token pedido ao escolher a rota (sem nova chamada)', async () => {
    limparPrefetchGoogle();
    const buscar = jest.fn().mockResolvedValue(ok(50));
    const antes = prefetchGoogle('k', longa, 50, buscar);
    expect(prefetchGoogle('k', longa, 50, buscar)).toBe(antes); // mesma rota, mesmo pedido
    await antes;
    expect(buscar).toHaveBeenCalledTimes(3);
    await expect(tokenParaSair('k', longa, 50, longa[0]!, buscar)).resolves.toBe('T');
    expect(buscar).toHaveBeenCalledTimes(3);
  });

  it('prefetch não serve se o irmão já saiu longe do início: pede token novo', async () => {
    limparPrefetchGoogle();
    const buscar = jest.fn().mockResolvedValue(ok(50));
    await prefetchGoogle('k', longa, 50, buscar);
    const longe = { lat: longa[0]!.lat + 1, lng: longa[0]!.lng };
    await tokenParaSair('k', longa, 50, longe, buscar);
    expect(buscar).toHaveBeenCalledTimes(6);
  });

  it('prefetch que falhou não fica guardado', async () => {
    limparPrefetchGoogle();
    const buscar = jest.fn().mockResolvedValue(semRota);
    await prefetchGoogle('k', longa, 50, buscar);
    await Promise.resolve();
    await prefetchGoogle('k', longa, 50, buscar);
    expect(buscar).toHaveBeenCalledTimes(6);
  });

  it('avisa quando o Google vai por outro caminho (distância > 10 % diferente)', async () => {
    const r = await rotaNoGoogle('k', longa, 50, jest.fn().mockResolvedValue(ok(70)));
    expect(r).toMatchObject({ aceita: true, fiel: false });
  });

  it('nada funcionou: devolve o motivo semRota', async () => {
    await expect(rotaNoGoogle('k', longa, 50, jest.fn().mockResolvedValue(semRota))).resolves.toEqual({
      aceita: false,
      motivo: 'semRota',
    });
  });
});

describe('alternativas e terra (R43)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const v = require('./valhalla') as typeof import('./valhalla');
  const a = { lat: -15.6, lng: -56.1 };
  const b = { lat: -15.4, lng: -55.8 };
  const trip = (km: number) => ({
    legs: [{ shape: codificarPolyline([a, { lat: -15.5, lng: -56 }, b]) }],
    summary: { length: km, time: km * 60 },
  });
  const attrs = (terraNoFim: boolean) => ({
    ok: true,
    status: 200,
    json: async () => ({
      edges: [
        { unpaved: false, length: 30, begin_shape_index: 0, end_shape_index: 1 },
        { unpaved: terraNoFim, length: 20, begin_shape_index: 1, end_shape_index: 2 },
      ],
    }),
  });

  it('km até a terra soma os trechos de asfalto antes do primeiro de terra', () => {
    expect(
      v.kmAteATerra([
        { pontos: [], terra: false, km: 12.34 },
        { pontos: [], terra: true, km: 5 },
      ]),
    ).toBe(12.3);
    expect(v.kmAteATerra([{ pontos: [], terra: false, km: 10 }])).toBeUndefined();
  });

  it('pede 2 alternativas entre dois pontos e devolve cada uma com a sua terra', async () => {
    const buscar = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ trip: trip(50), alternates: [{ trip: trip(58) }] }),
      })
      .mockResolvedValueOnce(attrs(true))
      .mockResolvedValueOnce(attrs(false));
    const r = await v.planejarRota(a, b, 'misto', buscar);
    expect(JSON.parse(buscar.mock.calls[0][1].body).alternates).toBe(2);
    expect(r).toMatchObject({ km: 50, kmTerra: 20, kmAteTerra: 30 });
    expect(r.alternativas).toHaveLength(1);
    expect(r.alternativas![0]).toMatchObject({ km: 58, kmTerra: 0 });
  });

  it('viagem longa (> 300 km) não pede alternativas', async () => {
    const longe = { lat: a.lat + 3, lng: a.lng };
    const buscar = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ trip: trip(330) }) })
      .mockResolvedValueOnce(attrs(false));
    await v.planejarRota(a, longe, 'misto', buscar);
    expect(JSON.parse(buscar.mock.calls[0][1].body).alternates).toBeUndefined();
  });

  it('servidor demorou com alternativas: uma segunda chance rápida, sem alternativas', async () => {
    const buscar = jest
      .fn()
      .mockRejectedValueOnce(new Error('abort'))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ trip: trip(50) }) })
      .mockResolvedValueOnce(attrs(false));
    const r = await v.planejarRota(a, b, 'misto', buscar);
    expect(JSON.parse(buscar.mock.calls[0][1].body).alternates).toBe(2);
    expect(JSON.parse(buscar.mock.calls[1][1].body).alternates).toBeUndefined();
    expect(r.km).toBe(50);
  });

  it('tempos do Valhalla: 12 s e retentativa de 8 s', () => {
    expect(v.LIMITE_VALHALLA_MS).toBe(12000);
    expect(v.LIMITE_VALHALLA_RETENTATIVA_MS).toBeLessThan(v.LIMITE_VALHALLA_MS);
  });

  it('cancelar (sinal) interrompe sem segunda chance', async () => {
    const corte = new AbortController();
    corte.abort();
    const buscar = jest.fn().mockRejectedValue(new Error('abort'));
    await expect(v.planejarRota(a, b, 'misto', buscar, { sinal: corte.signal })).rejects.toBeInstanceOf(
      ErroRota,
    );
    expect(buscar).toHaveBeenCalledTimes(1);
  });

  it('com pontos de passagem (bate-volta) não pede alternativas', async () => {
    const buscar = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ trip: trip(100) }) })
      .mockResolvedValueOnce(attrs(false));
    await v.planejarBateVolta(a, { km: 100, rumo: 'N', tipo: 'misto', curvas: false }, buscar);
    expect(JSON.parse(buscar.mock.calls[0][1].body).alternates).toBeUndefined();
  });
});
