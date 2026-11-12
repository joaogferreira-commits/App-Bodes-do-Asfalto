import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import Comentarios from '@/app/comentarios/[id]';
import Publicar from '@/app/publicar';
import NovoStory from '@/app/story-novo';
import { DURACAO_STORY_MS, ProvedorMeusPosts, storiesAtivos, useMeusPosts } from '@/estado/meusPosts';
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

  it('cria enquete com pergunta e opções', async () => {
    parametros.id = '';
    parametros.enquete = '1';
    await render(
      <ProvedorMeusPosts>
        <Publicar />
        <Espiao />
      </ProvedorMeusPosts>,
    );
    await fireEvent.changeText(screen.getByLabelText('Pergunta'), 'Próximo destino?');
    await fireEvent.changeText(screen.getByLabelText('Opção 1'), 'Chapada');
    await fireEvent.changeText(screen.getByLabelText('Opção 2'), 'Pantanal');
    await fireEvent.press(screen.getByRole('button', { name: 'Publicar' }));
    expect(JSON.parse(screen.getByTestId('posts').props.children)[0]).toMatchObject({
      texto: 'Próximo destino?',
      enquete: ['Chapada', 'Pantanal'],
    });
    delete parametros.enquete;
  });

  it('story some depois de 24 horas', () => {
    const agora = 1_000_000_000_000;
    const l = [
      { id: 'novo', foto: 'a', legenda: '', criadoEm: agora - 1000 },
      { id: 'velho', foto: 'b', legenda: '', criadoEm: agora - DURACAO_STORY_MS - 1 },
    ];
    expect(storiesAtivos(l, agora).map((x) => x.id)).toEqual(['novo']);
  });

  it('story: toque tira foto, aplica filtro, texto com estilo e selo, e publica', async () => {
    function Conta() {
      const { stories } = useMeusPosts();
      return <Text testID="stories">{JSON.stringify(stories[0]?.conteudo ?? null)}</Text>;
    }
    await render(
      <ProvedorMeusPosts>
        <NovoStory />
        <Conta />
      </ProvedorMeusPosts>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Tirar foto ou gravar' }));
    await screen.findByRole('button', { name: 'Publicar story' });
    await fireEvent.press(screen.getByRole('button', { name: 'Noite' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Texto' }));
    await fireEvent.changeText(screen.getByLabelText('Escreva o texto'), 'Estrada boa');
    await fireEvent.press(screen.getByRole('button', { name: 'Condensado' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Pôr' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Selos' }));
    await fireEvent.changeText(screen.getByLabelText('Km do dia'), '320');
    await fireEvent.press(screen.getByRole('button', { name: 'Publicar story' }));
    const c = JSON.parse(String(screen.getByTestId('stories').props.children));
    expect(c).toMatchObject({ tipo: 'foto', filtro: 'noite', selos: { km: 320 } });
    expect(c.textos[0]).toMatchObject({ texto: 'Estrada boa', estilo: 'condensado' });
  });

  it('story: segurar grava vídeo', async () => {
    function Conta() {
      return <Text testID="tipo">{useMeusPosts().stories[0]?.conteudo?.tipo ?? '-'}</Text>;
    }
    await render(
      <ProvedorMeusPosts>
        <NovoStory />
        <Conta />
      </ProvedorMeusPosts>,
    );
    await fireEvent(screen.getByRole('button', { name: 'Tirar foto ou gravar' }), 'longPress');
    await screen.findByRole('button', { name: 'Publicar story' });
    await fireEvent.press(screen.getByRole('button', { name: 'Publicar story' }));
    expect(screen.getByTestId('tipo').props.children).toBe('video');
  });
});
