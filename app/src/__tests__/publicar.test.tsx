import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import Comentarios from '@/app/comentarios/[id]';
import Publicar from '@/app/publicar';
import { ProvedorMeusPosts, useMeusPosts } from '@/estado/meusPosts';
import { prepararFoto } from '@/feed/foto';

const parametros: Record<string, string> = { id: 'v1' };
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => parametros,
}));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});

function Espiao() {
  const { posts } = useMeusPosts();
  return <Text testID="posts">{JSON.stringify(posts)}</Text>;
}

describe('publicar e comentar', () => {
  it('foto é regravada (sem EXIF/GPS) antes de publicar', async () => {
    await expect(prepararFoto('file:///foto-original.jpg')).resolves.toBe('file:///foto-sem-exif.jpg');
  });

  it('publica texto + foto da galeria com a visibilidade escolhida', async () => {
    parametros.id = '';
    await render(
      <ProvedorMeusPosts>
        <Publicar />
        <Espiao />
      </ProvedorMeusPosts>,
    );
    await fireEvent.changeText(screen.getByLabelText('O que você quer contar, irmão?'), 'Rodei 300 km hoje');
    await fireEvent.press(screen.getByRole('button', { name: 'Da galeria' }));
    await screen.findByLabelText('Remover a foto');
    await fireEvent.press(screen.getByRole('button', { name: 'Só meu capítulo' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Publicar' }));
    const posts = JSON.parse(screen.getByTestId('posts').props.children);
    expect(posts[0]).toMatchObject({
      texto: 'Rodei 300 km hoje',
      foto: 'file:///foto-sem-exif.jpg',
      visibilidade: 'capitulo',
    });
  });

  it('comenta num post e o comentário aparece', async () => {
    parametros.id = 'v1';
    await render(
      <ProvedorMeusPosts>
        <Comentarios />
      </ProvedorMeusPosts>,
    );
    await fireEvent.changeText(screen.getByLabelText('Escreva um comentário'), 'Que viagem!');
    await fireEvent.press(screen.getByRole('button', { name: 'Comentar' }));
    expect(screen.getByText('Que viagem!')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Apagar' })).toBeTruthy();
  });
});
