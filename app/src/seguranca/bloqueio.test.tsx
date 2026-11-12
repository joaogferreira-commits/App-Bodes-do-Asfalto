import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';

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
  it('oferece só o modo pilotando e o mapa', async () => {
    const aoIrAoMapa = jest.fn();
    await render(<TelaEmMovimento aoIrAoMapa={aoIrAoMapa} />);
    expect(screen.getByText('Moto em movimento')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar ao mapa' }));
    expect(aoIrAoMapa).toHaveBeenCalled();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });
});
