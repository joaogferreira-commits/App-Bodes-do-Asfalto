import {
  dadosDoAparelho,
  enviarPedido,
  meusPedidos,
  montarTexto,
  pedidosAbertos,
  responderPedido,
} from './suporte';

jest.mock('./supabase', () => ({
  get supabase() {
    return mockCliente;
  },
}));

const mockInsert = jest.fn();
const mockUpload = jest.fn();
const mockRemove = jest.fn();
const mockRpc = jest.fn();
const mockEq = jest.fn();
let mockCliente: object | null;

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn(async () => ({ arrayBuffer: async () => new ArrayBuffer(4) })) as never;
  mockUpload.mockResolvedValue({ error: null });
  mockInsert.mockResolvedValue({ error: null });
  mockRemove.mockResolvedValue({ error: null });
  mockRpc.mockResolvedValue({ error: null });
  mockCliente = {
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    storage: { from: () => ({ upload: mockUpload, remove: mockRemove }) },
    rpc: mockRpc,
    from: () => ({
      insert: mockInsert,
      select: () => ({
        eq: (...a: unknown[]) => {
          mockEq(...a);
          const fim = { limit: async () => ({ data: dadosLinhas, error: null }) };
          return { order: () => fim, ...fim };
        },
      }),
    }),
  };
});

const dadosLinhas = [
  {
    id: 's1',
    texto: 'Travou',
    categoria: 'problema',
    status: 'respondido',
    resposta: 'Corrigido',
    print_path: 'u1/p.jpg',
    created_at: '2026-11-13T10:00:00Z',
    perfis: { nome: 'Zé', apelido: 'Zezão' },
  },
];

describe('suporte', () => {
  it('dados do aparelho levam só app, sistema, modelo e idioma', () => {
    const d = dadosDoAparelho('pt-BR');
    expect(Object.keys(d).sort()).toEqual(['app', 'idioma', 'modelo', 'so']);
  });

  it('monta o texto com os erros cortados para caber em 2000', () => {
    expect(montarTexto('  oi  ')).toBe('oi');
    const t = montarTexto('a'.repeat(1000), 'e'.repeat(5000));
    expect(t.length).toBe(2000);
    expect(t).toContain('--- erros ---');
  });

  it('envia sem print: nada vai ao bucket e o aparelho segue só se informado', async () => {
    await enviarPedido({ texto: 'Dúvida', categoria: 'duvida', aparelho: null });
    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith({
      usuario_id: 'u1',
      texto: 'Dúvida',
      categoria: 'duvida',
      dados_aparelho: null,
      print_path: null,
    });
  });

  it('envia com print na pasta do próprio irmão e dados do aparelho', async () => {
    const aparelho = { app: '1', so: 'android 15', modelo: 'X', idioma: 'pt-BR' };
    await enviarPedido({ texto: 'Bug', categoria: 'problema', aparelho, printUri: 'file:///p.jpg' });
    const caminho = mockUpload.mock.calls[0][0] as string;
    expect(caminho.startsWith('u1/print-')).toBe(true);
    expect(mockInsert.mock.calls[0][0]).toMatchObject({ dados_aparelho: aparelho, print_path: caminho });
  });

  it('se o insert falha, apaga o print enviado e repassa o erro', async () => {
    mockInsert.mockResolvedValue({ error: new Error('x') });
    await expect(
      enviarPedido({ texto: 'Bug', categoria: 'problema', printUri: 'file:///p.jpg' }),
    ).rejects.toThrow('x');
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it('lista meus pedidos e a fila aberta, com o nome de quem pediu', async () => {
    const meus = await meusPedidos();
    expect(mockEq).toHaveBeenCalledWith('usuario_id', 'u1');
    expect(meus[0]).toMatchObject({ id: 's1', status: 'respondido', resposta: 'Corrigido', temPrint: true });
    const abertos = await pedidosAbertos();
    expect(abertos[0]!.autor).toBe('Zé “Zezão”');
  });

  it('responde pela função do banco', async () => {
    await responderPedido('s1', 'Pronto');
    expect(mockRpc).toHaveBeenCalledWith('responder_suporte', {
      p_id: 's1',
      p_resposta: 'Pronto',
      p_status: 'respondido',
    });
    mockRpc.mockResolvedValue({ error: new Error('sem_permissao') });
    await expect(responderPedido('s1', 'x')).rejects.toThrow('sem_permissao');
  });
});
