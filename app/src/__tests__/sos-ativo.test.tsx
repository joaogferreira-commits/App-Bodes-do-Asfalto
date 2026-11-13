import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { FaixaSosAtivo } from '@/componentes/FaixaSosAtivo';
import { ProvedorSosAtivo, sosRapido, useSosAtivo } from '@/estado/sosAtivo';
import { atualizarPosicaoSos, encerrarSosServidor, iniciarSosServidor, lerSos } from '@/servidor/sos';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Medium: 'm', Light: 'l' },
  NotificationFeedbackType: { Success: 's' },
}));
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({ coords: { latitude: -15.7, longitude: -56.2 } })),
  Accuracy: { High: 1 },
}));
jest.mock('@/servidor/supabase', () => ({ servidorConfigurado: true, supabase: {} }));
jest.mock('@/servidor/sos', () => ({
  ...jest.requireActual('@/servidor/sos'),
  iniciarSosServidor: jest.fn(),
  atualizarPosicaoSos: jest.fn(),
  encerrarSosServidor: jest.fn(),
  lerSos: jest.fn(),
}));

const iniciar = iniciarSosServidor as jest.Mock;
const atualizar = atualizarPosicaoSos as jest.Mock;
const encerrar = encerrarSosServidor as jest.Mock;
const ler = lerSos as jest.Mock;

function Gatilho() {
  const { iniciar: ini } = useSosAtivo();
  return (
    <Text onPress={() => void ini({ tipo: 'pane', mensagem: 'parei', posicao: { lat: -15.6, lng: -56.1 } })}>
      disparar
    </Text>
  );
}
const tela = () => (
  <ProvedorSosAtivo>
    <Gatilho />
    <FaixaSosAtivo />
  </ProvedorSosAtivo>
);

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  iniciar.mockResolvedValue('sos-1');
  atualizar.mockResolvedValue(true);
  encerrar.mockResolvedValue(true);
  ler.mockResolvedValue(null);
});

it('sem SOS ativo não mostra a faixa', async () => {
  await render(tela());
  expect(screen.queryByText('SOS ativo')).toBeNull();
});

it('iniciar chama o servidor com a posição e mostra a faixa', async () => {
  await render(tela());
  await fireEvent.press(screen.getByText('disparar'));
  expect(iniciar).toHaveBeenCalledWith({
    tipo: 'pane',
    mensagem: 'parei',
    posicao: { lat: -15.6, lng: -56.1 },
  });
  expect(await screen.findByText('SOS ativo')).toBeTruthy();
});

it('se o servidor falhar, não mostra a faixa', async () => {
  iniciar.mockResolvedValue(null);
  await render(tela());
  await fireEvent.press(screen.getByText('disparar'));
  expect(screen.queryByText('SOS ativo')).toBeNull();
});

it('atualiza a posição a cada 30 s enquanto ativo', async () => {
  jest.useFakeTimers();
  try {
    await render(tela());
    await fireEvent.press(screen.getByText('disparar'));
    await screen.findByText('SOS ativo');
    await act(async () => {
      jest.advanceTimersByTime(30_000);
    });
    expect(atualizar).toHaveBeenCalledWith('sos-1', { lat: -15.7, lng: -56.2 });
  } finally {
    jest.useRealTimers();
  }
});

it('segurar 1,5 s encerra no servidor e tira a faixa; soltar antes não encerra', async () => {
  jest.useFakeTimers();
  try {
    await render(tela());
    await fireEvent.press(screen.getByText('disparar'));
    const botao = await screen.findByRole('button', { name: 'Encerrar SOS' });
    await fireEvent(botao, 'pressIn');
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await fireEvent(botao, 'pressOut');
    expect(encerrar).not.toHaveBeenCalled();
    await fireEvent(botao, 'pressIn');
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    expect(encerrar).toHaveBeenCalledWith('sos-1');
    expect(screen.queryByText('SOS ativo')).toBeNull();
  } finally {
    jest.useRealTimers();
  }
});

it('restaura a faixa se o servidor ainda diz que está ativo', async () => {
  await AsyncStorage.setItem(
    'bodes.sosServidor',
    JSON.stringify({ id: 'sos-9', tipo: null, em: Date.now() }),
  );
  ler.mockResolvedValue({ id: 'sos-9', encerrado: false });
  await render(tela());
  expect(await screen.findByText('SOS ativo')).toBeTruthy();
});

it('descarta o guardado se o servidor já encerrou', async () => {
  await AsyncStorage.setItem(
    'bodes.sosServidor',
    JSON.stringify({ id: 'sos-9', tipo: null, em: Date.now() }),
  );
  ler.mockResolvedValue({ id: 'sos-9', encerrado: true });
  await render(tela());
  await act(async () => undefined);
  expect(screen.queryByText('SOS ativo')).toBeNull();
  expect(await AsyncStorage.getItem('bodes.sosServidor')).toBeNull();
});

describe('SOS de um gesto (segurar 3 s no pilotando)', () => {
  const ctx = (extra = {}) => ({
    ativo: null,
    iniciando: false,
    iniciar: jest.fn().mockResolvedValue(true),
    encerrar: jest.fn(),
    ...extra,
  });
  it('avisa o servidor sem tipo', async () => {
    const c = ctx();
    expect(await sosRapido(c, true)).toBe(true);
    expect(c.iniciar).toHaveBeenCalledWith({ tipo: null });
  });
  it('não repete se já há SOS ativo, sem servidor ou sem provedor', async () => {
    const ativo = ctx({ ativo: { id: 'x', tipo: null, em: 1 } });
    expect(await sosRapido(ativo, true)).toBe(false);
    const c = ctx();
    expect(await sosRapido(c, false)).toBe(false);
    expect(await sosRapido(null, true)).toBe(false);
    expect(c.iniciar).not.toHaveBeenCalled();
  });
  it('nunca lança erro', async () => {
    const c = ctx({ iniciar: jest.fn().mockRejectedValue(new Error('x')) });
    expect(await sosRapido(c, true)).toBe(false);
  });
});
