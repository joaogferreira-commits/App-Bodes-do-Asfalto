import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as dialogo from '@/ui/dialogo';

import { ProvedorViagem } from '@/estado/viagem';
import TelaPilotando from '@/app/pilotando';

const permissao = { granted: false };

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({ granted: permissao.granted })),
  requestForegroundPermissionsAsync: jest.fn(async () => ({ granted: permissao.granted })),
  getCurrentPositionAsync: jest.fn(async () => ({ coords: { latitude: -15.6, longitude: -56.1 } })),
  watchPositionAsync: jest.fn(async () => ({ remove: jest.fn() })),
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
    NavigationView: () => <View testID="mapa-google" />,
    useNavigation: () => ({ navigationController: controlador }),
    useNavigationAuto: () => ({ setOnCustomNavigationAutoEvent: jest.fn() }),
    NavigationNightMode: { AUTO: 0, FORCE_DAY: 1, FORCE_NIGHT: 2 },
    TaskRemovedBehavior: { QUIT_SERVICE: 1 },
  };
});

const tela = () => (
  <ProvedorViagem>
    <TelaPilotando />
  </ProvedorViagem>
);

describe('modo pilotando', () => {
  beforeEach(() => {
    permissao.granted = false;
  });

  it('não monta o mapa do Google sem permissão de localização (evita o app fechar)', async () => {
    await render(tela());
    expect(screen.queryByTestId('mapa-google')).toBeNull();
    expect(await screen.findByRole('button', { name: 'Permitir localização' })).toBeTruthy();
  });

  it('com permissão, mostra o mapa e os 6 botões grandes', async () => {
    permissao.granted = true;
    await render(tela());
    expect(await screen.findByTestId('mapa-google')).toBeTruthy();
    for (const nome of ['Alerta', 'Reagrupar', 'SOS', 'Posto próximo', 'Posto na rota', 'Encerrar']) {
      expect(screen.getByRole('button', { name: nome })).toBeTruthy();
    }
  });

  it('SOS só dispara segurando 3 s; soltar antes cancela (R6)', async () => {
    permissao.granted = true;
    const alerta = jest.spyOn(dialogo, 'avisar').mockImplementation(() => undefined);
    await render(tela());
    const sos = await screen.findByRole('button', { name: 'SOS' });
    jest.useFakeTimers();
    try {
      await fireEvent(sos, 'pressIn');
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });
      await fireEvent(sos, 'pressOut');
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });
      const { router } = jest.requireMock('expo-router');
      expect(router.push).not.toHaveBeenCalledWith('/sos');

      await fireEvent(sos, 'pressIn');
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });
      expect(router.push).toHaveBeenCalledWith('/sos');
    } finally {
      jest.useRealTimers();
      alerta.mockRestore();
    }
  });

  it('Alerta responde com um toque e uma faixa, sem janela para fechar (R2)', async () => {
    permissao.granted = true;
    const alerta = jest.spyOn(dialogo, 'avisar').mockImplementation(() => undefined);
    await render(tela());
    await fireEvent.press(await screen.findByRole('button', { name: 'Alerta' }));
    expect(alerta).not.toHaveBeenCalled();
    expect(await screen.findByText('Alerta: chega com os passeios.')).toBeTruthy();
    alerta.mockRestore();
  });
});
