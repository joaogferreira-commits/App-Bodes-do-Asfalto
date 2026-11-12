import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

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
  const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  await fireEvent.press(ze);
  const opcoes = alerta.mock.calls[0]![2]!;
  expect(opcoes.map((o) => o.text)).not.toContain('Administrador');
  await act(async () => opcoes.find((o) => o.text === 'Moderador')!.onPress!());
  expect(servidor.definirPapel).toHaveBeenCalledWith('z1', 'moderador');
  alerta.mockRestore();
});
