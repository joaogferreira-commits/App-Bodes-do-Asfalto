import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as dialogo from '@/ui/dialogo';

import Conversas from '@/app/(abas)/conversas';
import Conversa from '@/app/conversa/[id]';
import { conversasExemplo, mensagensExemplo, ordenarConversas, podeEscrever } from '@/dados/conversas';
import { ProvedorConversas } from '@/estado/conversas';

const params: { id?: string } = {};
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => params,
}));

describe('regras do chat', () => {
  it('avisos só a diretoria escreve; 1:1 só depois do aceno; bloqueado não escreve', () => {
    const avisos = conversasExemplo.find((c) => c.tipo === 'avisos')!;
    expect(podeEscrever(avisos, 'membro', [])).toBe(false);
    expect(podeEscrever(avisos, 'diretoria_capitulo', [])).toBe(true);
    const edu = conversasExemplo.find((c) => c.id === 'direto-edu')!;
    expect(podeEscrever(edu, 'membro', [])).toBe(false);
    const ze = conversasExemplo.find((c) => c.id === 'direto-ze')!;
    expect(podeEscrever(ze, 'membro', [])).toBe(true);
    expect(podeEscrever(ze, 'membro', ['Zé Ferreira'])).toBe(false);
  });

  it('avisos ficam sempre no topo da lista', () => {
    expect(ordenarConversas(conversasExemplo, mensagensExemplo)[0]!.tipo).toBe('avisos');
  });
});

describe('telas do chat', () => {
  it('lista mostra grupos e diretas e filtra', async () => {
    await render(
      <ProvedorConversas>
        <Conversas />
      </ProvedorConversas>,
    );
    expect(screen.getByText('Capítulo Cuiabá')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Diretas' }));
    expect(screen.queryByText('Capítulo Cuiabá')).toBeNull();
    expect(screen.getByText('Zé Ferreira')).toBeTruthy();
  });

  it('envia resposta rápida e texto; denunciar tira a mensagem da tela', async () => {
    params.id = 'direto-ze';
    await render(
      <ProvedorConversas>
        <Conversa />
      </ProvedorConversas>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Chego em 10 min' }));
    expect(screen.getByLabelText('Você: Chego em 10 min')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Escreva uma mensagem'), 'Sábado 7h no Trevo');
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar' }));
    expect(screen.getByText('Sábado 7h no Trevo')).toBeTruthy();

    const alerta = jest.spyOn(dialogo, 'abrirMenu').mockImplementation(() => undefined);
    await fireEvent.press(screen.getByText('Irmão, aceitei seu aceno. Bora rodar sábado?'));
    await act(async () => alerta.mock.calls[0]![0].opcoes.find((o) => o.rotulo === 'Denunciar')!.onPress());
    alerta.mockRestore();
    expect(screen.queryByText('Irmão, aceitei seu aceno. Bora rodar sábado?')).toBeNull();
  });

  it('canal de avisos não tem campo de escrever para membro', async () => {
    params.id = 'avisos-cuiaba';
    await render(
      <ProvedorConversas>
        <Conversa />
      </ProvedorConversas>,
    );
    expect(screen.queryByLabelText('Escreva uma mensagem')).toBeNull();
    expect(screen.getByText('Só a diretoria escreve nos avisos.')).toBeTruthy();
  });
});
