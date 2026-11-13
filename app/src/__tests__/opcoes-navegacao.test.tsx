import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import TelaPilotando from '@/app/pilotando';
import { ProvedorViagem } from '@/estado/viagem';
import {
  iniciarNavegacao,
  irParaDestino,
  replanejarRota,
  type ControladorNavegacao,
} from '@/navegacao/fluxo';
import { CHAVE_OPCOES, carregarOpcoes, opcoesPadrao, salvarOpcoes } from '@/navegacao/opcoes';
import { planejarRota } from '@/rotas/valhalla';

const mockProps: { atual: Record<string, unknown> } = { atual: {} };
const mockPerspectiva = jest.fn(async (_p: number) => undefined);
const mockVelocidade = { kmh: 0 };

jest.mock('@/servidor/avisosEstrada', () => ({
  conversaDoComboio: jest.fn(async () => null),
  enviarAlerta: jest.fn(),
  enviarReagrupar: jest.fn(),
  ouvirAvisos: jest.fn(() => () => undefined),
}));
jest.mock('@/servidor/pontos', () => ({ carregarPostosDaArea: jest.fn(async () => []) }));
jest.mock('@/seguranca/voz', () => ({ falar: jest.fn() }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestForegroundPermissionsAsync: jest.fn(async () => ({ granted: true })),
  getCurrentPositionAsync: jest.fn(async () => ({ coords: { latitude: -15.6, longitude: -56.1 } })),
  watchPositionAsync: jest.fn(async (_o: unknown, cb: (p: { coords: { speed: number } }) => void) => {
    cb({ coords: { speed: mockVelocidade.kmh / 3.6 } });
    return { remove: jest.fn() };
  }),
  Accuracy: { High: 4, Balanced: 3 },
}));
jest.mock('@googlemaps/react-native-navigation-sdk', () => {
  const { View } = jest.requireActual('react-native');
  const controlador = {
    areTermsAccepted: jest.fn(async () => true),
    showTermsAndConditionsDialog: jest.fn(async () => true),
    init: jest.fn(async () => 'ok'),
    setDestinations: jest.fn(async () => 'OK'),
    setAudioGuidanceType: jest.fn(async () => undefined),
    startGuidance: jest.fn(async () => undefined),
    stopGuidance: jest.fn(async () => undefined),
    clearDestinations: jest.fn(async () => undefined),
    cleanup: jest.fn(async () => undefined),
  };
  return {
    NavigationProvider: ({ children }: { children: React.ReactNode }) => children,
    NavigationView: (props: {
      onNavigationViewControllerCreated?: (c: unknown) => void;
      [k: string]: unknown;
    }) => {
      mockProps.atual = props;
      props.onNavigationViewControllerCreated?.({ setFollowingPerspective: mockPerspectiva });
      return <View testID="mapa-google" />;
    },
    useNavigation: () => ({ navigationController: controlador }),
    useNavigationAuto: () => ({ setOnCustomNavigationAutoEvent: jest.fn() }),
    NavigationNightMode: { AUTO: 0, FORCE_DAY: 1, FORCE_NIGHT: 2 },
    TaskRemovedBehavior: { QUIT_SERVICE: 1 },
  };
});

const cuiaba = { lat: -15.601, lng: -56.0974 };
const destino = { title: 'Destino', position: { lat: -15.7, lng: -56.2 } };

function controladorFalso(extra: Partial<Record<string, unknown>> = {}) {
  return {
    areTermsAccepted: jest.fn().mockResolvedValue(true),
    showTermsAndConditionsDialog: jest.fn().mockResolvedValue(true),
    init: jest.fn().mockResolvedValue('ok'),
    setDestinations: jest.fn().mockResolvedValue('OK'),
    setAudioGuidanceType: jest.fn().mockResolvedValue(undefined),
    startGuidance: jest.fn().mockResolvedValue(undefined),
    ...extra,
  } as unknown as jest.Mocked<ControladorNavegacao>;
}

const ctrlDaTela = () =>
  jest.requireMock('@googlemaps/react-native-navigation-sdk').useNavigation().navigationController;

const tela = () => (
  <ProvedorViagem>
    <TelaPilotando />
  </ProvedorViagem>
);

describe('opções de navegação: persistência', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('sem nada guardado usa o padrão', async () => {
    await expect(carregarOpcoes()).resolves.toEqual(opcoesPadrao);
  });

  it('guarda e lê as escolhas em bodes.opcoesNavegacao', async () => {
    const o = {
      ...opcoesPadrao,
      transito: true,
      mapa: 'satelite' as const,
      voz: 'mudo' as const,
      estrada: 'terra' as const,
    };
    await salvarOpcoes(o);
    expect(await AsyncStorage.getItem('bodes.opcoesNavegacao')).toContain('satelite');
    expect(CHAVE_OPCOES).toBe('bodes.opcoesNavegacao');
    await expect(carregarOpcoes()).resolves.toEqual(o);
  });

  it('valor inválido guardado volta ao padrão', async () => {
    await AsyncStorage.setItem(
      CHAVE_OPCOES,
      JSON.stringify({ mapa: 'xyz', transito: 'sim', voz: 'alertas' }),
    );
    const o = await carregarOpcoes();
    expect(o.mapa).toBe('normal');
    expect(o.transito).toBe(false);
    expect(o.voz).toBe('alertas');
  });
});

describe('evitar pedágios, rodovias e balsas', () => {
  const evitar = { avoidTolls: true, avoidHighways: true, avoidFerries: false };

  it('iniciarNavegacao passa as opções em routingOptions e a voz escolhida', async () => {
    const c = controladorFalso();
    await iniciarNavegacao({
      controlador: c,
      pedirPermissaoLocalizacao: async () => true,
      posicaoAtual: async () => cuiaba,
      destino: () => destino.position,
      tituloDestino: 'T',
      evitar,
      voz: 2 | 8,
    });
    expect(c.setDestinations).toHaveBeenCalledWith(expect.anything(), {
      routingOptions: expect.objectContaining(evitar),
    });
    expect(c.setAudioGuidanceType).toHaveBeenCalledWith(10);
  });

  it('irParaDestino também leva as opções', async () => {
    const c = controladorFalso();
    await irParaDestino(c, destino, evitar);
    expect(c.setDestinations).toHaveBeenCalledWith([destino], {
      routingOptions: expect.objectContaining(evitar),
    });
  });

  it('o planejamento no Valhalla zera pedágio, rodovia e balsa', async () => {
    const buscar = jest.fn(async () => ({ ok: false, status: 400, json: async () => ({}) }));
    await planejarRota(cuiaba, destino.position, 'misto', buscar, {
      evitar: { avoidTolls: true, avoidHighways: true, avoidFerries: true },
    }).catch(() => undefined);
    const corpo = JSON.parse((buscar.mock.calls[0] as unknown as [string, { body: string }])[1].body);
    expect(corpo.costing_options.motorcycle).toMatchObject({ use_tolls: 0, use_highways: 0, use_ferry: 0 });
  });
});

describe('replanejarRota (troca do tipo de estrada)', () => {
  const rota = { forma: [cuiaba, destino.position], km: 10 } as never;
  const base = (c: ReturnType<typeof controladorFalso>) => ({
    controlador: c,
    posicaoAtual: async () => cuiaba,
    destino,
    tipo: 'terra' as const,
    planejar: jest.fn(async () => rota),
    token: jest.fn(async () => 'token-novo'),
  });

  it('planeja com o tipo novo, troca o token e reinicia o guia', async () => {
    const c = controladorFalso();
    const dep = base(c);
    const r = await replanejarRota(dep);
    expect(r.ok).toBe(true);
    expect(dep.planejar).toHaveBeenCalledWith(cuiaba, 'terra');
    expect(c.setDestinations).toHaveBeenCalledWith([destino], {
      routeTokenOptions: { routeToken: 'token-novo', travelMode: 0 },
    });
    expect(c.startGuidance).toHaveBeenCalled();
  });

  it.each([
    ['o Valhalla falha', (d: ReturnType<typeof base>) => d.planejar.mockRejectedValue(new Error('x'))],
    ['o Google não dá token', (d: ReturnType<typeof base>) => d.token.mockResolvedValue(null as never)],
  ])('se %s, mantém a rota antiga (não troca destino)', async (_n, quebrar) => {
    const c = controladorFalso();
    const dep = base(c);
    quebrar(dep);
    await expect(replanejarRota(dep)).resolves.toEqual({ ok: false });
    expect(c.setDestinations).not.toHaveBeenCalled();
  });

  it('se o Google recusa o token, não reinicia o guia', async () => {
    const c = controladorFalso({ setDestinations: jest.fn().mockResolvedValue('NO_ROUTE_FOUND') });
    await expect(replanejarRota(base(c))).resolves.toEqual({ ok: false });
    expect(c.startGuidance).not.toHaveBeenCalled();
  });
});

describe('folha Camadas e opções na tela', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    mockVelocidade.kmh = 0;
  });

  it('abre mesmo em movimento (sem liberação de garupa) e mostra seis grupos grandes', async () => {
    mockVelocidade.kmh = 60;
    await render(tela());
    await screen.findByTestId('mapa-google');
    await fireEvent.press(await screen.findByRole('button', { name: 'Camadas e opções' }));
    expect(screen.getByTestId('folha-opcoes')).toBeTruthy();
    for (const nome of [
      'Trânsito',
      'Tipo de mapa',
      'Visão',
      'Voz',
      'Evitar (na próxima rota)',
      'Estrada de chão',
    ]) {
      expect(screen.getByText(nome)).toBeTruthy();
    }
    expect(screen.queryByText('Sou garupa / passageiro')).toBeNull();
  });

  it('um toque aplica trânsito, tipo de mapa, visão e voz, e guarda', async () => {
    await render(tela());
    await screen.findByTestId('mapa-google');
    await fireEvent.press(await screen.findByRole('button', { name: 'Camadas e opções' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Ligado' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Satélite' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Norte para cima' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Mudo' }));
    expect(mockProps.atual.trafficEnabled).toBe(true);
    expect(mockProps.atual.mapType).toBe(2);
    expect(mockPerspectiva).toHaveBeenCalledWith(1);
    expect(ctrlDaTela().setAudioGuidanceType).toHaveBeenCalledWith(0);
    const guardado = JSON.parse((await AsyncStorage.getItem(CHAVE_OPCOES))!);
    expect(guardado).toMatchObject({ transito: true, mapa: 'satelite', visao: 'norte', voz: 'mudo' });
  });

  it('aplica as opções guardadas ao abrir', async () => {
    await salvarOpcoes({ ...opcoesPadrao, transito: true, mapa: 'hibrido', voz: 'alertas' });
    await render(tela());
    await waitFor(() => expect(mockProps.atual.mapType).toBe(4));
    expect(mockProps.atual.trafficEnabled).toBe(true);
    await waitFor(() => expect(ctrlDaTela().setAudioGuidanceType).toHaveBeenCalledWith(10));
  });

  it('evitar pedágios recalcula passando avoidTolls', async () => {
    await render(tela());
    await screen.findByTestId('mapa-google');
    await waitFor(() => expect(ctrlDaTela().startGuidance).toHaveBeenCalled());
    await fireEvent.press(await screen.findByRole('button', { name: 'Camadas e opções' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Pedágios' }));
    await waitFor(() =>
      expect(ctrlDaTela().setDestinations).toHaveBeenLastCalledWith(expect.anything(), {
        routingOptions: expect.objectContaining({ avoidTolls: true }),
      }),
    );
  });

  it('trocar o tipo de estrada replaneja; se falhar, mantém a rota e avisa', async () => {
    const buscar = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('sem rede'));
    await render(tela());
    await screen.findByTestId('mapa-google');
    await fireEvent.press(await screen.findByRole('button', { name: 'Camadas e opções' }));
    await act(async () => {
      await fireEvent.press(screen.getByRole('button', { name: 'Prefiro terra' }));
    });
    expect(await screen.findByText(/Mantendo a rota atual/)).toBeTruthy();
    expect(buscar).toHaveBeenCalled();
    buscar.mockRestore();
  });
});
