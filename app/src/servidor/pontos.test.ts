import {
  carregarPontosDaArea,
  carregarPostosDaArea,
  carregarPostosPerto,
  lerPrecosAnp,
  linhaParaLugar,
} from './pontos';

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

const precosAnp = {
  gasolina_comum: { valor: 6.29, data_coleta: '2026-11-03' },
  etanol: { valor: '4.19', data_coleta: '2026-11-10' },
  diesel_s10: { valor: 999, data_coleta: '2026-11-10' },
  gnv: { valor: 4.5, data_coleta: '2026-11-10' },
};

describe('postos da ANP', () => {
  it('lerPrecosAnp mantém só os 3 produtos válidos', () => {
    expect(lerPrecosAnp(precosAnp)).toEqual([
      { produto: 'gasolina_comum', valor: 6.29, data: '2026-11-03' },
      { produto: 'etanol', valor: 4.19, data: '2026-11-10' },
    ]);
    expect(lerPrecosAnp(null)).toEqual([]);
    expect(lerPrecosAnp({ etanol: { valor: 4, data_coleta: '10/11/2026' } })).toEqual([]);
  });

  it('linha anp/ vira posto com preços, bandeira, rótulo e sem link do OpenStreetMap', () => {
    const l = linhaParaLugar({
      id: 'anp/12345678000190',
      tipo: 'posto',
      nome: 'Posto Trevo',
      lon: -56.07,
      lat: -15.57,
      extras: { fonte: 'ANP', marca: 'Ipiranga', precisao: 'rua', precos: precosAnp },
    })!;
    expect(l).toMatchObject({ fonte: 'anp', bandeira: 'Ipiranga', rotulo: 'R$ 6,29', localAproximado: true });
    expect(l.precosAnp).toHaveLength(2);
    expect(l.link).toBeUndefined();
  });

  it('carregarPostosPerto chama postos_proximos e converte ANP e OSM', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          id: 'anp/1',
          nome: 'A',
          bandeira: 'Shell',
          lon: -56.1,
          lat: -15.6,
          fonte: 'ANP',
          precisao: 'osm',
          precos: precosAnp,
        },
        {
          id: 'node/9',
          nome: 'B',
          bandeira: null,
          lon: -56.2,
          lat: -15.7,
          fonte: 'OSM',
          precisao: 'osm',
          precos: {},
        },
      ],
      error: null,
    });
    const r = (await carregarPostosPerto({ lat: -15.6, lng: -56.1 }, 10, 30))!;
    expect(mockRpc).toHaveBeenCalledWith('postos_proximos', {
      p_lat: -15.6,
      p_lng: -56.1,
      raio_km: 10,
      limite: 30,
    });
    expect(r.map((p) => [p.id, p.fonte])).toEqual([
      ['anp/1', 'anp'],
      ['node/9', 'osm'],
    ]);
  });

  it('sem a função no servidor devolve null, e carregarPostosDaArea cai em pontos_na_area só de postos', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'function postos_proximos does not exist' },
    });
    mockRpc.mockResolvedValueOnce({
      data: [{ id: 'node/1', tipo: 'posto', nome: 'Posto', lon: -56, lat: -15.6, extras: null }],
      error: null,
    });
    const r = await carregarPostosDaArea(area);
    expect(mockRpc.mock.calls[0]![0]).toBe('postos_proximos');
    expect(mockRpc.mock.calls[1]![0]).toBe('pontos_na_area');
    expect(mockRpc.mock.calls[1]![1]).toMatchObject({ tipos: ['posto'] });
    expect(r.map((p) => p.id)).toEqual(['node/1']);
  });

  it('postos_proximos vazio (sucesso) não cai no fallback', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    await expect(carregarPostosDaArea(area)).resolves.toEqual([]);
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it('sem cliente ou com falha de rede, carregarPostosPerto devolve null', async () => {
    mockRpc.mockRejectedValue(new Error('rede'));
    await expect(carregarPostosPerto({ lat: 0, lng: 0 })).resolves.toBeNull();
    mockCliente = null;
    await expect(carregarPostosPerto({ lat: 0, lng: 0 })).resolves.toBeNull();
  });
});
