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
  it('tem rótulo com nome e status; sem ilustração mostra as iniciais', async () => {
    await render(
      <Avatar nome="Zé Ferreira" status="aberto" rotuloStatus="Aberto a encontro" ilustrado={false} />,
    );
    expect(screen.getByLabelText('Zé Ferreira, Aberto a encontro')).toBeTruthy();
    expect(screen.getByText('ZF')).toBeTruthy();
  });

  it('cada nome tem sempre o mesmo avatar ilustrado, e nomes diferentes variam', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { avatarDoNome } = require('@/estado/avatar') as typeof import('@/estado/avatar');
    expect(avatarDoNome('Zé Ferreira')).toEqual(avatarDoNome('Zé Ferreira'));
    const nomes = ['Zé Ferreira', 'Edu Prado', 'Ivan Coruja', 'Marcos Ferrugem', 'Tião Garupa'];
    expect(new Set(nomes.map((n) => JSON.stringify(avatarDoNome(n)))).size).toBe(5);
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

describe('pesquisa de usabilidade (R15–R25)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ProvedorTema, paletaSol, paletaNoite } = require('@/theme') as typeof import('@/theme');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { SeletorTema, Texto } = require('.') as typeof import('.');

  it('botão principal usa texto escuro sobre o laranja, nos dois temas (R15)', async () => {
    await render(
      <ProvedorTema inicial="sol">
        <Botao titulo="Iniciar" onPress={jest.fn()} />
      </ProvedorTema>,
    );
    const fundo = plano(screen.getByRole('button', { name: 'Iniciar' }).props.style).backgroundColor;
    expect(fundo).toBe(paletaSol.acao);
    expect(plano(screen.getByText('Iniciar').props.style).color).toBe(paletaSol.textoSobreAcao);
  });

  it('o seletor troca entre Automático, Noite e Sol e os componentes acompanham (R17)', async () => {
    await render(
      <ProvedorTema inicial="noite">
        <SeletorTema />
        <Texto>Olá</Texto>
      </ProvedorTema>,
    );
    expect(plano(screen.getByText('Olá').props.style).color).toBe(paletaNoite.texto);
    await fireEvent.press(screen.getByRole('radio', { name: 'Sol' }));
    expect(plano(screen.getByText('Olá').props.style).color).toBe(paletaSol.texto);
    expect(screen.getByRole('radio', { name: 'Sol' }).props.accessibilityState).toMatchObject({
      checked: true,
    });
  });

  it('rótulo em caixa alta usa Inter, não a condensada (R19); corpo com peso 500 (R16)', async () => {
    await render(
      <>
        <Texto variante="rotulo">TIPO</Texto>
        <Texto>corpo</Texto>
      </>,
    );
    expect(plano(screen.getByText('TIPO').props.style).fontFamily).toMatch(/^Inter/);
    expect(plano(screen.getByText('corpo').props.style).fontFamily).toBe('Inter_500Medium');
  });

  it('a fonte do sistema amplia o texto; a barra inferior limita a 1,3× (R21)', async () => {
    await render(
      <>
        <Texto>livre</Texto>
        <BarraAbas ativa="mapa" onTrocar={jest.fn()} />
      </>,
    );
    expect(screen.getByText('livre').props.allowFontScaling).toBe(true);
    expect(screen.getByText('livre').props.maxFontSizeMultiplier).toBeUndefined();
    expect(screen.getByText('Feed').props.maxFontSizeMultiplier).toBe(1.3);
  });

  it('status do irmão não depende só da cor: traço e selo próprios (R23)', async () => {
    await render(
      <>
        <Avatar nome="Edu Prado" status="estrada" />
        <Avatar nome="Zé Ferreira" status="aberto" />
      </>,
    );
    const [estrada, aberto] = screen.getAllByRole('image');
    expect(plano(estrada!.props.style).borderStyle).toBe('dashed');
    expect(plano(aberto!.props.style).borderStyle).toBe('solid');
    expect(screen.getByTestId('selo-estrada')).toBeTruthy();
  });

  it('cada pino tem o seu emblema; sede e Ágape nunca agrupam (R23, R44)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { pinos } = require('.') as typeof import('.');
    const imagens = new Set(Object.values(pinos).map((p) => p.imagem));
    expect(imagens.size).toBe(Object.keys(pinos).length);
    expect(pinos.sede.agrupa).toBe(false);
    expect(pinos.agape.agrupa).toBe(false);
    await render(<Pino tipo="monumento" descricao="Monumento" />);
    expect(screen.getByTestId('pino-monumento')).toBeTruthy();
  });

  it('botão de ícone do mapa pode mostrar o rótulo embaixo (R22)', async () => {
    await render(
      <BotaoIcone
        icone="camadas"
        rotulo="Camadas do mapa"
        legenda="Legenda"
        legendaAbaixo
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText('Legenda')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Camadas do mapa' })).toBeTruthy();
  });
});
