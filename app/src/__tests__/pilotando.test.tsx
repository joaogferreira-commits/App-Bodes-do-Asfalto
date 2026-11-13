import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as dialogo from '@/ui/dialogo';

import { ProvedorViagem } from '@/estado/viagem';
import TelaPilotando from '@/app/pilotando';
import * as avisos from '@/servidor/avisosEstrada';
import { falar } from '@/seguranca/voz';

const permissao = { granted: false };

jest.mock('@/servidor/avisosEstrada', () => ({
  conversaDoComboio: jest.fn(async () => 'grupo-1'),
  enviarAlerta: jest.fn(async () => true),
  enviarReagrupar: jest.fn(async () => true),
  ouvirAvisos: jest.fn(() => () => undefined),
}));
jest.mock('@/servidor/pontos', () => ({
  carregarPostosDaArea: jest.fn(async () => [
    { id: 'node/1', tipo: 'posto', nome: 'Posto Central', lat: -15.61, lng: -56.1 },
  ]),
}));
jest.mock('@/seguranca/voz', () => ({ falar: jest.fn() }));

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
    jest.clearAllMocks();
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

  it('Alerta abre a grade de 6 tipos e envia o escolhido ao grupo, com voz (R2)', async () => {
    permissao.granted = true;
    const janela = jest.spyOn(dialogo, 'avisar').mockImplementation(() => undefined);
    await render(tela());
    await fireEvent.press(await screen.findByRole('button', { name: 'Alerta' }));
    for (const nome of [
      'Buraco',
      'Polícia',
      'Obra',
      'Animal na pista',
      'Acidente à frente',
      'Óleo ou areia',
    ]) {
      expect(screen.getByRole('button', { name: nome })).toBeTruthy();
    }
    await fireEvent.press(screen.getByRole('button', { name: 'Buraco' }));
    expect(await screen.findByText('Alerta enviado: Buraco')).toBeTruthy();
    expect(avisos.enviarAlerta).toHaveBeenCalledWith('grupo-1', 'buraco', { lat: -15.6, lng: -56.1 });
    expect(falar).toHaveBeenCalledWith('Alerta enviado: Buraco');
    expect(janela).not.toHaveBeenCalled();
    janela.mockRestore();
  });

  it('sem comboio ou passeio ativo, o alerta não é enviado e avisa', async () => {
    permissao.granted = true;
    (avisos.conversaDoComboio as jest.Mock).mockResolvedValueOnce(null);
    await render(tela());
    await fireEvent.press(await screen.findByRole('button', { name: 'Alerta' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Obra' }));
    expect(await screen.findByText('Sem comboio ou passeio ativo. Alerta não enviado.')).toBeTruthy();
    expect(avisos.enviarAlerta).not.toHaveBeenCalled();
  });

  it('Reagrupar manda o aviso ao grupo e fala', async () => {
    permissao.granted = true;
    await render(tela());
    await fireEvent.press(await screen.findByRole('button', { name: 'Reagrupar' }));
    expect(await screen.findByText('Reagrupar enviado ao grupo.')).toBeTruthy();
    expect(avisos.enviarReagrupar).toHaveBeenCalledWith('grupo-1', { lat: -15.6, lng: -56.1 });
    expect(falar).toHaveBeenCalledWith('Reagrupar enviado ao grupo.');
  });

  it('Posto próximo busca no banco e pede confirmação para ir; confirmar troca o destino', async () => {
    permissao.granted = true;
    const janela = jest.spyOn(dialogo, 'avisar').mockImplementation(() => undefined);
    await render(tela());
    await fireEvent.press(await screen.findByRole('button', { name: 'Posto próximo' }));
    await waitFor(() => expect(janela).toHaveBeenCalled());
    const [titulo, mensagem, botoes] = janela.mock.calls[0]!;
    expect(titulo).toBe('Ir ao posto');
    expect(mensagem).toContain('Posto Central');
    const ir = botoes!.find((b) => b.text.startsWith('Ir ao posto ('))!;
    await act(async () => ir.onPress?.());
    const { navigationController } = jest
      .requireMock('@googlemaps/react-native-navigation-sdk')
      .useNavigation();
    await waitFor(() =>
      expect(navigationController.setDestinations).toHaveBeenCalledWith(
        [{ title: 'Posto Central', position: { lat: -15.61, lng: -56.1 } }],
        expect.anything(),
      ),
    );
    janela.mockRestore();
  });

  it('Posto na rota sem rota ativa age como o mais próximo', async () => {
    permissao.granted = true;
    const janela = jest.spyOn(dialogo, 'avisar').mockImplementation(() => undefined);
    await render(tela());
    await fireEvent.press(await screen.findByRole('button', { name: 'Posto na rota' }));
    await waitFor(() => expect(janela).toHaveBeenCalled());
    expect(janela.mock.calls[0]![1]).toContain('Posto Central');
    janela.mockRestore();
  });

  it('alerta de outro irmão chega só por voz', async () => {
    permissao.granted = true;
    let entrega: (a: unknown, autor: string) => void = () => undefined;
    (avisos.ouvirAvisos as jest.Mock).mockImplementationOnce((_id: string, f: typeof entrega) => {
      entrega = f;
      return () => undefined;
    });
    await render(tela());
    await screen.findByTestId('mapa-google');
    await waitFor(() => expect(avisos.ouvirAvisos).toHaveBeenCalled());
    await act(async () => entrega({ tipo: 'alerta', alerta: 'policia', posicao: null }, 'Zé'));
    expect(falar).toHaveBeenCalledWith('Atenção, Polícia à frente.');
  });
});
