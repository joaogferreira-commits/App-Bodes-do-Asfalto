import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking, Share } from 'react-native';

import MeusDados from '@/app/acesso/meus-dados';
import Ajuda from '@/app/ajuda';
import Aprovacoes from '@/app/aprovacoes';
import * as servidor from '@/servidor/suporte';
import * as dialogo from '@/ui/dialogo';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() } }));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});
jest.mock('@/servidor/auth', () => ({
  pedidosParaAprovar: jest.fn(async () => []),
  decidirPedido: jest.fn(),
}));
jest.mock('@/servidor/supabase', () => ({ servidorConfigurado: true, supabase: {} }));
jest.mock('@/servidor/meusDados', () => ({
  exportarMeusDadosServidor: jest.fn(async () => ({ perfil: { nome: 'Zé' }, mensagensEnviadas: 3 })),
}));
jest.mock('@/servidor/suporte', () => ({
  ...jest.requireActual('@/servidor/suporte'),
  enviarPedido: jest.fn(async () => undefined),
  meusPedidos: jest.fn(),
  pedidosAbertos: jest.fn(),
  responderPedido: jest.fn(async () => undefined),
  urlDoPrint: jest.fn(async () => 'https://x/print'),
}));
let mockWhats = '';
jest.mock('@/config/suporte', () => ({
  EMAIL_SUPORTE: 'suporte@teste.com',
  get WHATSAPP_SUPORTE() {
    return mockWhats;
  },
}));

let mockModo: 'local' | 'supabase' = 'supabase';
let mockPapel = 'membro';
jest.mock('@/acesso/acesso', () => {
  const valor = () => ({
    modo: mockModo,
    estado: 'membro',
    papel: mockPapel,
    email: 'a@b.c',
    consentimentos: [],
    temConsentimento: () => true,
    sair: async () => undefined,
    excluirConta: async () => undefined,
  });
  return { useAcesso: valor, useAcessoOpcional: valor };
});

const mock = servidor as jest.Mocked<typeof servidor>;

beforeEach(() => {
  jest.clearAllMocks();
  mockModo = 'supabase';
  mockPapel = 'membro';
  mock.meusPedidos.mockResolvedValue([
    {
      id: 's1',
      texto: 'Meu mapa travou',
      categoria: 'problema',
      status: 'respondido',
      resposta: 'Já corrigimos',
      temPrint: false,
      printPath: null,
      criadoEm: '2026-11-13',
    },
  ]);
});

describe('Ajuda', () => {
  it('mostra o e-mail, esconde o WhatsApp sem número e lista Meus pedidos com a resposta', async () => {
    const abrir = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await render(<Ajuda />);
    expect(screen.queryByRole('button', { name: 'WhatsApp do suporte' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'E-mail do suporte' }));
    expect(abrir.mock.calls[0]![0]).toContain('mailto:suporte@teste.com');
    expect(await screen.findByText('Meu mapa travou')).toBeTruthy();
    expect(screen.getByText('Resposta: Já corrigimos')).toBeTruthy();
    expect(screen.getByText('Problema · Respondido')).toBeTruthy();
    abrir.mockRestore();
  });

  it('mostra o botão do WhatsApp só quando há número', async () => {
    mockWhats = '5565999990000';
    const abrir = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await render(<Ajuda />);
    await fireEvent.press(screen.getByRole('button', { name: 'WhatsApp do suporte' }));
    expect(abrir.mock.calls[0]![0]).toContain('wa.me/5565999990000');
    mockWhats = '';
    abrir.mockRestore();
  });

  it('no modo local não mostra o formulário (só os contatos)', async () => {
    mockModo = 'local';
    await render(<Ajuda />);
    expect(screen.getByRole('button', { name: 'E-mail do suporte' })).toBeTruthy();
    expect(screen.queryByLabelText('Descreva em poucas palavras')).toBeNull();
  });

  it('exige texto antes de enviar', async () => {
    const aviso = jest.spyOn(dialogo, 'avisar').mockImplementation(() => undefined);
    await render(<Ajuda />);
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar pedido' }));
    expect(aviso).toHaveBeenCalledWith('Escreva o que você precisa antes de enviar.');
    expect(mock.enviarPedido).not.toHaveBeenCalled();
    aviso.mockRestore();
  });

  it('envia sem print e sem dados do aparelho por padrão', async () => {
    const aviso = jest.spyOn(dialogo, 'avisar').mockImplementation(() => undefined);
    await render(<Ajuda />);
    await fireEvent.press(screen.getByRole('button', { name: 'Sugestão' }));
    await fireEvent.changeText(screen.getByLabelText('Descreva em poucas palavras'), 'Queria modo escuro');
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar pedido' }));
    await waitFor(() => expect(mock.enviarPedido).toHaveBeenCalled());
    expect(mock.enviarPedido).toHaveBeenCalledWith({
      texto: 'Queria modo escuro',
      categoria: 'sugestao',
      aparelho: null,
      printUri: null,
      erros: undefined,
    });
    await waitFor(() =>
      expect(aviso).toHaveBeenCalledWith('Pedido enviado. Avisamos quando houver resposta.'),
    );
    aviso.mockRestore();
  });

  it('envia com print (sem EXIF) e dados do aparelho quando marcados, mostrando o que vai', async () => {
    await render(<Ajuda />);
    expect(screen.getByText(/Nunca enviamos sua localização/)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Descreva em poucas palavras'), 'Erro na rota');
    await fireEvent.press(screen.getByRole('button', { name: 'Anexar print' }));
    expect(await screen.findByLabelText('Print anexado')).toBeTruthy();
    await fireEvent(screen.getByLabelText('Enviar dados do aparelho'), 'valueChange', true);
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar pedido' }));
    await waitFor(() => expect(mock.enviarPedido).toHaveBeenCalled());
    const arg = mock.enviarPedido.mock.calls[0]![0];
    expect(arg.printUri).toBeTruthy();
    expect(arg.printUri).not.toBe('file:///foto-original.jpg'); // foi reprocessado
    expect(arg.aparelho).toMatchObject({ idioma: expect.any(String) });
    expect(Object.keys(arg.aparelho!).sort()).toEqual(['app', 'idioma', 'modelo', 'so']);
  });
});

describe('suporte na tela de aprovações', () => {
  it('só moderador e admin veem a aba Suporte', async () => {
    await render(<Aprovacoes />);
    expect(screen.queryByRole('button', { name: 'Suporte' })).toBeNull();
  });

  it('moderador vê os pedidos abertos e responde', async () => {
    mockPapel = 'moderador';
    mock.pedidosAbertos.mockResolvedValue([
      {
        id: 's9',
        texto: 'Não consigo entrar',
        categoria: 'duvida',
        status: 'aberto',
        resposta: null,
        temPrint: true,
        printPath: 'u1/p.jpg',
        criadoEm: '2026-11-13',
        autor: 'Tião “Garupa”',
      },
    ]);
    const aviso = jest.spyOn(dialogo, 'avisar').mockImplementation(() => undefined);
    await render(<Aprovacoes />);
    await fireEvent.press(screen.getByRole('button', { name: 'Suporte' }));
    expect(await screen.findByText('Não consigo entrar')).toBeTruthy();
    expect(screen.getByText('Tião “Garupa”')).toBeTruthy();
    expect(await screen.findByLabelText('Print enviado pelo irmão')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Responder' }));
    expect(aviso).toHaveBeenCalledWith('Escreva a resposta antes de enviar.');
    expect(mock.responderPedido).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText('Sua resposta ao irmão'), 'Peça novo link.');
    await fireEvent.press(screen.getByRole('button', { name: 'Responder' }));
    await waitFor(() =>
      expect(mock.responderPedido).toHaveBeenCalledWith('s9', 'Peça novo link.', 'respondido'),
    );
    aviso.mockRestore();
  });
});

describe('Meus dados no modo servidor', () => {
  it('baixar junta os dados do servidor ao arquivo compartilhado', async () => {
    const compartilhar = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    await render(<MeusDados />);
    await fireEvent.press(screen.getByRole('button', { name: 'Baixar uma cópia dos meus dados' }));
    await act(async () => undefined);
    const msg = JSON.parse(compartilhar.mock.calls[0]![0].message as string);
    expect(msg.servidor).toEqual({ perfil: { nome: 'Zé' }, mensagensEnviadas: 3 });
    compartilhar.mockRestore();
  });
});
