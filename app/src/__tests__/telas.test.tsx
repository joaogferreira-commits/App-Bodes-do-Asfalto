import { fireEvent, render, screen } from '@testing-library/react-native';

import Catalogo from '@/app/catalogo';
import Perfil from '@/app/(abas)/perfil';
import Conquistas from '@/app/(abas)/conquistas';
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

  it('perfil mostra moto, capítulo, Loja opcional e leva a criar o avatar', async () => {
    const { router } = jest.requireMock('expo-router');
    await render(<Perfil />);
    expect(screen.getByText('Harley-Davidson Fat Boy 114')).toBeTruthy();
    expect(screen.getByText('Bodes do Asfalto · Cuiabá')).toBeTruthy();
    expect(screen.getByText('Minha Loja (opcional)')).toBeTruthy();
    expect(screen.queryByText('Catálogo de componentes')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Criar avatar' }));
    expect(router.push).toHaveBeenCalledWith('/avatar');
  });

  it('feed parece um feed: stories, compositor, viagem com números, passeio com Vou/Talvez e TFA', async () => {
    await render(<Feed />);
    expect(screen.getByRole('button', { name: 'Seu story' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enquete' })).toBeTruthy();
    expect(screen.getByText('Ganhou o selo Irmão na Rota')).toBeTruthy();
    const tfa = screen.getByRole('button', { name: 'Dar um TFA, 23 até agora' });
    await fireEvent.press(tfa);
    expect(screen.getByRole('button', { name: 'Dar um TFA, 24 até agora' })).toBeSelected();
    await fireEvent.press(screen.getAllByRole('button', { name: 'Vou' })[0]!);
    expect(screen.getByText('5 irmãos vão')).toBeTruthy();
    // todo post tem como denunciar/bloquear (exigência das lojas)
    expect(screen.getAllByRole('button', { name: 'Mais opções' }).length).toBeGreaterThanOrEqual(5);
  });

  it('conquistas mostra o nível, os selos ganhos e os que faltam, com como ganhar', async () => {
    await render(<Conquistas />);
    expect(screen.getByText('3.420 XP')).toBeTruthy();
    expect(screen.getByText('Faltam 1.580 XP para Bode Velho')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ágape, Conquistado' })).toBeTruthy();
    const sedes = screen.getByRole('button', { name: 'Sedes do MT, 2 de 5' });
    await fireEvent.press(sedes);
    expect(screen.getByText('Faça check-in em 5 sedes do clube em Mato Grosso.')).toBeTruthy();
    expect(screen.getByText('Vale +500 XP')).toBeTruthy();
  });
});
