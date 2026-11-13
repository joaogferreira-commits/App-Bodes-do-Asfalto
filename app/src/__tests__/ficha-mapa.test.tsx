import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { FichaMapa } from '@/componentes/FichaMapa';
import { lugaresExemplo } from '@/dados/exemplos';
import { fichaDoLugar } from '@/map/fichas';
import { informarPreco, ultimosPrecos } from '@/servidor/precos';
import { avisar } from '@/ui/dialogo';

jest.mock('@/servidor/precos', () => ({
  ...jest.requireActual('@/servidor/precos'),
  informarPreco: jest.fn(),
  ultimosPrecos: jest.fn(),
}));
jest.mock('@/ui/dialogo', () => ({ ...jest.requireActual('@/ui/dialogo'), avisar: jest.fn() }));

const mockInformar = informarPreco as jest.Mock;
const mockUltimos = ultimosPrecos as jest.Mock;

const postoDoBanco = {
  id: 'anp/12345678000190',
  tipo: 'posto' as const,
  nome: 'Posto Rota',
  lat: -15.6,
  lng: -56.1,
  fonte: 'anp' as const,
  precosAnp: [{ produto: 'gasolina_comum' as const, valor: 6.39, data: '2026-11-10' }],
};

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
    const campo = screen.getByLabelText('Qual combustível e quanto está o litro? (R$)');
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

  describe('posto do banco (modo servidor)', () => {
    beforeEach(() => {
      mockInformar.mockReset();
      mockUltimos.mockReset();
      (avisar as jest.Mock).mockClear();
      mockUltimos.mockResolvedValue([]);
    });

    it('mostra o preço da ANP e o do irmão, cada um com fonte e data', async () => {
      mockUltimos.mockResolvedValue([
        { postoId: postoDoBanco.id, produto: 'gasolina_comum', valor: 6.29, criadoEm: '2026-11-12T15:00:00' },
      ]);
      await render(<FichaMapa ficha={fichaDoLugar(postoDoBanco)} aoFechar={jest.fn()} aoAgir={jest.fn()} />);
      expect(mockUltimos).toHaveBeenCalledWith([postoDoBanco.id]);
      expect(await screen.findByText('Gasolina R$ 6,29 · informado por um irmão em 12/11')).toBeTruthy();
      expect(screen.getByText('Gasolina comum R$ 6,39 · coleta 10/11')).toBeTruthy();
      expect(screen.getByText(/Fonte: ANP, coleta 10\/11/)).toBeTruthy();
    });

    it('envia ao servidor com o produto escolhido e agradece', async () => {
      mockInformar.mockResolvedValue(true);
      const aoAgir = jest.fn();
      await render(<FichaMapa ficha={fichaDoLugar(postoDoBanco)} aoFechar={jest.fn()} aoAgir={aoAgir} />);
      await fireEvent.press(screen.getByRole('button', { name: 'Informar preço' }));
      await fireEvent.press(screen.getByRole('button', { name: 'Etanol' }));
      await fireEvent.changeText(
        screen.getByLabelText('Qual combustível e quanto está o litro? (R$)'),
        '4,19',
      );
      await fireEvent.press(screen.getByRole('button', { name: 'Enviar preço' }));
      await waitFor(() =>
        expect(avisar).toHaveBeenCalledWith('Obrigado! Preço enviado.', expect.any(String)),
      );
      expect(mockInformar).toHaveBeenCalledWith(postoDoBanco.id, 'etanol', 4.19);
      expect(aoAgir).not.toHaveBeenCalled();
      expect(mockUltimos).toHaveBeenCalledTimes(2);
    });

    it('erro do servidor mostra aviso e mantém o formulário', async () => {
      mockInformar.mockResolvedValue(false);
      await render(<FichaMapa ficha={fichaDoLugar(postoDoBanco)} aoFechar={jest.fn()} aoAgir={jest.fn()} />);
      await fireEvent.press(screen.getByRole('button', { name: 'Informar preço' }));
      await fireEvent.changeText(
        screen.getByLabelText('Qual combustível e quanto está o litro? (R$)'),
        '6,29',
      );
      await fireEvent.press(screen.getByRole('button', { name: 'Enviar preço' }));
      await waitFor(() =>
        expect(avisar).toHaveBeenCalledWith(expect.stringMatching(/Não foi possível enviar/)),
      );
      expect(screen.getByLabelText('Qual combustível e quanto está o litro? (R$)')).toBeTruthy();
    });
  });
});
