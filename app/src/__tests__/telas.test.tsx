import { fireEvent, render, screen } from '@testing-library/react-native';

import Catalogo from '@/app/catalogo';
import MenuDeTestes from '@/app/index';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));

describe('telas da Etapa 0', () => {
  it('menu de testes mostra o catálogo e os itens em breve', async () => {
    await render(<MenuDeTestes />);
    expect(screen.getByText('Catálogo de componentes')).toBeTruthy();
    expect(screen.queryByText('Em breve')).toBeNull();
    expect(screen.getByText('Prova de navegação')).toBeTruthy();
  });

  it('catálogo troca o filtro ativo', async () => {
    await render(<Catalogo />);
    await fireEvent.press(screen.getByRole('button', { name: 'Postos' }));
    expect(screen.getByRole('button', { name: 'Postos' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Tudo' })).not.toBeSelected();
  });
});
