import { act, fireEvent, render, screen } from '@testing-library/react-native';

import NovoPasseio from '@/app/passeio-novo';
import * as dialogo from '@/ui/dialogo';
import * as servico from '@/servidor/passeios';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
let mockPapel = 'membro';
jest.mock('@/acesso/acesso', () => ({ useAcessoOpcional: () => ({ papel: mockPapel }) }));
jest.mock('@/servidor/passeios', () => ({
  ...jest.requireActual('@/servidor/passeios'),
  criarPasseio: jest.fn(async () => true),
}));

it('membro comum não vê o formulário', async () => {
  mockPapel = 'membro';
  await render(<NovoPasseio />);
  expect(screen.getByText('Só a diretoria do capítulo pode criar passeios.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Publicar passeio' })).toBeNull();
});

it('diretoria preenche e publica; data inválida é recusada', async () => {
  mockPapel = 'diretoria_capitulo';
  const aviso = jest.spyOn(dialogo, 'avisar').mockImplementation(() => undefined);
  await render(<NovoPasseio />);
  await fireEvent.changeText(screen.getByLabelText('Nome do passeio'), 'Chapada');
  await fireEvent.changeText(screen.getByLabelText('Dia (dd/mm/aaaa)'), '31/02/2099');
  await fireEvent.changeText(screen.getByLabelText('Hora (ex.: 6:30)'), '6:30');
  await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Publicar passeio' })));
  expect(servico.criarPasseio).not.toHaveBeenCalled();
  expect(aviso).toHaveBeenCalled();

  await fireEvent.changeText(screen.getByLabelText('Dia (dd/mm/aaaa)'), '22/11/2099');
  await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Publicar passeio' })));
  expect(servico.criarPasseio).toHaveBeenCalledWith(
    expect.objectContaining({ titulo: 'Chapada', data: new Date(2099, 10, 22, 6, 30) }),
  );
  aviso.mockRestore();
});
