import { fireEvent, render, screen } from '@testing-library/react-native';

import Busca from '@/app/busca';
import { ProvedorViagem } from '@/estado/viagem';

jest.mock('expo-router', () => ({ router: { replace: jest.fn(), back: jest.fn() } }));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({ granted: false })),
}));

describe('busca do mapa', () => {
  it('acha um lugar do clube e abre o planejamento da rota até ele', async () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ features: [] }) })) as never;
    await render(
      <ProvedorViagem>
        <Busca />
      </ProvedorViagem>,
    );
    await fireEvent.changeText(screen.getByLabelText('Para onde vamos?'), 'trevo');
    await fireEvent.press(screen.getByRole('button', { name: 'Posto Trevo, R$ 6,29' }));
    expect(jest.requireMock('expo-router').router.replace).toHaveBeenCalledWith('/rota');
  });
});
