import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import MapaTela from '@/app/(abas)/index';
import { ProvedorViagem } from '@/estado/viagem';
import { escolherModo, modoEfetivo, visibilidadePadrao } from '@/estado/visibilidadeMapa';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), navigate: jest.fn() },
}));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ granted: false })),
  getLastKnownPositionAsync: jest.fn(async () => null),
  getCurrentPositionAsync: jest.fn(async () => null),
  Accuracy: { Balanced: 3 },
}));
jest.mock('@/map/estilos', () => ({ useEstiloMapa: () => ({ version: 8, sources: {}, layers: [] }) }));
jest.mock('@/componentes/BotaoSOS', () => ({ BotaoSOS: () => null }));
jest.mock('@/componentes/CamadaLugares', () => ({ CamadaLugares: () => null }));
jest.mock('@maplibre/maplibre-react-native', () => {
  const React = jest.requireActual('react');
  const { View, Pressable } = jest.requireActual('react-native');
  return {
    Map: ({ children, onRegionDidChange }: { children: unknown; onRegionDidChange: (e: object) => void }) => (
      <View>
        <Pressable testID="zoom-longe" onPress={() => onRegionDidChange({ nativeEvent: { zoom: 6 } })} />
        <Pressable testID="zoom-perto" onPress={() => onRegionDidChange({ nativeEvent: { zoom: 14 } })} />
        {children as never}
      </View>
    ),
    Camera: React.forwardRef(function Camera() {
      return null;
    }),
    Marker: ({ id, children }: { id: string; children: unknown }) => (
      <View testID={`marcador-${id}`}>{children as never}</View>
    ),
    Layer: ({ id, ...p }: { id: string }) => <View testID={`camada-${id}`} {...p} />,
    GeoJSONSource: ({
      id,
      data,
      onPress,
      children,
    }: {
      id: string;
      data: { features: { id: string }[] };
      onPress: (e: object) => void;
      children: unknown;
    }) => (
      <View testID={`fonte-${id}`}>
        {data.features.map((f) => (
          <Pressable
            key={f.id}
            testID={`toque-${id}-${f.id}`}
            onPress={() => onPress({ nativeEvent: { features: [{ properties: { id: f.id } }] } })}
          />
        ))}
        {children as never}
      </View>
    ),
  };
});

const Mapa = () => (
  <ProvedorViagem>
    <MapaTela />
  </ProvedorViagem>
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('mapa: correções do dono', () => {
  it('Ágape vira ponto de longe e emblema de perto', async () => {
    await render(<Mapa />);
    await fireEvent.press(screen.getByTestId('zoom-longe'));
    expect(screen.queryByTestId('marcador-agape-trevo')).toBeNull();
    expect(screen.getByTestId('camada-agapes-ponto').props.maxzoom).toBe(10);
    await fireEvent.press(screen.getByTestId('zoom-perto'));
    expect(screen.getByTestId('marcador-agape-trevo')).toBeTruthy();
  });

  it('irmãos abrem a ficha pela camada, de longe e de perto', async () => {
    await render(<Mapa />);
    await fireEvent.press(screen.getByTestId('zoom-longe'));
    const longe = screen.getAllByTestId(/^toque-irmaos-pontos-/)[0]!;
    await fireEvent.press(longe);
    expect(screen.getByRole('button', { name: /Acenar/ })).toBeTruthy();
    await fireEvent.press(screen.getByTestId('zoom-perto'));
    expect(screen.getByTestId('camada-irmaos-toque')).toBeTruthy();
    const avatar = screen
      .getAllByTestId(/^marcador-/)
      .find((n) => n.props.testID !== 'marcador-agape-trevo')!;
    expect((avatar.children[0] as { props: { pointerEvents?: string } }).props.pointerEvents).toBe('none');
  });

  it('banner do Ágape: Vou, Não vou e X o escondem e a escolha fica guardada', async () => {
    await render(<Mapa />);
    await fireEvent.press(screen.getByRole('button', { name: 'Fechar aviso do Ágape' }));
    expect(screen.queryByRole('button', { name: 'Fechar aviso do Ágape' })).toBeNull();
    await waitFor(async () =>
      expect(JSON.parse((await AsyncStorage.getItem('bodes.agapesDispensados')) ?? '[]')).toContain(
        'agape-trevo',
      ),
    );
  });

  it('Vou grava a resposta e esconde o banner; Não vou também esconde', async () => {
    await render(<Mapa />);
    await fireEvent.press(screen.getByRole('button', { name: 'Vou' }));
    expect(screen.queryByRole('button', { name: 'Não vou' })).toBeNull();
    await waitFor(async () =>
      expect(JSON.parse((await AsyncStorage.getItem('bodes.agapesVou')) ?? '[]')).toContain('agape-trevo'),
    );
    await AsyncStorage.clear();
    await render(<Mapa />);
    await fireEvent.press(screen.getAllByRole('button', { name: 'Não vou' })[0]!);
    expect(screen.queryByRole('button', { name: 'Não vou' })).toBeNull();
  });

  it('banner já dispensado não volta', async () => {
    await AsyncStorage.setItem('bodes.agapesDispensados', JSON.stringify(['agape-trevo']));
    await render(<Mapa />);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Não vou' })).toBeNull());
  });

  it('botão de visibilidade abre o seletor e o rótulo acompanha a escolha', async () => {
    await render(<Mapa />);
    expect(screen.getByText('Aprox.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Como apareço no mapa' }));
    for (const n of [
      'Invisível',
      'Só a cidade',
      'Aproximado (~5 km)',
      'Preciso para amigos',
      'Preciso no comboio',
    ])
      expect(screen.getByRole('radio', { name: n })).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio', { name: 'Invisível' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Pronto' }));
    expect(screen.getByText('Invisível')).toBeTruthy();
    await waitFor(async () =>
      expect(JSON.parse((await AsyncStorage.getItem('bodes.visibilidadeMapa')) ?? '{}').modo).toBe(
        'invisivel',
      ),
    );
  });

  it('legenda fecha ao tocar fora', async () => {
    await render(<Mapa />);
    await fireEvent.press(screen.getByRole('button', { name: 'Legenda do mapa' }));
    expect(screen.getByText('Asfalto')).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Fechar legenda' })));
    expect(screen.queryByText('Asfalto')).toBeNull();
  });
});

describe('visibilidade: modo temporário', () => {
  it('volta sozinho ao modo anterior depois de 2 h', () => {
    const t0 = 1_000_000;
    const e = escolherModo(visibilidadePadrao, 'precisoComboio', true, t0);
    expect(modoEfetivo(e, t0 + 1000)).toBe('precisoComboio');
    expect(modoEfetivo(e, t0 + 2 * 3600 * 1000)).toBe('aproximado');
  });
  it('escolha normal limpa o temporário', () => {
    const e = escolherModo(visibilidadePadrao, 'cidade', false);
    expect(e.temporario).toBeNull();
    expect(modoEfetivo(e)).toBe('cidade');
  });
});
