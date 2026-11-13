import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';

import { LIBERACAO_MAX_MS, LIBERACAO_PARADO_MS, reiniciarLiberacaoGarupa } from './liberacaoGarupa';
import { TelaEmMovimento } from './TelaEmMovimento';
import { useBloqueioEmMovimento } from './useBloqueioEmMovimento';

const ouvintes: ((p: { coords: { speed: number } }) => void)[] = [];
const permissao = { granted: true };

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({ granted: permissao.granted })),
  watchPositionAsync: jest.fn(async (_o: unknown, cb: (p: { coords: { speed: number } }) => void) => {
    ouvintes.push(cb);
    return { remove: jest.fn() };
  }),
  Accuracy: { Balanced: 3 },
}));

describe('useBloqueioEmMovimento', () => {
  beforeEach(() => {
    ouvintes.length = 0;
    permissao.granted = true;
  });

  it('trava quando o GPS informa ≥ 8 km/h', async () => {
    const { result } = await renderHook(() => useBloqueioEmMovimento());
    await act(async () => {});
    expect(result.current).toBe(false);
    await act(async () => ouvintes[0]!({ coords: { speed: 10 } })); // 36 km/h
    expect(result.current).toBe(true);
  });

  it('sem permissão de localização nunca observa o GPS nem trava', async () => {
    permissao.granted = false;
    const { result } = await renderHook(() => useBloqueioEmMovimento());
    await act(async () => {});
    expect(ouvintes).toHaveLength(0);
    expect(result.current).toBe(false);
  });
});

describe('TelaEmMovimento', () => {
  it('oferece modo pilotando, mapa e liberação de garupa', async () => {
    const aoIrAoMapa = jest.fn();
    await render(<TelaEmMovimento aoIrAoMapa={aoIrAoMapa} />);
    expect(screen.getByText('Moto em movimento')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar ao mapa' }));
    expect(aoIrAoMapa).toHaveBeenCalled();
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByText(/garupa ou está de carona/)).toBeTruthy();
  });
});

describe('liberação Sou garupa / passageiro', () => {
  let agora = 1_000_000;
  beforeEach(() => {
    ouvintes.length = 0;
    permissao.granted = true;
    reiniciarLiberacaoGarupa();
    agora = 1_000_000;
    jest.useFakeTimers();
    jest.spyOn(Date, 'now').mockImplementation(() => agora);
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  const andar = async (ms: number, speed: number) => {
    agora += ms;
    await act(async () => {
      ouvintes[0]!({ coords: { speed } });
    });
  };

  async function montar() {
    const hook = await renderHook(() => useBloqueioEmMovimento());
    await act(async () => {});
    await andar(0, 10);
    expect(hook.result.current).toBe(true);
    await render(<TelaEmMovimento aoIrAoMapa={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Sou garupa / passageiro' }));
    return hook;
  }

  it('destrava enquanto em movimento', async () => {
    const { result } = await montar();
    expect(result.current).toBe(false);
    await andar(60_000, 20);
    expect(result.current).toBe(false);
  });

  it('trava de novo após 5 min parado', async () => {
    const { result } = await montar();
    await andar(1000, 0);
    await andar(LIBERACAO_PARADO_MS - 1000, 0);
    expect(result.current).toBe(false);
    await andar(2000, 0); // passou 5 min parado
    await andar(1000, 10);
    expect(result.current).toBe(true);
  });

  it('trava de novo após 3 h', async () => {
    const { result } = await montar();
    await andar(LIBERACAO_MAX_MS - 1000, 20);
    expect(result.current).toBe(false);
    await andar(2000, 20);
    expect(result.current).toBe(true);
  });
});
