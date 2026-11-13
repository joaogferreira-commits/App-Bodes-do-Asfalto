import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as dialogo from '@/ui/dialogo';

import Papeis from '@/app/papeis';
import * as servidor from '@/servidor/auth';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('@/servidor/auth', () => ({
  irmaosComPapel: jest.fn(async () => [
    { id: 'eu', nome: 'Dono', apelido: null, capitulo: 'Cuiabá', papel: 'admin' },
    { id: 'z1', nome: 'Zé Ferreira', apelido: 'Zé', capitulo: 'Cuiabá', papel: 'membro' },
  ]),
  definirPapel: jest.fn(async () => undefined),
}));

it('admin nomeia moderador; o próprio admin não aparece para trocar', async () => {
  await render(<Papeis />);
  const ze = await screen.findByRole('button', { name: 'Zé Ferreira, Membro' });
  expect(screen.getByRole('button', { name: 'Dono, Administrador' })).toBeDisabled();
  const alerta = jest.spyOn(dialogo, 'abrirMenu').mockImplementation(() => undefined);
  await fireEvent.press(ze);
  const opcoes = alerta.mock.calls[0]![0].opcoes;
  expect(opcoes.map((o) => o.rotulo)).not.toContain('Administrador');
  await act(async () => opcoes.find((o) => o.rotulo === 'Moderador')!.onPress());
  expect(servidor.definirPapel).toHaveBeenCalledWith('z1', 'moderador');
  alerta.mockRestore();
});
