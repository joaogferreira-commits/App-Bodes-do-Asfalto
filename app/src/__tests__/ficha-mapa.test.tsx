import { fireEvent, render, screen } from '@testing-library/react-native';

import { FichaMapa } from '@/componentes/FichaMapa';
import { lugaresExemplo } from '@/dados/exemplos';
import { fichaDoLugar } from '@/map/fichas';

jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});

describe('ficha do mapa', () => {
  it('posto: informar preço valida e devolve o valor', async () => {
    const aoAgir = jest.fn();
    const posto = lugaresExemplo.find((l) => l.tipo === 'posto')!;
    await render(<FichaMapa ficha={fichaDoLugar(posto)} aoFechar={jest.fn()} aoAgir={aoAgir} />);
    expect(screen.getByText('Posto de combustível')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Informar preço' }));
    const campo = screen.getByLabelText('Quanto está a gasolina comum? (R$ por litro)');
    await fireEvent.changeText(campo, '99');
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar preço' }));
    expect(screen.getByText('Confira o valor: use algo como 6,29.')).toBeTruthy();
    await fireEvent.changeText(campo, '6,19');
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar preço' }));
    expect(aoAgir).toHaveBeenCalledWith('informarPreco', '6,19');
  });

  it('Loja: rota e contato; ação feita aparece marcada', async () => {
    const aoAgir = jest.fn();
    const loja = lugaresExemplo.find((l) => l.tipo === 'loja')!;
    await render(
      <FichaMapa ficha={fichaDoLugar(loja)} feitas={['rota']} aoFechar={jest.fn()} aoAgir={aoAgir} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Falar com o contato' }));
    expect(aoAgir).toHaveBeenCalledWith('falarContato');
    expect(screen.getByText(/procedimento da Loja/)).toBeTruthy();
  });
});
