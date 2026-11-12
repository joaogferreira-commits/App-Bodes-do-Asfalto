import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import Feed from '@/app/(abas)/feed';
import Publicar from '@/app/publicar';
import { ProvedorMeusPosts } from '@/estado/meusPosts';
import * as feed from '@/servidor/feed';
import type { PostServidor } from '@/servidor/feed';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), navigate: jest.fn() },
  useLocalSearchParams: () => ({}),
}));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});
jest.mock('@/servidor/supabase', () => ({ servidorConfigurado: true, supabase: {} }));
jest.mock('@/acesso/acesso', () => ({
  useAcessoOpcional: () => ({ modo: 'supabase', estado: 'membro' }),
}));
jest.mock('@/servidor/feed', () => ({
  TAMANHO_PAGINA: 20,
  listarPosts: jest.fn(async () => []),
  listarStories: jest.fn(async () => []),
  publicarPost: jest.fn(async () => 'novo'),
  apagarPost: jest.fn(async () => undefined),
  alternarTfa: jest.fn(async () => true),
  alternarSalvo: jest.fn(async () => true),
  denunciar: jest.fn(async () => undefined),
  bloquear: jest.fn(async () => undefined),
}));

const doIrmao: PostServidor = {
  id: 'p1',
  autorId: 'u2',
  autorNome: 'Zé Ferreira',
  autorApelido: null,
  capitulo: 'Cuiabá',
  texto: 'Estrada boa hoje',
  visibilidade: 'todos',
  fotos: [],
  enquete: null,
  criadoEm: new Date().toISOString(),
  tfa: 0,
  comentarios: 2,
  euDeiTfa: false,
  salvo: false,
  meu: false,
};

const listarPosts = feed.listarPosts as jest.Mock;
const botaoDoAlerta = (espiao: jest.SpyInstance, texto: string) => {
  const botoes = espiao.mock.lastCall![2] as { text: string; onPress?: () => void }[];
  return botoes.find((b) => b.text === texto)!;
};

describe('feed real (servidor)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('feed vazio não mostra exemplos nem o aviso, e oferece publicar o primeiro post', async () => {
    listarPosts.mockResolvedValueOnce([]);
    await render(
      <ProvedorMeusPosts>
        <Feed />
      </ProvedorMeusPosts>,
    );
    await screen.findByText('Ainda não tem nada por aqui');
    expect(screen.queryByText('Posts de exemplo até a etapa social.')).toBeNull();
    expect(screen.queryByText('Ganhou o selo Irmão na Rota')).toBeNull();
    expect(screen.queryByRole('button', { name: /Story de/ })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Publicar o primeiro post' }));
    expect(jest.requireMock('expo-router').router.push).toHaveBeenCalledWith('/publicar');
  });

  it('dar TFA chama o servidor e atualiza a contagem', async () => {
    listarPosts.mockResolvedValueOnce([doIrmao]);
    await render(
      <ProvedorMeusPosts>
        <Feed />
      </ProvedorMeusPosts>,
    );
    await screen.findByText('Estrada boa hoje');
    await fireEvent.press(screen.getByRole('button', { name: 'Dar um TFA, 0 até agora' }));
    expect(feed.alternarTfa).toHaveBeenCalledWith('p1', false);
    expect(await screen.findByRole('button', { name: 'Dar um TFA, 1 até agora' })).toBeSelected();
  });

  it('denunciar um post pede confirmação e envia a denúncia', async () => {
    listarPosts.mockResolvedValueOnce([doIrmao]);
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await render(
      <ProvedorMeusPosts>
        <Feed />
      </ProvedorMeusPosts>,
    );
    await screen.findByText('Estrada boa hoje');
    await fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));
    await act(async () => botaoDoAlerta(alerta, 'Denunciar post').onPress!());
    expect(feed.denunciar).not.toHaveBeenCalled(); // ainda só perguntou
    await act(async () => botaoDoAlerta(alerta, 'Denunciar').onPress!());
    expect(feed.denunciar).toHaveBeenCalledWith('post', 'p1', expect.any(String));
    alerta.mockRestore();
  });

  it('bloquear um irmão confirma e o post some', async () => {
    listarPosts.mockResolvedValueOnce([doIrmao]);
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await render(
      <ProvedorMeusPosts>
        <Feed />
      </ProvedorMeusPosts>,
    );
    await screen.findByText('Estrada boa hoje');
    await fireEvent.press(screen.getByRole('button', { name: 'Mais opções' }));
    await act(async () => botaoDoAlerta(alerta, 'Bloquear Zé Ferreira').onPress!());
    await act(async () => botaoDoAlerta(alerta, 'Bloquear').onPress!());
    expect(feed.bloquear).toHaveBeenCalledWith('u2');
    expect(screen.queryByText('Estrada boa hoje')).toBeNull();
    alerta.mockRestore();
  });

  it('publicar envia texto, visibilidade e enquete ao servidor', async () => {
    await render(
      <ProvedorMeusPosts>
        <Publicar />
      </ProvedorMeusPosts>,
    );
    await fireEvent.changeText(screen.getByLabelText('O que você quer contar, irmão?'), 'Chegamos em Cuiabá');
    await fireEvent.press(screen.getByRole('button', { name: 'Só meu capítulo' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Publicar' }));
    expect(feed.publicarPost).toHaveBeenCalledWith({
      texto: 'Chegamos em Cuiabá',
      visibilidade: 'capitulo',
      fotos: [],
      enquete: undefined,
    });
    expect(jest.requireMock('expo-router').router.back).toHaveBeenCalled();
  });
});
