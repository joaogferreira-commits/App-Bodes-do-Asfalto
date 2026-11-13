import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Location from 'expo-location';

import MapaTela from '@/app/(abas)/index';
import { ProvedorViagem } from '@/estado/viagem';

const mockCamera = { easeTo: jest.fn(), flyTo: jest.fn(), zoomTo: jest.fn() };
let mockFocada = true;

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), navigate: jest.fn() },
  useIsFocused: () => mockFocada,
}));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(async () => null),
  getCurrentPositionAsync: jest.fn(async () => null),
  watchPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));
jest.mock('@/map/estilos', () => ({ useEstiloMapa: () => ({ version: 8, sources: {}, layers: [] }) }));
jest.mock('@/componentes/BotaoSOS', () => ({ BotaoSOS: () => null }));
jest.mock('@/componentes/CamadaLugares', () => ({ CamadaLugares: () => null }));
jest.mock('@maplibre/maplibre-react-native', () => {
  const React = jest.requireActual('react');
  const { View, Pressable } = jest.requireActual('react-native');
  return {
    Map: ({
      children,
      onRegionWillChange,
    }: {
      children: unknown;
      onRegionWillChange: (e: object) => void;
    }) => (
      <View>
        <Pressable
          testID="arrastar"
          onPress={() => onRegionWillChange({ nativeEvent: { userInteraction: true } })}
        />
        <Pressable
          testID="mover-programado"
          onPress={() => onRegionWillChange({ nativeEvent: { userInteraction: false } })}
        />
        {children as never}
      </View>
    ),
    Camera: React.forwardRef(function Camera(_p: object, ref: unknown) {
      React.useImperativeHandle(ref, () => mockCamera);
      return null;
    }),
    Marker: ({ id, lngLat, children }: { id: string; lngLat: number[]; children: unknown }) => (
      <View testID={`marcador-${id}`} accessibilityValue={{ text: lngLat.join(',') }}>
        {children as never}
      </View>
    ),
    Layer: () => null,
    GeoJSONSource: ({ children }: { children: unknown }) => <View>{children as never}</View>,
  };
});

const m = (f: unknown) => f as jest.Mock;
type Callback = (p: { coords: { latitude: number; longitude: number; heading?: number } }) => void;
let callback: Callback | null;
const remover = jest.fn();

const Mapa = () => (
  <ProvedorViagem>
    <MapaTela />
  </ProvedorViagem>
);

const posicao = (longitude: number, latitude: number, heading = -1) =>
  act(async () => callback?.({ coords: { latitude, longitude, heading } }));

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  mockFocada = true;
  callback = null;
  m(Location.getForegroundPermissionsAsync).mockResolvedValue({ granted: true });
  m(Location.requestForegroundPermissionsAsync).mockResolvedValue({ granted: true });
  m(Location.watchPositionAsync).mockImplementation(async (o: { distanceInterval: number }, cb: Callback) => {
    if (o.distanceInterval === 10) callback = cb; // só o acompanhamento do mapa (há outros observadores de GPS)
    return { remove: remover };
  });
});

describe('posição ao vivo no mapa', () => {
  it('acompanha o GPS com permissão e tela em foco, e move o marcador', async () => {
    await render(<Mapa />);
    await act(async () => undefined);
    expect(callback).not.toBeNull();
    expect(Location.watchPositionAsync).toHaveBeenCalledWith(
      expect.objectContaining({ accuracy: 3, distanceInterval: 10, timeInterval: 3000 }),
      expect.any(Function),
    );
    expect(screen.queryByTestId('marcador-eu')).toBeNull();
    await posicao(-56.1, -15.6);
    expect(screen.getByTestId('marcador-eu').props.accessibilityValue.text).toBe('-56.1,-15.6');
    await posicao(-56.2, -15.7);
    expect(screen.getByTestId('marcador-eu').props.accessibilityValue.text).toBe('-56.2,-15.7');
  });

  it('não acompanha sem permissão nem pede permissão sozinho', async () => {
    m(Location.getForegroundPermissionsAsync).mockResolvedValue({ granted: false });
    await render(<Mapa />);
    await act(async () => undefined);
    expect(callback).toBeNull();
    expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it('não acompanha com a tela fora de foco e para ao sair', async () => {
    mockFocada = false;
    const { rerender } = await render(<Mapa />);
    await act(async () => undefined);
    expect(callback).toBeNull();
    mockFocada = true;
    await rerender(<Mapa />);
    await act(async () => undefined);
    expect(callback).not.toBeNull();
    remover.mockClear();
    mockFocada = false;
    await rerender(<Mapa />);
    expect(remover).toHaveBeenCalled();
  });

  it('mostra a seta de rumo só com rumo válido', async () => {
    await render(<Mapa />);
    await act(async () => undefined);
    await posicao(-56.1, -15.6, -1);
    expect(screen.queryByTestId('seta-rumo')).toBeNull();
    await posicao(-56.1, -15.61, 90);
    expect(screen.getByTestId('seta-rumo')).toBeTruthy();
  });

  it('"Eu" centraliza e segue; arrastar o mapa sai do modo seguir', async () => {
    await render(<Mapa />);
    await act(async () => undefined);
    const botao = () => screen.getByRole('button', { name: 'Minha localização' });
    expect(botao().props.accessibilityState).toMatchObject({ selected: false });
    await fireEvent.press(botao());
    await act(async () => undefined);
    expect(botao().props.accessibilityState).toMatchObject({ selected: true });
    mockCamera.easeTo.mockClear();
    await posicao(-56.3, -15.8);
    expect(mockCamera.easeTo).toHaveBeenCalledWith({ center: [-56.3, -15.8], duration: 500 });

    await fireEvent.press(screen.getByTestId('mover-programado'));
    expect(botao().props.accessibilityState).toMatchObject({ selected: true });
    await fireEvent.press(screen.getByTestId('arrastar'));
    expect(botao().props.accessibilityState).toMatchObject({ selected: false });
    mockCamera.easeTo.mockClear();
    await posicao(-56.4, -15.9);
    expect(mockCamera.easeTo).not.toHaveBeenCalled();
  });
});
