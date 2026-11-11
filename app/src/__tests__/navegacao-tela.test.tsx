import { fireEvent, render, screen } from '@testing-library/react-native';

import TelaNavegacao from '@/app/navegacao';

const permissao = { granted: false };

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({ granted: permissao.granted })),
  requestForegroundPermissionsAsync: jest.fn(async () => {
    permissao.granted = true;
    return { granted: true };
  }),
  getCurrentPositionAsync: jest.fn(async () => ({ coords: { latitude: -15.6, longitude: -56.1 } })),
  Accuracy: { High: 4 },
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
    NavigationView: (props: object) => <View {...props} />,
    useNavigation: () => ({ navigationController: controlador }),
    NavigationNightMode: { FORCE_NIGHT: 2 },
    TaskRemovedBehavior: { QUIT_SERVICE: 1 },
  };
});

describe('tela de navegação', () => {
  beforeEach(() => {
    permissao.granted = false;
  });

  it('não monta o mapa do Google antes da permissão de localização (evita o app fechar)', async () => {
    await render(<TelaNavegacao />);
    expect(screen.queryByTestId('mapa-navegacao')).toBeNull();
    expect(await screen.findByText('Precisamos da sua localização para traçar a rota.')).toBeTruthy();
  });

  it('monta o mapa quando a permissão já existe', async () => {
    permissao.granted = true;
    await render(<TelaNavegacao />);
    expect(await screen.findByTestId('mapa-navegacao')).toBeTruthy();
  });

  it('ao iniciar, pede a permissão e só então mostra o mapa', async () => {
    await render(<TelaNavegacao />);
    await fireEvent.press(screen.getByRole('button', { name: 'Iniciar navegação' }));
    expect(await screen.findByTestId('mapa-navegacao')).toBeTruthy();
  });
});
