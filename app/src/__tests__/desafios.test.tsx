import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import Desafios from '@/app/desafios';
import NovoDesafio from '@/app/desafios/novo';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));

describe('telas de desafios', () => {
  it('mostra desafios ativos com XP, a tabela por km e o placar por média', async () => {
    await render(<Desafios />);
    expect(screen.getByText('1.000 km em novembro')).toBeTruthy();
    expect(screen.getByText('Tabela de XP dos desafios de irmãos')).toBeTruthy();
    expect(screen.getByText('Até 100 km')).toBeTruthy();
    expect(screen.getByText(/Rondonópolis: \d+ km por irmão/)).toBeTruthy();
    await fireEvent.press(screen.getAllByRole('button', { name: 'Participar' })[0]!);
    expect(screen.getAllByRole('button', { name: 'Participando' }).length).toBe(1);
  });

  it('criar desafio mostra o XP da tabela e vai para aprovação', async () => {
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await render(<NovoDesafio />);
    await fireEvent.changeText(screen.getByLabelText('Nome do desafio'), 'Rodar 500 km');
    await fireEvent.changeText(screen.getByLabelText('Meta em km'), '500');
    expect(screen.getByText('+250 XP')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar para aprovação' }));
    expect(alerta).toHaveBeenCalledWith('Desafio enviado!', expect.any(String));
    alerta.mockRestore();
  });
});
