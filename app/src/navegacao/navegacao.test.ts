import { destinosDaProva, distanciaKm, pontoADistancia, posicaoDoDestino } from './destinos';
import { iniciarNavegacao, MODO_MOTO, VOZ_COMPLETA_BLUETOOTH, type ControladorNavegacao } from './fluxo';

const cuiaba = { lat: -15.601, lng: -56.0974 };

function controladorFalso(ajustes: Partial<Record<keyof ControladorNavegacao, unknown>> = {}) {
  return {
    areTermsAccepted: jest.fn().mockResolvedValue(false),
    showTermsAndConditionsDialog: jest.fn().mockResolvedValue(true),
    init: jest.fn().mockResolvedValue('ok'),
    setDestinations: jest.fn().mockResolvedValue('OK'),
    setAudioGuidanceType: jest.fn().mockResolvedValue(undefined),
    startGuidance: jest.fn().mockResolvedValue(undefined),
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

  it('erro inesperado vira "erro"', async () => {
    const c = controladorFalso({ init: jest.fn().mockRejectedValue(new Error('x')) });
    await expect(iniciarNavegacao(base(c))).resolves.toBe('erro');
  });
});
