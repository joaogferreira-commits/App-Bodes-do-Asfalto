import { act, fireEvent, render, screen } from '@testing-library/react-native';

import Story from '@/app/story';
import { foiVisto, gestoDoArrasto, limparVistos, marcarVisto } from '@/stories/vistos';

const mockParams: { de?: string } = {};
const mockMeus = {
  stories: [] as unknown[],
  storiesDeOutros: [] as unknown[],
  servidor: false,
  apagarStory: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});
jest.mock('@/estado/meusPosts', () => ({ useMeusPosts: () => mockMeus }));

const conteudo = (uri: string) => ({
  uri,
  tipo: 'foto' as const,
  filtro: 'nenhum',
  textos: [],
  selos: {},
});
const srv = (id: string, autorId: string, autor: string, min: number) => ({
  id,
  autorId,
  autor,
  criadoEm: new Date(Date.UTC(2026, 10, 13, 12, min)).toISOString(),
  expiraEm: '2026-11-14T12:00:00Z',
  meu: false,
  conteudo: conteudo(`file://${id}.jpg`),
});

const back = () => jest.requireMock('expo-router').router.back as jest.Mock;
const tocar = (pageX: number) =>
  fireEvent.press(screen.getByRole('button', { name: /Toque na direita/ }), { nativeEvent: { pageX } });

describe('visualizador de stories', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    limparVistos();
    back().mockClear();
    mockMeus.stories = [];
    mockMeus.servidor = true;
    mockMeus.storiesDeOutros = [
      srv('a1', 'A', 'Edu Prado', 1),
      srv('b1', 'B', 'Zé Ferreira', 2),
      srv('a2', 'A', 'Edu Prado', 3),
      srv('c1', 'C', 'Ivan Coruja', 4),
    ];
    mockParams.de = 'srv:a1';
  });
  afterEach(() => jest.useRealTimers());

  it('toca todos os stories do irmão e segue sozinho para o próximo, e fecha no fim', async () => {
    await render(<Story />);
    expect(screen.getByText('Edu Prado')).toBeTruthy();
    await act(() => jest.advanceTimersByTime(5100)); // a1 -> a2 (mesmo irmão)
    expect(screen.getByText('Edu Prado')).toBeTruthy();
    expect(foiVisto('a2')).toBe(true);
    await act(() => jest.advanceTimersByTime(5100)); // -> Zé
    expect(screen.getByText('Zé Ferreira')).toBeTruthy();
    await act(() => jest.advanceTimersByTime(5100)); // -> Ivan
    expect(screen.getByText('Ivan Coruja')).toBeTruthy();
    expect(back()).not.toHaveBeenCalled();
    await act(() => jest.advanceTimersByTime(5100));
    expect(back()).toHaveBeenCalledTimes(1);
  });

  it('pula irmãos cujos stories já foram vistos', async () => {
    marcarVisto('c1');
    await render(<Story />);
    await act(() => jest.advanceTimersByTime(5100)); // a1 -> a2
    await act(() => jest.advanceTimersByTime(5100)); // -> Zé
    expect(screen.getByText('Zé Ferreira')).toBeTruthy();
    await act(() => jest.advanceTimersByTime(5100)); // Ivan já visto: fecha
    expect(back()).toHaveBeenCalledTimes(1);
  });

  it('toque à direita avança, à esquerda volta; barras de tempo uma por story', async () => {
    await render(<Story />);
    await tocar(600); // a2
    expect(foiVisto('a2')).toBe(true);
    await tocar(600); // Zé
    expect(screen.getByText('Zé Ferreira')).toBeTruthy();
    await tocar(10); // volta para o Edu
    expect(screen.getByText('Edu Prado')).toBeTruthy();
    await tocar(600); // a2
    await tocar(600); // Zé já visto: pula para o Ivan
    expect(screen.getByText('Ivan Coruja')).toBeTruthy();
    await tocar(600); // fim
    expect(back()).toHaveBeenCalledTimes(1);
  });

  it('no modo local percorre os irmãos de exemplo com story novo', async () => {
    mockMeus.servidor = false;
    mockMeus.storiesDeOutros = [];
    mockParams.de = '0';
    await render(<Story />);
    expect(screen.getByText('Edu Prado')).toBeTruthy();
    await act(() => jest.advanceTimersByTime(5100));
    expect(screen.getByText('Zé Ferreira')).toBeTruthy();
    await act(() => jest.advanceTimersByTime(5100));
    expect(screen.getByText('Ivan Coruja')).toBeTruthy();
    await act(() => jest.advanceTimersByTime(5100)); // os outros dois já estão vistos
    expect(back()).toHaveBeenCalledTimes(1);
  });

  it('segurar pausa a barra de tempo', async () => {
    await render(<Story />);
    const cena = screen.getByRole('button', { name: /Toque na direita/ });
    await fireEvent(cena, 'longPress');
    await act(() => jest.advanceTimersByTime(20000));
    expect(screen.getByText('Edu Prado')).toBeTruthy();
    expect(foiVisto('a2')).toBe(false);
    await fireEvent(cena, 'pressOut');
    await act(() => jest.advanceTimersByTime(5100));
    expect(foiVisto('a2')).toBe(true);
  });

  it('interpreta o arrastar: lado troca de irmão, baixo fecha', () => {
    expect(gestoDoArrasto(-120, 5)).toBe('proximo-irmao');
    expect(gestoDoArrasto(120, 5)).toBe('irmao-anterior');
    expect(gestoDoArrasto(5, 150)).toBe('fechar');
    expect(gestoDoArrasto(5, -150)).toBeNull();
    expect(gestoDoArrasto(10, 10)).toBeNull();
  });

  it('o botão Fechar fecha', async () => {
    await render(<Story />);
    await fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));
    expect(back()).toHaveBeenCalled();
  });
});
