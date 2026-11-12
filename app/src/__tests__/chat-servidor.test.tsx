import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import Conversas from '@/app/(abas)/conversas';
import Conversa from '@/app/conversa/[id]';
import { ProvedorConversas } from '@/estado/conversas';
import * as chat from '@/servidor/chat';
import type { ConversaServidor } from '@/servidor/chat';
import type { Mensagem } from '@/dados/conversas';

const params: { id?: string } = {};
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => params,
}));
jest.mock('@/servidor/supabase', () => ({ servidorConfigurado: true, supabase: {} }));
const acesso = { modo: 'supabase', estado: 'membro', papel: 'membro' };
jest.mock('@/acesso/acesso', () => ({ useAcessoOpcional: () => acesso }));
jest.mock('@/servidor/chat', () => ({
  TAMANHO_PAGINA_CHAT: 30,
  garantirGrupoCapitulo: jest.fn(async () => 'grupo'),
  listarConversas: jest.fn(),
  mensagens: jest.fn(async () => []),
  enviar: jest.fn(),
  assinar: jest.fn(() => jest.fn()),
  marcarLida: jest.fn(async () => undefined),
  silenciar: jest.fn(async () => undefined),
  acenar: jest.fn(),
  acenosRecebidos: jest.fn(async () => []),
  aceitar: jest.fn(),
  recusar: jest.fn(async () => undefined),
  listarMembros: jest.fn(async () => []),
  denunciarMensagem: jest.fn(async () => undefined),
  bloquear: jest.fn(async () => undefined),
}));

const base = (o: Partial<ConversaServidor>): ConversaServidor => ({
  id: 'c1',
  tipo: 'capitulo',
  titulo: 'Capítulo Cuiabá',
  participantes: 3,
  naoLidas: 0,
  silenciado: false,
  ultimaEm: null,
  ...o,
});
const msgDele: Mensagem = {
  id: 'm1',
  conversa: 'c1',
  autor: 'Ivan Coruja',
  autorId: 'u2',
  texto: 'Bom dia, irmãos',
  quando: '2026-11-12T10:00:00Z',
};

const m = (f: unknown) => f as jest.Mock;
const pronto = (conversas: ConversaServidor[], ultimas: Mensagem[] = []) =>
  m(chat.listarConversas).mockResolvedValue({ conversas, ultimas });
const router = () => jest.requireMock('expo-router').router;

describe('chat real (servidor)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    acesso.papel = 'membro';
    params.id = 'c1';
  });

  it('lista só o que vem do servidor, sem exemplos nem aviso de versão de teste', async () => {
    pronto([base({ naoLidas: 2 })], [msgDele]);
    await render(
      <ProvedorConversas>
        <Conversas />
      </ProvedorConversas>,
    );
    await screen.findByText('Capítulo Cuiabá');
    expect(chat.garantirGrupoCapitulo).toHaveBeenCalled();
    expect(screen.queryByText('Zé Ferreira')).toBeNull();
    expect(screen.queryByText(/Versão de teste/)).toBeNull();
    expect(screen.getByText('Ivan Coruja: Bom dia, irmãos')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('aceno recebido: aceitar abre a conversa direta; recusar tira da lista', async () => {
    pronto([]);
    m(chat.acenosRecebidos).mockResolvedValue([
      { id: 'a1', deId: 'u2', nome: 'Zé Ferreira', criadoEm: '2026-11-12T09:00:00Z' },
      { id: 'a2', deId: 'u3', nome: 'Edu Prado', criadoEm: '2026-11-12T08:00:00Z' },
    ]);
    m(chat.aceitar).mockResolvedValue('c-direto');
    await render(
      <ProvedorConversas>
        <Conversas />
      </ProvedorConversas>,
    );
    await screen.findByText('Acenos recebidos');
    await fireEvent.press(screen.getAllByRole('button', { name: 'Recusar' })[1]!);
    expect(chat.recusar).toHaveBeenCalledWith('a2');
    await fireEvent.press(screen.getByRole('button', { name: 'Aceitar' }));
    expect(chat.aceitar).toHaveBeenCalledWith('a1');
    await act(async () => undefined);
    expect(router().push).toHaveBeenCalledWith('/conversa/c-direto');
  });

  it('nova conversa envia aceno e, estourando o limite do dia, mostra a mensagem', async () => {
    pronto([]);
    m(chat.listarMembros).mockResolvedValue([
      { id: 'u2', nome: 'Zé Ferreira', apelido: null, capitulo: 'Cuiabá' },
    ]);
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    m(chat.acenar).mockResolvedValueOnce(undefined).mockRejectedValueOnce({ motivo: 'limite' });
    await render(
      <ProvedorConversas>
        <Conversas />
      </ProvedorConversas>,
    );
    for (const esperado of [
      'Aceno enviado para Zé Ferreira',
      'Você já usou os acenos de hoje. Amanhã libera de novo.',
    ]) {
      await fireEvent.press(screen.getByRole('button', { name: 'Nova conversa' }));
      await fireEvent.press(await screen.findByRole('button', { name: 'Acenar para Zé Ferreira' }));
      await act(async () => undefined);
      expect(alerta.mock.lastCall![0]).toBe(esperado);
    }
    expect(chat.acenar).toHaveBeenCalledWith('u2');
    expect(router().push).not.toHaveBeenCalled(); // não abre 1:1 antes de aceito
    alerta.mockRestore();
  });

  it('envia mensagem pelo servidor e recebe outra pelo assinar', async () => {
    pronto([base({})], []);
    m(chat.enviar).mockResolvedValue({ ...msgDele, id: 'm9', autor: 'eu', texto: 'Chego já', minha: true });
    await render(
      <ProvedorConversas>
        <Conversa />
      </ProvedorConversas>,
    );
    await screen.findByLabelText('Escreva uma mensagem');
    await fireEvent.changeText(screen.getByLabelText('Escreva uma mensagem'), 'Chego já');
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar' }));
    expect(chat.enviar).toHaveBeenCalledWith('c1', 'Chego já', false);
    expect(await screen.findByLabelText('Você: Chego já')).toBeTruthy();

    const aoChegar = m(chat.assinar).mock.calls.find((c) => c[0] === 'c1')![1] as (x: Mensagem) => void;
    await act(async () => aoChegar({ ...msgDele, id: 'm10', texto: 'Café no Trevo?' }));
    expect(screen.getByText('Café no Trevo?')).toBeTruthy();
    expect(chat.marcarLida).toHaveBeenCalledWith('c1');
  });

  it('membro comum só lê o canal de avisos; diretoria escreve', async () => {
    pronto([base({ id: 'c1', tipo: 'avisos', titulo: 'Avisos Cuiabá' })], []);
    const { unmount } = await render(
      <ProvedorConversas>
        <Conversa />
      </ProvedorConversas>,
    );
    await screen.findByText('Só a diretoria escreve nos avisos.');
    expect(screen.queryByLabelText('Escreva uma mensagem')).toBeNull();
    await unmount();

    acesso.papel = 'diretoria_capitulo';
    await render(
      <ProvedorConversas>
        <Conversa />
      </ProvedorConversas>,
    );
    expect(await screen.findByLabelText('Escreva uma mensagem')).toBeTruthy();
  });

  it('denunciar e bloquear usam o servidor com os ids', async () => {
    pronto([base({})], [msgDele]);
    m(chat.mensagens).mockResolvedValue([msgDele]);
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await render(
      <ProvedorConversas>
        <Conversa />
      </ProvedorConversas>,
    );
    await fireEvent.press(await screen.findByText('Bom dia, irmãos'));
    const botoes = alerta.mock.calls[0]![2]!;
    await act(async () => botoes.find((b) => b.text === 'Denunciar')!.onPress!());
    expect(chat.denunciarMensagem).toHaveBeenCalledWith('m1', expect.any(String));
    await act(async () => botoes.find((b) => b.text === 'Bloquear Ivan Coruja')!.onPress!());
    expect(chat.bloquear).toHaveBeenCalledWith('u2');
    alerta.mockRestore();
  });
});
