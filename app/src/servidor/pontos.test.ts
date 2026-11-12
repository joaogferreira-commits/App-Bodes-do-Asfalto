import { carregarPontosDaArea, linhaParaLugar } from './pontos';

jest.mock('./supabase', () => ({
  get supabase() {
    return mockCliente;
  },
}));

const mockRpc = jest.fn();
let mockCliente: { rpc: jest.Mock } | null = { rpc: mockRpc };

const area = { minLon: -56.3, minLat: -15.8, maxLon: -55.9, maxLat: -15.4 };

beforeEach(() => {
  mockRpc.mockReset();
  mockCliente = { rpc: mockRpc };
});

describe('carregarPontosDaArea', () => {
  it('chama pontos_na_area com a área, os tipos e o limite', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    await carregarPontosDaArea(area, ['museu'], 200);
    expect(mockRpc).toHaveBeenCalledWith('pontos_na_area', {
      min_lon: -56.3,
      min_lat: -15.8,
      max_lon: -55.9,
      max_lat: -15.4,
      tipos: ['museu'],
      limite: 200,
    });
  });

  it('converte as linhas em lugares, com site e telefone dos extras', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          id: 'node/1',
          tipo: 'museu',
          nome: 'Museu',
          lon: -56,
          lat: -15.6,
          extras: { website: 'museu.example', phone: '65 3000-0000' },
        },
        { id: 'node/2', tipo: 'tipo_novo', nome: 'Desconhecido', lon: -56, lat: -15.6, extras: {} },
        {
          id: 'node/3',
          tipo: 'hospital',
          nome: 'Hospital',
          lon: -56.1,
          lat: -15.5,
          extras: { website: 'javascript:alert(1)' },
        },
      ],
      error: null,
    });
    const r = await carregarPontosDaArea(area);
    expect(r.map((x) => x.id)).toEqual(['node/1', 'node/3']);
    expect(r[0]).toMatchObject({
      tipo: 'museu',
      fonte: 'osm',
      site: 'https://museu.example',
      telefone: '65 3000-0000',
    });
    expect(r[0]!.link).toBe('https://www.openstreetmap.org/node/1');
    expect(r[1]!.site).toBeUndefined();
  });

  it('se o servidor der erro (ex.: tabela ainda não criada), volta vazio sem lançar', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'relation "pontos_osm" does not exist' } });
    await expect(carregarPontosDaArea(area)).resolves.toEqual([]);
  });

  it('se a chamada falhar (rede), volta vazio sem lançar', async () => {
    mockRpc.mockRejectedValue(new Error('rede'));
    await expect(carregarPontosDaArea(area)).resolves.toEqual([]);
  });

  it('sem cliente do Supabase (modo local) nem chama o servidor', async () => {
    mockCliente = null;
    await expect(carregarPontosDaArea(area)).resolves.toEqual([]);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('linha com coordenada inválida é descartada', () => {
    expect(
      linhaParaLugar({ id: 'node/1', tipo: 'museu', nome: 'x', lon: NaN, lat: 0, extras: null }),
    ).toBeNull();
  });
});
