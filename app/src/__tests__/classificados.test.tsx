import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import Classificados from '@/app/classificados';
import NovoAnuncio from '@/app/classificados/novo';
import { formatarPreco } from '@/dados/classificados';
import { ProvedorClassificados } from '@/estado/classificados';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({}),
}));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});

describe('classificados', () => {
  it('formata preço em reais', () => {
    expect(formatarPreco(98500)).toBe('R$ 98.500');
  });

  it('filtra por categoria e mostra preço, destaque e vendidos por último', async () => {
    await render(
      <ProvedorClassificados>
        <Classificados />
      </ProvedorClassificados>,
    );
    const anuncios = () =>
      screen.getAllByRole('button').filter((b) => /R\$/.test(String(b.props.accessibilityLabel)));
    expect(anuncios()[0]!.props.accessibilityLabel).toContain('Fat Boy'); // destaque primeiro
    expect(anuncios().at(-1)!.props.accessibilityLabel).toContain('Vendido');
    await fireEvent.press(screen.getByRole('button', { name: 'Roupas' }));
    expect(anuncios()).toHaveLength(1);
  });

  it('anunciar exige foto, título, preço, cidade e WhatsApp', async () => {
    await render(
      <ProvedorClassificados>
        <NovoAnuncio />
      </ProvedorClassificados>,
    );
    await fireEvent.changeText(screen.getByLabelText('Título do anúncio'), 'Capacete');
    await fireEvent.changeText(screen.getByLabelText('Preço'), '400');
    await fireEvent.changeText(screen.getByLabelText('Cidade'), 'Cuiabá');
    await fireEvent.changeText(screen.getByLabelText('WhatsApp para contato'), '65 99999-0000');
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await fireEvent.press(screen.getByRole('button', { name: 'Adicionar foto' }));
    await act(async () => alerta.mock.calls[0]![2]!.find((b) => b.text === 'Da galeria')!.onPress!());
    alerta.mockRestore();
    await screen.findByRole('button', { name: 'Remover esta foto' });
    await fireEvent.press(screen.getByRole('button', { name: 'Publicar anúncio' }));
    expect(jest.requireMock('expo-router').router.back).toHaveBeenCalled();
  });
});

describe('preço como o irmão digita', () => {
  it.each([
    ['98.500', 98500],
    ['98500', 98500],
    ['1.350,00', 1350],
    ['R$ 1.350', 1350],
    ['99,90', 100],
    ['', 0],
  ])('"%s" vira %i', (texto, esperado) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { lerPreco } = require('@/dados/classificados') as typeof import('@/dados/classificados');
    expect(lerPreco(texto)).toBe(esperado);
  });
});
