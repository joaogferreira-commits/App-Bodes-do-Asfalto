import { tokenDaRota, URL_ROUTES } from './google';
import { codificarPolyline, decodificarPolyline } from './polyline';
import { amostrarPassagens, ErroRota, opcoesDeCusto, planejarRota, separarTrechos } from './valhalla';

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
    expect(corpo.travelMode).toBe('TWO_WHEELER');
    expect(corpo.intermediates.every((p: { via: boolean }) => p.via)).toBe(true);
  });

  it('sem chave ou com falha devolve null (a navegação segue sem token)', async () => {
    await expect(tokenDaRota('', cuiaba, chapada, [])).resolves.toBeNull();
    await expect(
      tokenDaRota('k', cuiaba, chapada, [], jest.fn().mockRejectedValue(new Error('x'))),
    ).resolves.toBeNull();
  });
});
