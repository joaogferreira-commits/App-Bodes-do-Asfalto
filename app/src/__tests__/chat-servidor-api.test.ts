import { acenar, assinar } from '@/servidor/chat';

const mockCanal = { on: jest.fn(), subscribe: jest.fn() };
const mockSb = {
  auth: { getUser: jest.fn(async () => ({ data: { user: { id: 'eu' } } })) },
  channel: jest.fn(() => mockCanal),
  removeChannel: jest.fn(async () => undefined),
  from: jest.fn(),
};
jest.mock('@/servidor/supabase', () => ({
  servidorConfigurado: true,
  get supabase() {
    return mockSb;
  },
}));

describe('servidor/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanal.on.mockReturnValue(mockCanal);
    mockCanal.subscribe.mockReturnValue(mockCanal);
  });

  it('assinar escuta INSERT de mensagens da conversa e devolve o cancelamento', async () => {
    mockSb.from.mockReturnValue({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { nome: 'Zé', apelido: null } }) }) }),
    });
    const recebidas: unknown[] = [];
    const cancelar = assinar('c1', (m) => recebidas.push(m));
    expect(mockCanal.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ event: 'INSERT', table: 'mensagens', filter: 'conversa_id=eq.c1' }),
      expect.any(Function),
    );
    const cb = mockCanal.on.mock.calls[0]![2] as (p: unknown) => void;
    cb({ new: { id: 'x', conversa_id: 'c1', autor: 'u2', texto: 'oi', rapida: false, criado_em: 't' } });
    await new Promise((r) => setTimeout(r, 0));
    expect(recebidas).toEqual([
      expect.objectContaining({ id: 'x', autor: 'Zé', autorId: 'u2', texto: 'oi', minha: false }),
    ]);
    cancelar();
    expect(mockSb.removeChannel).toHaveBeenCalledWith(mockCanal);
  });

  it('acenar traduz os erros do servidor em limite, repetido ou falha', async () => {
    const falha = (erro: object) =>
      mockSb.from.mockReturnValueOnce({ insert: async () => ({ error: erro }) });
    falha({ message: 'limite de 10 acenos por dia' });
    await expect(acenar('u2')).rejects.toMatchObject({ motivo: 'limite' });
    falha({ code: '23505', message: 'duplicate' });
    await expect(acenar('u2')).rejects.toMatchObject({ motivo: 'repetido' });
    falha({ code: '42501', message: 'rls' });
    await expect(acenar('u2')).rejects.toMatchObject({ motivo: 'erro' });
  });
});
