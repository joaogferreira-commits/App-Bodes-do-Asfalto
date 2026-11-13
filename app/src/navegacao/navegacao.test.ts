import { destinosDaProva, distanciaKm, pontoADistancia, posicaoDoDestino } from './destinos';
import {
  iniciarNavegacao,
  irParaDestino,
  LIMITE_ROTA_MS,
  LIMITE_TOKEN_MS,
  MODO_CARRO,
  MODO_MOTO,
  VOZ_COMPLETA_BLUETOOTH,
  type ControladorNavegacao,
} from './fluxo';

const cuiaba = { lat: -15.601, lng: -56.0974 };

function controladorFalso(ajustes: Partial<Record<keyof ControladorNavegacao, unknown>> = {}) {
  return {
    areTermsAccepted: jest.fn().mockResolvedValue(false),
    showTermsAndConditionsDialog: jest.fn().mockResolvedValue(true),
    init: jest.fn().mockResolvedValue('ok'),
    setDestinations: jest.fn().mockResolvedValue('OK'),
    setAudioGuidanceType: jest.fn().mockResolvedValue(undefined),
    startGuidance: jest.fn().mockResolvedValue(undefined),
    setTurnByTurnLoggingEnabled: jest.fn(),
    ...ajustes,
  } as unknown as jest.Mocked<ControladorNavegacao>;
}

const base = (controlador: ControladorNavegacao) => ({
  controlador,
  pedirPermissaoLocalizacao: async () => true,
  posicaoAtual: async () => cuiaba,
  destino: (atual: typeof cuiaba) => pontoADistancia(atual, 5),
  tituloDestino: 'Teste',
});

describe('destinos', () => {
  it('ponto a 5 km fica a 5 km', () => {
    expect(distanciaKm(cuiaba, pontoADistancia(cuiaba, 5))).toBeCloseTo(5, 2);
  });

  it('Chapada fica a uns 50 km de Cuiabá em linha reta', () => {
    const chapada = destinosDaProva.find((d) => d.chave === 'chapada')!;
    const km = distanciaKm(cuiaba, posicaoDoDestino(chapada, cuiaba));
    expect(km).toBeGreaterThan(35);
    expect(km).toBeLessThan(60);
  });
});

describe('iniciarNavegacao', () => {
  it('caminho feliz: rota de moto, voz pelo Bluetooth e guia iniciado', async () => {
    const c = controladorFalso();
    await expect(iniciarNavegacao(base(c))).resolves.toBe('ok');
    expect(c.setDestinations).toHaveBeenCalledWith([expect.objectContaining({ title: 'Teste' })], {
      routingOptions: expect.objectContaining({ travelMode: MODO_MOTO }),
    });
    expect(c.setAudioGuidanceType).toHaveBeenCalledWith(VOZ_COMPLETA_BLUETOOTH);
    expect(c.startGuidance).toHaveBeenCalled();
  });

  it('liga o envio das curvas para a tela do carro', async () => {
    const c = controladorFalso();
    await iniciarNavegacao(base(c));
    expect(c.setTurnByTurnLoggingEnabled).toHaveBeenCalledWith(true);
  });

  it('não mostra os termos de novo se já foram aceitos', async () => {
    const c = controladorFalso({ areTermsAccepted: jest.fn().mockResolvedValue(true) });
    await iniciarNavegacao(base(c));
    expect(c.showTermsAndConditionsDialog).not.toHaveBeenCalled();
  });

  it('sem permissão de localização não chama o Google', async () => {
    const c = controladorFalso();
    await expect(
      iniciarNavegacao({ ...base(c), pedirPermissaoLocalizacao: async () => false }),
    ).resolves.toBe('semPermissao');
    expect(c.init).not.toHaveBeenCalled();
  });

  it.each([
    ['notAuthorized', 'chaveNaoAutorizada'],
    ['networkError', 'semRede'],
    ['termsNotAccepted', 'termosRecusados'],
  ])('sessão %s vira %s', async (status, esperado) => {
    const c = controladorFalso({ init: jest.fn().mockResolvedValue(status) });
    await expect(iniciarNavegacao(base(c))).resolves.toBe(esperado);
    expect(c.startGuidance).not.toHaveBeenCalled();
  });

  it('rota não encontrada não inicia o guia', async () => {
    const c = controladorFalso({ setDestinations: jest.fn().mockResolvedValue('NO_ROUTE_FOUND') });
    await expect(iniciarNavegacao(base(c))).resolves.toBe('semRota');
    expect(c.startGuidance).not.toHaveBeenCalled();
  });

  it('com token, segue a rota planejada', async () => {
    const c = controladorFalso();
    await expect(iniciarNavegacao({ ...base(c), tokenRota: 'tok' })).resolves.toBe('ok');
    expect(c.setDestinations).toHaveBeenCalledTimes(1);
    expect(c.setDestinations.mock.calls[0]![1]).toEqual({
      routeTokenOptions: { routeToken: 'tok', travelMode: MODO_CARRO },
    });
  });

  it('se o token for recusado, usa a rota do Google e avisa', async () => {
    const c = controladorFalso({
      setDestinations: jest.fn().mockResolvedValueOnce('WAYPOINT_ERROR').mockResolvedValueOnce('OK'),
    });
    await expect(iniciarNavegacao({ ...base(c), tokenRota: 'tok' })).resolves.toBe('okRotaRapida');
    expect(c.setDestinations).toHaveBeenCalledTimes(2);
    expect(c.startGuidance).toHaveBeenCalled();
  });

  it('pede um token novo saindo da posição atual e usa ele no lugar do antigo', async () => {
    const c = controladorFalso();
    const tokenNaHora = jest.fn().mockResolvedValue('novo');
    await expect(iniciarNavegacao({ ...base(c), tokenRota: 'velho', tokenNaHora })).resolves.toBe('ok');
    expect(tokenNaHora).toHaveBeenCalledWith(cuiaba);
    expect(c.setDestinations.mock.calls[0]![1]).toEqual({
      routeTokenOptions: { routeToken: 'novo', travelMode: MODO_CARRO },
    });
  });

  it('se o token novo falhar, tenta o antigo; recusa avisa o motivo', async () => {
    const c = controladorFalso({
      setDestinations: jest
        .fn()
        .mockRejectedValueOnce({ code: 'routeTokenMalformed' })
        .mockResolvedValueOnce('OK'),
    });
    const aoRecusarRota = jest.fn();
    const r = await iniciarNavegacao({
      ...base(c),
      tokenRota: 'velho',
      tokenNaHora: async () => null,
      aoRecusarRota,
    });
    expect(r).toBe('okRotaRapida');
    expect(c.setDestinations.mock.calls[0]![1]).toEqual({
      routeTokenOptions: { routeToken: 'velho', travelMode: MODO_CARRO },
    });
    expect(aoRecusarRota).toHaveBeenCalledWith('routeTokenMalformed');
  });

  it('Google calado na rota planejada não trava a partida', async () => {
    jest.useFakeTimers();
    const c = controladorFalso({
      setDestinations: jest
        .fn()
        .mockReturnValueOnce(new Promise(() => undefined))
        .mockResolvedValueOnce('OK'),
    });
    const aoRecusarRota = jest.fn();
    const p = iniciarNavegacao({ ...base(c), tokenRota: 'tok', aoRecusarRota });
    await jest.advanceTimersByTimeAsync(LIMITE_ROTA_MS + 10);
    await expect(p).resolves.toBe('okRotaRapida');
    expect(aoRecusarRota).toHaveBeenCalledWith('DEMOROU');
    jest.useRealTimers();
  });

  it('o token é seguido em modo DRIVING (0): a ponte do Google recusa moto (3) com token', () => {
    expect(MODO_CARRO).toBe(0);
    expect(MODO_MOTO).toBe(3);
  });

  it('moto recusada pela ponte ("Unsupported travel mode") tenta de novo como carro', async () => {
    const c = controladorFalso({
      setDestinations: jest
        .fn()
        .mockRejectedValueOnce(new Error('Exception in HostFunction: Unsupported travel mode: 3'))
        .mockResolvedValueOnce('OK'),
    });
    await expect(iniciarNavegacao(base(c))).resolves.toBe('ok');
    expect(c.setDestinations.mock.calls[1]![1]).toEqual({
      routingOptions: { travelMode: MODO_CARRO, avoidFerries: true },
    });
  });

  it('token novo lento (>6,5 s) não segura a partida: usa o token que já tinha', async () => {
    jest.useFakeTimers();
    const c = controladorFalso();
    const p = iniciarNavegacao({
      ...base(c),
      tokenRota: 'velho',
      tokenNaHora: () => new Promise(() => undefined),
    });
    await jest.advanceTimersByTimeAsync(LIMITE_TOKEN_MS + 10);
    await expect(p).resolves.toBe('ok');
    expect(c.setDestinations.mock.calls[0]![1]).toEqual({
      routeTokenOptions: { routeToken: 'velho', travelMode: MODO_CARRO },
    });
    jest.useRealTimers();
  });

  it('erro inesperado vira "erro"', async () => {
    const c = controladorFalso({ init: jest.fn().mockRejectedValue(new Error('x')) });
    await expect(iniciarNavegacao(base(c))).resolves.toBe('erro');
  });
});

describe('grade do modo pilotando (decisão do dono: botões menores, mais mapa)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { medidasGrade, ordemAcoes } = require('./gradePilotando') as typeof import('./gradePilotando');

  it.each([320, 360, 390, 412])('em pé com %i dp: 3 colunas, botões ≥ 90 dp e grade < 30 %% da tela', (w) => {
    const g = medidasGrade(w, false);
    expect(g.colunas).toBe(3);
    expect(Math.min(g.largura, g.altura)).toBeGreaterThanOrEqual(90);
    expect(2 * g.altura + g.vao + 2 * g.margem).toBeLessThanOrEqual(0.3 * 800);
  });

  it('SOS fica no canto de cima à direita e Encerrar embaixo à direita', () => {
    expect(ordemAcoes[2]).toBe('sos');
    expect(ordemAcoes[5]).toBe('encerrar');
  });
});

describe('irParaDestino (posto escolhido no modo pilotando)', () => {
  const destino = { title: 'Posto', position: { lat: -15.6, lng: -56.1 } };

  it('troca o destino e volta a guiar', async () => {
    const setDestinations = jest.fn(async () => 'OK');
    const startGuidance = jest.fn(async () => undefined);
    expect(await irParaDestino({ setDestinations, startGuidance }, destino)).toBe(true);
    expect(setDestinations).toHaveBeenCalledWith([destino], expect.anything());
    expect(startGuidance).toHaveBeenCalled();
  });

  it('devolve false se o Google recusar, sem guiar', async () => {
    const startGuidance = jest.fn(async () => undefined);
    expect(
      await irParaDestino({ setDestinations: async () => 'NO_ROUTE_FOUND', startGuidance }, destino),
    ).toBe(false);
    expect(startGuidance).not.toHaveBeenCalled();
  });
});
