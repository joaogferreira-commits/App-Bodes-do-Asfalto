import { fireEvent, render, screen } from '@testing-library/react-native';

import { BotaoSOS } from '@/componentes/BotaoSOS';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

it('botão SOS abre a tela de socorro (sem enviar nada sozinho)', async () => {
  await render(<BotaoSOS />);
  await fireEvent.press(screen.getByRole('button', { name: 'Pedir ajuda (SOS)' }));
  expect(jest.requireMock('expo-router').router.push).toHaveBeenCalledWith('/sos');
});
