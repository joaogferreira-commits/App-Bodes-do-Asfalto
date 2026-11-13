import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import Sos from '@/app/sos';
import { useSosAtivoOpcional } from '@/estado/sosAtivo';
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
jest.mock('@/servidor/supabase', () => ({ servidorConfigurado: true, supabase: {} }));
jest.mock('@/estado/sosAtivo', () => ({ useSosAtivoOpcional: jest.fn() }));
jest.mock('@/estado/perfil', () => ({
  usePerfilOpcional: () => ({
    perfil: { nome: 'Zé da Silva', apelido: 'Zezão' },
    contatos: [{ id: '1', nome: 'Maria', telefone: '65 99999-0000' }],
  }),
}));

const ctx = useSosAtivoOpcional as jest.Mock;
const mov = useBloqueioEmMovimento as jest.Mock;
const iniciar = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mov.mockReturnValue(false);
  iniciar.mockResolvedValue(true);
  ctx.mockReturnValue({ ativo: null, iniciando: false, iniciar, encerrar: jest.fn() });
  jest.spyOn(Linking, 'openURL').mockResolvedValue();
});

it('botão principal avisa o grupo pelo app com tipo e texto', async () => {
  await render(<Sos />);
  await fireEvent.press(screen.getByRole('button', { name: 'Pneu furado' }));
  await fireEvent.changeText(screen.getByLabelText('Quer acrescentar algo? (opcional)'), 'Na BR-163');
  await fireEvent.press(screen.getByRole('button', { name: 'Avisar o grupo e a diretoria pelo app' }));
  expect(iniciar).toHaveBeenCalledWith({ tipo: 'pneu', mensagem: 'Na BR-163', posicao: null });
});

it('mostra aviso se o servidor falhar, e o WhatsApp continua disponível', async () => {
  iniciar.mockResolvedValue(false);
  await render(<Sos />);
  await fireEvent.press(screen.getByRole('button', { name: 'Avisar o grupo e a diretoria pelo app' }));
  expect(await screen.findByText(/Não consegui avisar pelo app/)).toBeTruthy();
  expect(screen.getByRole('button', { name: /WhatsApp para Maria/ })).toBeTruthy();
});

it('com SOS ativo confirma o envio e desabilita o botão', async () => {
  ctx.mockReturnValue({
    ativo: { id: 'x', tipo: null, em: 1 },
    iniciando: false,
    iniciar,
    encerrar: jest.fn(),
  });
  await render(<Sos />);
  expect(screen.getByText(/Aviso enviado/)).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Avisar o grupo e a diretoria pelo app' }).props.accessibilityState,
  ).toMatchObject({ disabled: true });
});

it('em movimento, um toque no tipo avisa pelo app e abre o WhatsApp', async () => {
  mov.mockReturnValue(true);
  await render(<Sos />);
  await fireEvent.press(screen.getByRole('button', { name: 'Estou perdido' }));
  expect(iniciar).toHaveBeenCalledWith({ tipo: 'perdido', mensagem: '', posicao: null });
  expect(Linking.openURL).toHaveBeenCalledTimes(1);
});
