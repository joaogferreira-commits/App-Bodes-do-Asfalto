import { act, fireEvent, render, screen } from '@testing-library/react-native';

import Passeios from '@/app/(abas)/passeios';
import { passeiosExemplo } from '@/dados/passeios';
import { router } from 'expo-router';
import { clienteConsultas } from '@/servidor/consulta';
import * as servico from '@/servidor/passeios';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), navigate: jest.fn(), back: jest.fn() } }));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});
jest.mock('@/servidor/supabase', () => ({ servidorConfigurado: true, supabase: {} }));

let mockPapel = 'membro';
jest.mock('@/acesso/acesso', () => ({
  useAcessoOpcional: () => ({ modo: 'supabase', estado: 'membro', papel: mockPapel }),
}));
jest.mock('@/servidor/passeios', () => ({
  ...jest.requireActual('@/servidor/passeios'),
  listarPasseios: jest.fn(),
  responderPasseio: jest.fn(async () => true),
}));

const real = {
  ...passeiosExemplo[0]!,
  id: 'srv-1',
  titulo: 'Passeio do servidor',
  vou: 3,
  talvez: 1,
  servidor: true,
  minhaPresenca: null,
  quando: 'proximos' as const,
};

beforeEach(() => {
  (servico.listarPasseios as jest.Mock).mockResolvedValue([real]);
  (servico.responderPasseio as jest.Mock).mockClear();
  (router.push as jest.Mock).mockClear();
  clienteConsultas.clear();
});

afterEach(() => clienteConsultas.clear());

it('membro comum vê os passeios do servidor, sem exemplos e sem "Criar passeio"', async () => {
  mockPapel = 'membro';
  await render(<Passeios />);
  expect(await screen.findByText('Passeio do servidor')).toBeTruthy();
  expect(screen.queryByText(passeiosExemplo[1]!.titulo)).toBeNull();
  expect(screen.queryByRole('button', { name: 'Criar passeio' })).toBeNull();
});

it.each(['diretoria_capitulo', 'diretoria_geral', 'admin'])(
  '%s vê "Criar passeio" e abre a tela',
  async (papel) => {
    mockPapel = papel;
    await render(<Passeios />);
    await screen.findByText('Passeio do servidor');
    await fireEvent.press(screen.getByRole('button', { name: 'Criar passeio' }));
    expect(router.push).toHaveBeenCalledWith('/passeio-novo');
  },
);

it('Vou grava a presença no servidor; tocar de novo desmarca; Talvez troca', async () => {
  mockPapel = 'membro';
  await render(<Passeios />);
  await screen.findByText('Passeio do servidor');
  await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Vou' })));
  expect(servico.responderPasseio).toHaveBeenLastCalledWith('srv-1', 'vou');
  await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Vou' })));
  expect(servico.responderPasseio).toHaveBeenLastCalledWith('srv-1', null);
  await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Talvez' })));
  expect(servico.responderPasseio).toHaveBeenLastCalledWith('srv-1', 'talvez');
});

it('servidor vazio mostra o aviso de agenda vazia', async () => {
  (servico.listarPasseios as jest.Mock).mockResolvedValue([]);
  await render(<Passeios />);
  expect(await screen.findByText('Nenhum passeio por aqui ainda.')).toBeTruthy();
});
