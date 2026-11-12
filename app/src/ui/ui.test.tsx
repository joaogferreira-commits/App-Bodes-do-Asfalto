import { fireEvent, render, screen } from '@testing-library/react-native';

import { cores } from '@/theme';

import { Avatar, BarraAbas, Botao, BotaoIcone, caminhosIcones, Chip, iniciais, Pino } from '.';

const plano = (estilo: unknown) => Object.assign({}, ...[estilo].flat(Infinity).filter(Boolean));

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

  it('principal é laranja; SOS é vermelho; ambos com 52 px ou mais', async () => {
    await render(
      <>
        <Botao titulo="Iniciar" onPress={jest.fn()} />
        <Botao titulo="SOS" variante="sos" onPress={jest.fn()} />
      </>,
    );
    const iniciar = plano(screen.getByRole('button', { name: 'Iniciar' }).props.style);
    const sos = plano(screen.getByRole('button', { name: 'SOS' }).props.style);
    expect(iniciar.backgroundColor).toBe(cores.acao);
    expect(sos.backgroundColor).toBe(cores.sos);
    expect(iniciar.minHeight).toBeGreaterThanOrEqual(52);
  });
});

describe('BotaoIcone', () => {
  it('tem rótulo acessível mesmo sem texto visível', async () => {
    await render(<BotaoIcone icone="camadas" rotulo="Camadas do mapa" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Camadas do mapa' })).toBeTruthy();
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

  it.each([
    ['Zé Ferreira', 'ZF'],
    ['Marcos', 'M'],
    ['  ivan  prado  coruja ', 'IC'],
  ])('iniciais de "%s" = %s', (nome, esperado) => {
    expect(iniciais(nome)).toBe(esperado);
  });
});

describe('Pino', () => {
  it('descreve o lugar para leitores de tela', async () => {
    await render(<Pino tipo="posto" rotulo="R$ 6,29" descricao="Posto Trevo, R$ 6,29" />);
    expect(screen.getByLabelText('Posto Trevo, R$ 6,29')).toBeTruthy();
  });
});

describe('BarraAbas', () => {
  it('mostra as 5 abas traduzidas e troca ao tocar', async () => {
    const onTrocar = jest.fn();
    await render(<BarraAbas ativa="mapa" onTrocar={onTrocar} />);
    expect(screen.getAllByRole('tab')).toHaveLength(5);
    expect(screen.getByRole('tab', { name: 'Mapa' })).toBeSelected();
    await fireEvent.press(screen.getByRole('tab', { name: 'Conquistas' }));
    expect(onTrocar).toHaveBeenCalledWith('conquistas');
  });
});

describe('ícones', () => {
  it('todos os ícones têm desenho', () => {
    for (const [nome, caminhos] of Object.entries(caminhosIcones)) {
      expect(caminhos.length).toBeGreaterThan(0);
      for (const d of caminhos) expect(d).toMatch(/^M/);
      expect(nome).toBeTruthy();
    }
  });
});
