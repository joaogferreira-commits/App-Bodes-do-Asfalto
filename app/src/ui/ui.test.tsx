import { fireEvent, render, screen } from '@testing-library/react-native';

import { cores } from '@/theme';

import { Avatar, BarraNavegacao, Botao, CartaoBordado, Chip, Texto } from '.';

describe('Botao', () => {
  it('chama a ação ao tocar e é anunciado como botão', async () => {
    const onPress = jest.fn();
    await render(<Botao titulo="Vou" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Vou' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('desativado não chama a ação', async () => {
    const onPress = jest.fn();
    await render(<Botao titulo="Vou" onPress={onPress} desativado />);
    await fireEvent.press(screen.getByRole('button', { name: 'Vou' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('SOS usa o vermelho e altura mínima de 48 px', async () => {
    await render(<Botao titulo="SOS" variante="sos" onPress={jest.fn()} />);
    const estilo = screen.getByRole('button', { name: 'SOS' }).props.style;
    const plano = Object.assign({}, ...[estilo].flat(Infinity).filter(Boolean));
    expect(plano.backgroundColor).toBe(cores.vermelho);
    expect(plano.minHeight).toBeGreaterThanOrEqual(48);
  });
});

describe('Chip', () => {
  it('informa se está selecionado', async () => {
    await render(<Chip rotulo="Postos" ativo onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Postos' })).toBeSelected();
  });
});

describe('Avatar', () => {
  it('tem rótulo com nome e status e mostra as iniciais', async () => {
    await render(<Avatar nome="Zé Ferreira" status="aberto" rotuloStatus="Aberto a encontro" />);
    expect(screen.getByLabelText('Zé Ferreira, Aberto a encontro')).toBeTruthy();
    expect(screen.getByText('ZF')).toBeTruthy();
  });
});

describe('BarraNavegacao', () => {
  it('mostra as 5 abas traduzidas e troca ao tocar', async () => {
    const onTrocar = jest.fn();
    await render(<BarraNavegacao ativa="mapa" onTrocar={onTrocar} />);
    const abas = screen.getAllByRole('tab');
    expect(abas).toHaveLength(5);
    expect(screen.getByRole('tab', { name: 'Mapa' })).toBeSelected();
    await fireEvent.press(screen.getByRole('tab', { name: 'Conquistas' }));
    expect(onTrocar).toHaveBeenCalledWith('conquistas');
  });
});

describe('CartaoBordado', () => {
  it('mostra o conteúdo', async () => {
    await render(
      <CartaoBordado overlock>
        <Texto>Rota das Cachoeiras</Texto>
      </CartaoBordado>,
    );
    expect(screen.getByText('Rota das Cachoeiras')).toBeTruthy();
  });
});
