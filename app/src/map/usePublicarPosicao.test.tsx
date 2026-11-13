import { act, renderHook } from '@testing-library/react-native';
import * as Location from 'expo-location';

import { visibilidadePadrao, type EstadoVisibilidade } from '@/estado/visibilidadeMapa';
import * as aoVivo from '@/servidor/aoVivo';

import { usePublicarPosicao } from './usePublicarPosicao';

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));
jest.mock('@/servidor/aoVivo', () => ({
  ...jest.requireActual('@/servidor/aoVivo'),
  publicarPosicao: jest.fn(async () => true),
  removerPosicao: jest.fn(async () => true),
  sincronizarVisibilidade: jest.fn(async () => true),
}));

const m = (f: unknown) => f as jest.Mock;
const invisivel: EstadoVisibilidade = { ...visibilidadePadrao, modo: 'invisivel' };
let aoReceber: (p: { coords: { latitude: number; longitude: number } }) => void = () => undefined;

beforeEach(() => {
  jest.clearAllMocks();
  m(Location.getForegroundPermissionsAsync).mockResolvedValue({ granted: true });
  m(Location.getLastKnownPositionAsync).mockResolvedValue({ coords: { latitude: -15.6, longitude: -56.1 } });
  m(Location.watchPositionAsync).mockImplementation(async (_o, cb) => {
    aoReceber = cb;
    return { remove: jest.fn() };
  });
});

describe('usePublicarPosicao', () => {
  it('publica a primeira posição e respeita o freio (60 s / 500 m)', async () => {
    await renderHook(() => usePublicarPosicao(true, visibilidadePadrao));
    await act(async () => undefined);
    expect(aoVivo.publicarPosicao).toHaveBeenCalledTimes(1);
    await act(async () => aoReceber({ coords: { latitude: -15.6001, longitude: -56.1 } }));
    expect(aoVivo.publicarPosicao).toHaveBeenCalledTimes(1);
    await act(async () => aoReceber({ coords: { latitude: -15.61, longitude: -56.1 } }));
    expect(aoVivo.publicarPosicao).toHaveBeenCalledTimes(2);
    expect(m(Location.watchPositionAsync).mock.calls[0][0]).toMatchObject({
      timeInterval: aoVivo.INTERVALO_PUBLICAR_MS,
      distanceInterval: aoVivo.DISTANCIA_PUBLICAR_M,
    });
  });

  it('invisível apaga a posição do servidor e não publica nem observa o GPS', async () => {
    await renderHook(() => usePublicarPosicao(true, invisivel));
    await act(async () => undefined);
    expect(aoVivo.sincronizarVisibilidade).toHaveBeenCalledWith(invisivel);
    expect(aoVivo.publicarPosicao).not.toHaveBeenCalled();
    expect(Location.watchPositionAsync).not.toHaveBeenCalled();
  });

  it('sem permissão apaga e não publica; sem servidor (inativo) não faz nada', async () => {
    m(Location.getForegroundPermissionsAsync).mockResolvedValue({ granted: false });
    await renderHook(() => usePublicarPosicao(true, visibilidadePadrao));
    await act(async () => undefined);
    expect(aoVivo.removerPosicao).toHaveBeenCalled();
    expect(aoVivo.publicarPosicao).not.toHaveBeenCalled();
    jest.clearAllMocks();
    await renderHook(() => usePublicarPosicao(false, visibilidadePadrao));
    await act(async () => undefined);
    expect(aoVivo.removerPosicao).not.toHaveBeenCalled();
    expect(Location.getForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it('trocar para invisível depois apaga a posição', async () => {
    let estado = visibilidadePadrao;
    const { rerender } = await renderHook(() => usePublicarPosicao(true, estado));
    await act(async () => undefined);
    estado = invisivel;
    await rerender({});
    await act(async () => undefined);
    expect(aoVivo.sincronizarVisibilidade).toHaveBeenLastCalledWith(invisivel);
  });
});
