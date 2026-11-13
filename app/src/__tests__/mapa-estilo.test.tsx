import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen } from '@testing-library/react-native';

import MapaTela from '@/app/(abas)/index';
import { ProvedorViagem } from '@/estado/viagem';
import * as seguranca from '@/seguranca/useBloqueioEmMovimento';
import * as temaMapa from '@/map/temaMapa';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), navigate: jest.fn() } }));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ granted: false })),
  getForegroundPermissionsAsync: jest.fn(async () => ({ granted: false })),
  getLastKnownPositionAsync: jest.fn(async () => null),
  getCurrentPositionAsync: jest.fn(async () => null),
  Accuracy: { Balanced: 3 },
}));
jest.mock('@/seguranca/useBloqueioEmMovimento', () => ({ useBloqueioEmMovimento: jest.fn(() => false) }));
jest.mock('@/map/temaMapa', () => ({ useModoMapaAutomatico: jest.fn(() => null) }));
jest.mock('@/componentes/BotaoSOS', () => ({ BotaoSOS: () => null }));
jest.mock('@/componentes/CamadaLugares', () => ({ CamadaLugares: () => null }));
jest.mock('@maplibre/maplibre-react-native', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    Map: ({
      mapStyle,
      children,
    }: {
      mapStyle: { layers: { id: string }[]; name?: string };
      children: unknown;
    }) => (
      <View
        testID="mapa"
        accessibilityLabel={`${mapStyle.name ?? ''}|${mapStyle.layers.filter((l) => l.id.startsWith('extra-')).length}`}
      >
        {children as never}
      </View>
    ),
    Camera: React.forwardRef(function Camera() {
      return null;
    }),
    Marker: () => null,
    Layer: () => null,
    GeoJSONSource: ({ children }: { children: unknown }) => <View>{children as never}</View>,
  };
});

const m = (f: unknown) => f as jest.Mock;
const Mapa = () => (
  <ProvedorViagem>
    <MapaTela />
  </ProvedorViagem>
);
const lerMapa = () => String(screen.getByTestId('mapa').props.accessibilityLabel);

beforeEach(async () => {
  await AsyncStorage.clear();
  m(seguranca.useBloqueioEmMovimento).mockReturnValue(false);
  m(temaMapa.useModoMapaAutomatico).mockReturnValue(null);
});

describe('estilo do mapa na tela', () => {
  it('parado: mantém as camadas extras', async () => {
    await render(<Mapa />);
    expect(lerMapa().endsWith('|2')).toBe(true);
  });

  it('pilotando: nenhuma camada extra-', async () => {
    m(seguranca.useBloqueioEmMovimento).mockReturnValue(true);
    await render(<Mapa />);
    expect(lerMapa().endsWith('|0')).toBe(true);
  });

  it('modo automático troca entre o estilo de dia e o de noite', async () => {
    m(temaMapa.useModoMapaAutomatico).mockReturnValue('sol');
    const { unmount } = await render(<Mapa />);
    expect(lerMapa()).toContain('sol');
    await unmount();
    m(temaMapa.useModoMapaAutomatico).mockReturnValue('noite');
    await render(<Mapa />);
    expect(lerMapa()).not.toContain('sol');
  });
});
