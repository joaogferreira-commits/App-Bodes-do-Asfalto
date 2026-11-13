import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import MapaTela from '@/app/(abas)/index';
import { ProvedorViagem } from '@/estado/viagem';
import { escolherModo, modoEfetivo, visibilidadePadrao } from '@/estado/visibilidadeMapa';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), navigate: jest.fn() },
  useIsFocused: () => true,
}));
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
        <Pressable
          testID="zoom-sao-paulo"
          onPress={() =>
            onRegionDidChange({ nativeEvent: { zoom: 11, bounds: [-46.7, -23.6, -46.5, -23.4] } })
          }
        />
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

  it('tem só 4 chips e "Mais" abre os grupos; escolher filtra e mostra o grupo no chip', async () => {
    await render(<Mapa />);
    for (const n of ['Tudo', 'Irmãos', 'Postos', 'Mais'])
      expect(screen.getByRole('button', { name: n })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Clube' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Mais' }));
    for (const n of ['Clube', 'Natureza', 'Cultura', 'Apoio'])
      expect(screen.getByRole('radio', { name: n })).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio', { name: 'Natureza' }));
    expect(screen.queryByRole('radio', { name: 'Clube' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Natureza', selected: true })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Mais' })).toBeNull();
  });

  it('a legenda saiu do mapa e vive em "O que significa cada ícone" dentro do Mais', async () => {
    await render(<Mapa />);
    expect(screen.queryByRole('button', { name: 'Legenda do mapa' })).toBeNull();
    expect(screen.queryByTestId('legenda-tipos')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Mais' }));
    await fireEvent.press(screen.getByRole('button', { name: 'O que significa cada ícone' }));
    expect(screen.getByTestId('legenda-tipos')).toBeTruthy();
    expect(screen.getByText('Asfalto')).toBeTruthy();
  });

  it('folha recolhida mostra o resumo e Posto mais próximo; sem "Posto na rota"', async () => {
    await render(<Mapa />);
    expect(screen.getByText('Nesta área: 3 irmãos · 1 postos')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Posto mais próximo' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Posto na rota' })).toBeNull();
    expect(screen.queryByText('Irmãos por perto')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Abrir o painel' }));
    expect(screen.getByText('Irmãos por perto')).toBeTruthy();
    expect(screen.getByText('Próximo passeio')).toBeTruthy();
  });

  it('Ágape longe e fora da janela de 2 h não aparece', async () => {
    const hora = new Date(2026, 10, 13, 10, 0).getTime(); // 10h; o Ágape é às 19h30
    const agora = jest.spyOn(Date, 'now').mockReturnValue(hora);
    await render(<Mapa />);
    expect(screen.getByRole('button', { name: 'Não vou' })).toBeTruthy(); // perto (menos de 10 km)
    await fireEvent.press(screen.getByTestId('zoom-sao-paulo'));
    expect(screen.queryByRole('button', { name: 'Não vou' })).toBeNull();
    agora.mockRestore();
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
