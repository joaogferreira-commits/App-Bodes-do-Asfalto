import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { DialogoHost } from './Dialogo';
import { abrirMenu, avisar, limparDialogos } from './dialogo';

afterEach(() => act(() => limparDialogos()));

describe('janelas do app (DialogoHost)', () => {
  it('aviso sem botões mostra OK e fecha', async () => {
    await render(<DialogoHost />);
    await act(async () => avisar('Tudo certo', 'Salvo.'));
    expect(screen.getByText('Tudo certo')).toBeTruthy();
    expect(screen.getByText('Salvo.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'OK' }));
    expect(screen.queryByText('Tudo certo')).toBeNull();
  });

  it('voltar do celular (onRequestClose) fecha e chama o botão cancelar', async () => {
    const cancelou = jest.fn();
    const apagou = jest.fn();
    await render(<DialogoHost />);
    await act(async () =>
      avisar('Apagar?', undefined, [
        { text: 'Cancelar', style: 'cancel', onPress: cancelou },
        { text: 'Apagar', style: 'destructive', onPress: apagou },
      ]),
    );
    await fireEvent(screen.getByTestId('dialogo-modal'), 'requestClose');
    expect(screen.queryByText('Apagar?')).toBeNull();
    expect(cancelou).toHaveBeenCalledTimes(1);
    expect(apagou).not.toHaveBeenCalled();
  });

  it('tocar fora (fundo escuro) fecha como cancelar', async () => {
    const cancelou = jest.fn();
    await render(<DialogoHost />);
    await act(async () => avisar('Sair?', undefined, [{ text: 'Não', style: 'cancel', onPress: cancelou }]));
    await fireEvent.press(screen.getByTestId('dialogo-fundo'));
    expect(screen.queryByText('Sair?')).toBeNull();
    expect(cancelou).toHaveBeenCalledTimes(1);
  });

  it('botão destrutivo tem contorno vermelho e executa a ação', async () => {
    const apagou = jest.fn();
    await render(<DialogoHost />);
    await act(async () =>
      avisar('Apagar?', undefined, [
        { text: 'Apagar', style: 'destructive', onPress: apagou },
        { text: 'Cancelar', style: 'cancel' },
      ]),
    );
    const botao = screen.getByTestId('dialogo-destrutivo');
    expect(botao).toHaveStyle({ borderWidth: 2, borderColor: '#C62D22' });
    await fireEvent.press(botao);
    expect(apagou).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Apagar?')).toBeNull();
  });

  it('várias chamadas entram na fila, uma de cada vez', async () => {
    await render(<DialogoHost />);
    await act(async () => {
      avisar('Primeiro');
      avisar('Segundo');
    });
    expect(screen.getByText('Primeiro')).toBeTruthy();
    expect(screen.queryByText('Segundo')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'OK' }));
    expect(screen.getByText('Segundo')).toBeTruthy();
  });

  it('menu: opção executa a ação e fecha; destrutiva tem destaque; Cancelar fecha sem agir', async () => {
    const denunciar = jest.fn();
    const bloquear = jest.fn();
    await render(<DialogoHost />);
    const abrir = () =>
      act(async () =>
        abrirMenu({
          titulo: 'Opções',
          opcoes: [
            { rotulo: 'Denunciar', icone: 'bandeira', onPress: denunciar },
            { rotulo: 'Bloquear', icone: 'bloquear', destrutivo: true, onPress: bloquear },
          ],
        }),
      );
    await abrir();
    expect(screen.getByText('Opções')).toBeTruthy();
    expect(screen.getByTestId('dialogo-destrutivo')).toHaveStyle({ borderColor: '#C62D22' });
    await fireEvent.press(screen.getByRole('button', { name: 'Denunciar' }));
    expect(denunciar).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Opções')).toBeNull();

    await abrir();
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText('Opções')).toBeNull();
    expect(bloquear).not.toHaveBeenCalled();
  });

  it('menu: voltar do celular e toque fora fecham sem executar nada', async () => {
    const acao = jest.fn();
    await render(<DialogoHost />);
    await act(async () => abrirMenu({ titulo: 'M1', opcoes: [{ rotulo: 'A', onPress: acao }] }));
    await fireEvent(screen.getByTestId('dialogo-modal'), 'requestClose');
    expect(screen.queryByText('M1')).toBeNull();
    await act(async () => abrirMenu({ titulo: 'M2', opcoes: [{ rotulo: 'A', onPress: acao }] }));
    await fireEvent.press(screen.getByTestId('dialogo-fundo'));
    expect(screen.queryByText('M2')).toBeNull();
    expect(acao).not.toHaveBeenCalled();
  });

  it('pode ser chamado fora do React antes do host montar (a janela espera na fila)', async () => {
    avisar('Chamado cedo');
    await render(<DialogoHost />);
    expect(screen.getByText('Chamado cedo')).toBeTruthy();
  });
});
