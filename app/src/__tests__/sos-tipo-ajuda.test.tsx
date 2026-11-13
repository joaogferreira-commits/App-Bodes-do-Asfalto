import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking, Share } from 'react-native';

import Sos from '@/app/sos';
import { useBloqueioEmMovimento } from '@/seguranca/useBloqueioEmMovimento';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Warning: 'warning' },
}));
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false })),
  Accuracy: { High: 1 },
}));
jest.mock('@/seguranca/useBloqueioEmMovimento', () => ({ useBloqueioEmMovimento: jest.fn(() => false) }));
jest.mock('@/estado/perfil', () => ({
  usePerfilOpcional: () => ({
    perfil: { nome: 'Zé da Silva', apelido: 'Zezão' },
    contatos: [{ id: '1', nome: 'Maria', telefone: '65 99999-0000' }],
  }),
}));

const mov = useBloqueioEmMovimento as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mov.mockReturnValue(false);
  jest.spyOn(Linking, 'openURL').mockResolvedValue();
  jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction', activityType: undefined });
});

const corpoWhats = () =>
  decodeURIComponent(String((Linking.openURL as jest.Mock).mock.calls.at(-1)[0]).split('?text=')[1] ?? '');

it('mostra os tipos de ajuda e deixa escolher um', async () => {
  await render(<Sos />);
  for (const nome of [
    'Sofri acidente',
    'Mal-estar / saúde',
    'Pane mecânica',
    'Pneu furado',
    'Sem combustível',
    'Estou perdido',
    'Bateria / elétrica',
    'Outro',
  ]) {
    expect(screen.getByRole('button', { name: nome })).toBeTruthy();
  }
  await fireEvent.press(screen.getByRole('button', { name: 'Sem combustível' }));
  expect(screen.getByRole('button', { name: 'Sem combustível', selected: true })).toBeTruthy();
});

it('tipo urgente destaca o 192/193', async () => {
  await render(<Sos />);
  expect(screen.queryByText(/Situação grave/)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Sofri acidente' }));
  expect(screen.getByText(/Situação grave/)).toBeTruthy();
});

it('tipo + texto opcional entram no WhatsApp; sem texto também envia', async () => {
  await render(<Sos />);
  await fireEvent.press(screen.getByRole('button', { name: 'Pneu furado' }));
  await fireEvent.changeText(screen.getByLabelText('Quer acrescentar algo? (opcional)'), 'Na BR-163');
  await fireEvent.press(screen.getByRole('button', { name: /WhatsApp para Maria/ }));
  const corpo = corpoWhats();
  expect(corpo).toContain('Quem: Zé da Silva (Zezão)');
  expect(corpo).toContain('O que houve: Pneu furado');
  expect(corpo).toContain('Na BR-163');
  expect(corpo).toMatch(/Enviado às \d\d:\d\d de \d\d\/\d\d/);
});

it('em movimento: sem campo de texto e um toque no tipo já envia', async () => {
  mov.mockReturnValue(true);
  await render(<Sos />);
  expect(screen.queryByLabelText('Quer acrescentar algo? (opcional)')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Estou perdido' }));
  expect(Linking.openURL).toHaveBeenCalledTimes(1);
  expect(corpoWhats()).toContain('O que houve: Estou perdido');
});
