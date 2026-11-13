import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as dialogo from '@/ui/dialogo';

import MapaTela from '@/app/(abas)/index';
import { clienteConsultas } from '@/servidor/consulta';
import { ProvedorViagem } from '@/estado/viagem';
import * as aoVivo from '@/servidor/aoVivo';
import * as chat from '@/servidor/chat';

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
  watchPositionAsync: jest.fn(async () => ({ remove: jest.fn() })),
  Accuracy: { Balanced: 3 },
}));
jest.mock('@/servidor/supabase', () => ({ servidorConfigurado: true, supabase: {} }));
jest.mock('@/acesso/acesso', () => ({
  useAcessoOpcional: () => ({ modo: 'supabase', estado: 'membro', papel: 'membro' }),
}));
jest.mock('@/servidor/pontos', () => ({ carregarPontosDaArea: jest.fn(async () => []) }));
jest.mock('@/servidor/chat', () => ({ acenar: jest.fn() }));
jest.mock('@/servidor/aoVivo', () => ({
  ...jest.requireActual('@/servidor/aoVivo'),
  irmaosNaArea: jest.fn(),
  publicarPosicao: jest.fn(async () => true),
  removerPosicao: jest.fn(async () => true),
  sincronizarVisibilidade: jest.fn(async () => true),
}));
jest.mock('@/map/estilos', () => ({ useEstiloMapa: () => ({ version: 8, sources: {}, layers: [] }) }));
jest.mock('@/componentes/BotaoSOS', () => ({ BotaoSOS: () => null }));
jest.mock('@/componentes/CamadaLugares', () => ({ CamadaLugares: () => null }));
jest.mock('@maplibre/maplibre-react-native', () => {
  const React = jest.requireActual('react');
  const { View, Pressable } = jest.requireActual('react-native');
  return {
    Map: ({ children }: { children: unknown }) => <View>{children as never}</View>,
    Camera: React.forwardRef(function Camera() {
      return null;
    }),
    Marker: ({ id, children }: { id: string; children: unknown }) => (
      <View testID={`marcador-${id}`}>{children as never}</View>
    ),
    Layer: ({ id }: { id: string }) => <View testID={`camada-${id}`} />,
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

const m = (f: unknown) => f as jest.Mock;

const real: aoVivo.IrmaoAoVivo = {
  id: 'u-real',
  nome: 'Ricardo Lima',
  apelido: 'Rico',
  capitulo: 'Cuiabá',
  status: 'aberto',
  lat: -15.575,
  lng: -56.075,
  precisao: 'aproximado',
};

beforeEach(async () => {
  await AsyncStorage.clear();
  clienteConsultas.clear();
  m(aoVivo.irmaosNaArea).mockReset().mockResolvedValue([real]);
  m(chat.acenar).mockReset();
});

const Mapa = () => (
  <ProvedorViagem>
    <MapaTela />
  </ProvedorViagem>
);

describe('mapa ao vivo com irmãos reais', () => {
  it('troca os irmãos de exemplo pelos do servidor', async () => {
    await render(<Mapa />);
    expect(await screen.findByTestId('toque-irmaos-pontos-u-real')).toBeTruthy();
    expect(screen.queryByTestId('toque-irmaos-pontos-ze')).toBeNull();
    expect(aoVivo.irmaosNaArea).toHaveBeenCalled();
  });

  it('a ficha mostra apelido, capítulo e status, e Acenar chama o servidor', async () => {
    const alerta = jest.spyOn(dialogo, 'avisar').mockImplementation(() => undefined);
    m(chat.acenar).mockResolvedValueOnce(undefined).mockRejectedValueOnce({ motivo: 'limite' });
    await render(<Mapa />);
    await fireEvent.press(await screen.findByTestId('toque-irmaos-pontos-u-real'));
    expect(screen.getByText('Rico')).toBeTruthy();
    expect(screen.getByText('Capítulo: Cuiabá')).toBeTruthy();
    expect(screen.getByText('Aberto a encontro')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /Acenar/ }));
    await act(async () => undefined);
    expect(chat.acenar).toHaveBeenCalledWith('u-real');
    expect(alerta.mock.lastCall![0]).toBe('Aceno enviado para Rico');
    alerta.mockRestore();
  });

  it('limite diário vira mensagem amigável', async () => {
    const alerta = jest.spyOn(dialogo, 'avisar').mockImplementation(() => undefined);
    m(chat.acenar).mockRejectedValueOnce({ motivo: 'limite' });
    await render(<Mapa />);
    await fireEvent.press(await screen.findByTestId('toque-irmaos-pontos-u-real'));
    await fireEvent.press(screen.getByRole('button', { name: /Acenar/ }));
    await act(async () => undefined);
    expect(alerta.mock.lastCall![0]).toBe('Você já usou os acenos de hoje. Amanhã libera de novo.');
    alerta.mockRestore();
  });

  it('sem permissão de localização apaga a minha posição e não publica', async () => {
    await render(<Mapa />);
    await act(async () => undefined);
    expect(aoVivo.removerPosicao).toHaveBeenCalled();
    expect(aoVivo.publicarPosicao).not.toHaveBeenCalled();
  });
});
