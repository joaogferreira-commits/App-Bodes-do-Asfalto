import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import SosRecebido from '@/app/sos-ativo/[id]';
import { lerSos } from '@/servidor/sos';

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'sos-1' }),
}));
jest.mock('@maplibre/maplibre-react-native', () => {
  const { View } = jest.requireActual('react-native');
  const Vazio = ({ children }: { children?: unknown }) => <View>{children as never}</View>;
  return { Map: Vazio, Camera: () => null, GeoJSONSource: Vazio, Layer: () => null };
});
jest.mock('@/servidor/sos', () => ({ ...jest.requireActual('@/servidor/sos'), lerSos: jest.fn() }));

const ler = lerSos as jest.Mock;
const base = {
  id: 'sos-1',
  quem: 'Zezão',
  tipo: 'pane',
  mensagem: 'Moto parou',
  telefone: '65 99999-0000',
  posicao: { lat: -15.6, lng: -56.1 },
  atualizadoEm: '2026-11-13T10:00:00Z',
  encerrado: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Linking, 'openURL').mockResolvedValue();
});

it('mostra quem pediu ajuda, o motivo, Ligar e Rota até ele', async () => {
  ler.mockResolvedValue(base);
  await render(<SosRecebido />);
  expect(await screen.findByText('Pedido de ajuda de Zezão')).toBeTruthy();
  expect(screen.getByText(/Pane mecânica/)).toBeTruthy();
  expect(screen.getByText('Moto parou')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Ligar' }));
  expect(Linking.openURL).toHaveBeenCalledWith('tel:65999990000');
  await fireEvent.press(screen.getByRole('button', { name: 'Rota até ele' }));
  expect(String((Linking.openURL as jest.Mock).mock.calls.at(-1)[0])).toContain(
    'destination=-15.600000,-56.100000',
  );
});

it('sem telefone não mostra Ligar', async () => {
  ler.mockResolvedValue({ ...base, telefone: null });
  await render(<SosRecebido />);
  await screen.findByText('Pedido de ajuda de Zezão');
  expect(screen.queryByRole('button', { name: 'Ligar' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Rota até ele' })).toBeTruthy();
});

it('SOS encerrado avisa e some com os botões', async () => {
  ler.mockResolvedValue({ ...base, encerrado: true });
  await render(<SosRecebido />);
  expect(await screen.findByText('Este SOS já foi encerrado.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Rota até ele' })).toBeNull();
});

it('sem permissão ou inexistente mostra mensagem de indisponível', async () => {
  ler.mockResolvedValue(null);
  await render(<SosRecebido />);
  expect(await screen.findByText(/Não consegui abrir este SOS/)).toBeTruthy();
});
