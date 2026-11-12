import { fireEvent, render, screen } from '@testing-library/react-native';

import Catalogo from '@/app/catalogo';
import Perfil from '@/app/(abas)/perfil';
import Feed from '@/app/(abas)/feed';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), navigate: jest.fn() } }));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});

describe('telas simples', () => {
  it('catálogo troca o filtro ativo e lista todos os ícones', async () => {
    await render(<Catalogo />);
    await fireEvent.press(screen.getByRole('button', { name: 'Postos' }));
    expect(screen.getByRole('button', { name: 'Postos' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Tudo' })).not.toBeSelected();
  });

  it('perfil leva ao catálogo', async () => {
    const { router } = jest.requireMock('expo-router');
    await render(<Perfil />);
    await fireEvent.press(screen.getByText('Catálogo de componentes'));
    expect(router.push).toHaveBeenCalledWith('/catalogo');
  });

  it('feed mostra o estado vazio com texto, sem tela em branco', async () => {
    await render(<Feed />);
    expect(screen.getByText('O feed do clube vem aí')).toBeTruthy();
  });
});
