import { fireEvent, render, screen } from '@testing-library/react-native';
import * as dialogo from '@/ui/dialogo';

import Aprovacoes from '@/app/aprovacoes';
import * as servidor from '@/servidor/auth';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});
jest.mock('@/servidor/auth', () => ({
  pedidosParaAprovar: jest.fn(async () => [
    {
      id: 'p1',
      nome: 'Tião Garupa',
      apelido: 'Garupa',
      cidade: 'Cuiabá',
      telefone: '65 99999-0000',
      capitulo: 'Cuiabá',
      indicadoPorNome: 'Zé Ferreira',
      criadoEm: '2026-11-12',
      fotoColete: 'https://x/colete',
      fotoCarteirinha: 'https://x/carteirinha',
    },
  ]),
  decidirPedido: jest.fn(async () => undefined),
}));

describe('aprovar irmãos', () => {
  it('mostra o pedido com fotos e quem indicou; recusar exige motivo; aprovar chama o banco', async () => {
    await render(<Aprovacoes />);
    expect(await screen.findByText('Tião Garupa “Garupa”')).toBeTruthy();
    expect(screen.getByText('Indicado por: Zé Ferreira')).toBeTruthy();
    expect(screen.getByLabelText('Foto com o colete')).toBeTruthy();

    const alerta = jest.spyOn(dialogo, 'avisar').mockImplementation(() => undefined);
    await fireEvent.press(screen.getByRole('button', { name: 'Recusar' }));
    expect(alerta).toHaveBeenCalledWith('Escreva o motivo da recusa. Ele chega ao irmão.');
    expect(servidor.decidirPedido).not.toHaveBeenCalled();
    alerta.mockRestore();

    await fireEvent.press(screen.getByRole('button', { name: 'Aprovar' }));
    expect(servidor.decidirPedido).toHaveBeenCalledWith('p1', true, undefined);
  });
});
