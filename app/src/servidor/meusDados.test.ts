import { exportarMeusDadosServidor } from './meusDados';

jest.mock('./supabase', () => ({
  get supabase() {
    return mockCliente;
  },
}));

const mockRpc = jest.fn();
let mockCliente: object | null;
let consentimentos: { finalidade: string; revogado_em: string | null }[];

beforeEach(() => {
  mockRpc.mockReset();
  mockRpc.mockResolvedValue({ data: [{ loja: 'Loja X', oriente: 'Cuiabá', potencia: 'GOB' }], error: null });
  consentimentos = [{ finalidade: 'dados_macons', revogado_em: null }];
  const tabelas: Record<string, () => object> = {
    perfis: () => ({ data: { id: 'u1', nome: 'Zé' }, error: null }),
    motos: () => ({ data: [{ id: 'm1' }], error: null }),
    contatos_emergencia: () => ({ data: [{ id: 'c1' }], error: null }),
    consentimentos: () => ({ data: consentimentos, error: null }),
    posts: () => ({ data: [{ id: 'p1' }], error: null }),
    mensagens: () => ({ data: null, count: 7, error: null }),
    pedidos_suporte: () => ({ data: [{ id: 's1' }], error: null }),
  };
  mockCliente = {
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    rpc: mockRpc,
    from: (nome: string) => ({
      select: () => ({
        eq: () => {
          const r = Promise.resolve(tabelas[nome]!());
          return Object.assign(r, { maybeSingle: () => r });
        },
      }),
    }),
  };
});

describe('exportar meus dados (servidor)', () => {
  it('junta perfil, garagem, contatos, consentimentos, posts, contagem de mensagens e suporte', async () => {
    const d = await exportarMeusDadosServidor();
    expect(d).toMatchObject({
      perfil: { nome: 'Zé' },
      garagem: [{ id: 'm1' }],
      contatosEmergencia: [{ id: 'c1' }],
      posts: [{ id: 'p1' }],
      mensagensEnviadas: 7,
      pedidosSuporte: [{ id: 's1' }],
      dadosMaconicos: { loja: 'Loja X', oriente: 'Cuiabá', potencia: 'GOB' },
    });
  });

  it('sem consentimento maçônico ativo, não consulta nem inclui Loja/Oriente/Potência', async () => {
    consentimentos = [{ finalidade: 'dados_macons', revogado_em: '2026-11-01' }];
    const d = await exportarMeusDadosServidor();
    expect(d?.dadosMaconicos).toBeNull();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('sem servidor devolve null', async () => {
    mockCliente = null;
    expect(await exportarMeusDadosServidor()).toBeNull();
  });
});
