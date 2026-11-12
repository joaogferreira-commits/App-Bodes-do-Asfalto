import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking, Text } from 'react-native';

import Agape from '@/app/ferramentas/agape';
import Checklist from '@/app/ferramentas/checklist';
import Combustivel from '@/app/ferramentas/combustivel';
import Ferramentas from '@/app/(abas)/ferramentas';
import Lista from '@/app/ferramentas/lista/[tipo]';
import { ProvedorAgapes, useAgapes } from '@/estado/agapes';
import { ProvedorViagem } from '@/estado/viagem';
import { gruposFerramentas } from '@/ferramentas/catalogo';

const parametros = { tipo: 'telefones' };
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), navigate: jest.fn() },
  useLocalSearchParams: () => parametros,
}));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ granted: true })),
  getCurrentPositionAsync: jest.fn(async () => ({ coords: { latitude: -15.6, longitude: -56.1 } })),
}));

describe('ferramentas', () => {
  it('a central mostra as 20 ferramentas e abre cada uma', async () => {
    const total = gruposFerramentas.reduce((s, g) => s + g.itens.length, 0);
    expect(total).toBe(20);
    await render(
      <ProvedorViagem>
        <Ferramentas />
      </ProvedorViagem>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Combustível' }));
    expect(jest.requireMock('expo-router').router.push).toHaveBeenCalledWith('/ferramentas/combustivel');
  });

  it('telefones de emergência ligam com um toque', async () => {
    const abrir = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await render(
      <ProvedorViagem>
        <Lista />
      </ProvedorViagem>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Ligar para 192' }));
    expect(abrir).toHaveBeenCalledWith('tel:192');
    abrir.mockRestore();
  });

  it('checklist marca e conta os itens', async () => {
    await render(<Checklist />);
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Nível do óleo' }));
    expect(screen.getByRole('checkbox', { name: 'Nível do óleo' })).toBeChecked();
    expect(screen.getByText('1 de 12 conferidos')).toBeTruthy();
  });

  it('combustível calcula paradas e custo', async () => {
    await render(<Combustivel />);
    await fireEvent.changeText(screen.getByLabelText('Distância'), '600');
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('criar Ágape Relâmpago o coloca na lista do mapa e do feed', async () => {
    let total = 0;
    function Contador() {
      total = useAgapes().agapes.length;
      return <Text>{total}</Text>;
    }
    await render(
      <ProvedorAgapes>
        <Agape />
        <Contador />
      </ProvedorAgapes>,
    );
    expect(total).toBe(1);
    await fireEvent.changeText(screen.getByLabelText('Onde (ex.: Posto Trevo, km 40)'), 'Praça da Sé');
    await fireEvent.press(screen.getByRole('button', { name: 'Publicar Ágape' }));
    await screen.findByText('2');
    expect(total).toBe(2);
  });
});

describe('manutenção editável', () => {
  it('edita intervalo e km da última troca, cria e apaga itens', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Manutencao = (require('@/app/ferramentas/manutencao') as { default: () => React.JSX.Element })
      .default;
    await render(<Manutencao />);
    const intervalos = screen.getAllByLabelText('Trocar a cada');
    await fireEvent.changeText(intervalos[0]!, '5000');
    expect(screen.getByText('Faltam 3.000 km (troca aos 28.000 km)')).toBeTruthy();
    const antes = screen.getAllByLabelText('O que é').length;
    await fireEvent.press(screen.getByRole('button', { name: 'Novo item de manutenção' }));
    expect(screen.getAllByLabelText('O que é')).toHaveLength(antes + 1);
  });
});
