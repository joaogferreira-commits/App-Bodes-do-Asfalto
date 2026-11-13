import { ehPostoDoServidor, informarPreco, ultimosPrecos } from './precos';

jest.mock('./supabase', () => ({
  get supabase() {
    return mockCliente;
  },
}));

const mockInsert = jest.fn();
const mockRpc = jest.fn();
let mockCliente: object | null;

beforeEach(() => {
  mockInsert.mockReset();
  mockRpc.mockReset();
  mockCliente = { rpc: mockRpc, from: () => ({ insert: mockInsert }) };
});

describe('informarPreco', () => {
  it('grava e devolve true', async () => {
    mockInsert.mockResolvedValue({ error: null });
    expect(await informarPreco('node/1', 'etanol', 4.19)).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith({ posto_id: 'node/1', produto: 'etanol', valor: 4.19 });
  });
  it('erro do servidor, exceção ou sem cliente: false', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'limite' } });
    expect(await informarPreco('node/1', 'etanol', 4.19)).toBe(false);
    mockInsert.mockRejectedValue(new Error('rede'));
    expect(await informarPreco('node/1', 'etanol', 4.19)).toBe(false);
    mockCliente = null;
    expect(await informarPreco('node/1', 'etanol', 4.19)).toBe(false);
  });
});

describe('ultimosPrecos', () => {
  it('converte as linhas e só pergunta por ids do servidor', async () => {
    mockRpc.mockResolvedValue({
      data: [
        { posto_id: 'node/1', produto: 'gasolina_comum', valor: '6.29', criado_em: '2026-11-12T10:00:00Z' },
      ],
      error: null,
    });
    const r = await ultimosPrecos(['node/1', 'lugar-exemplo']);
    expect(mockRpc).toHaveBeenCalledWith('ultimos_precos', { p_posto_ids: ['node/1'] });
    expect(r).toEqual([
      { postoId: 'node/1', produto: 'gasolina_comum', valor: 6.29, criadoEm: '2026-11-12T10:00:00Z' },
    ]);
  });
  it('sem ids válidos não chama; erro devolve lista vazia', async () => {
    expect(await ultimosPrecos(['x'])).toEqual([]);
    expect(mockRpc).not.toHaveBeenCalled();
    mockRpc.mockResolvedValue({ data: null, error: { message: 'x' } });
    expect(await ultimosPrecos(['anp/12345678000190'])).toEqual([]);
  });
  it('reconhece ids do servidor', () => {
    expect(ehPostoDoServidor('anp/12345678000190')).toBe(true);
    expect(ehPostoDoServidor('node/99')).toBe(true);
    expect(ehPostoDoServidor('posto-1')).toBe(false);
  });
});
