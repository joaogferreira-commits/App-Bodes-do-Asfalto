import { buscarEnderecos, buscarNoClube, normalizar } from './buscar';

describe('busca do mapa', () => {
  it('ignora acentos e maiúsculas', () => {
    expect(normalizar('Ágape Cuiabá')).toBe('agape cuiaba');
  });

  it('acha lugares do clube pelo nome, do mais perto ao mais longe', () => {
    const r = buscarNoClube('posto', { lat: -15.57, lng: -56.07 });
    expect(r.length).toBeGreaterThanOrEqual(2);
    expect(r.map((x) => x.nome)).toContain('Posto Trevo');
    const d = r.map((x) => x.distanciaKm!);
    expect([...d].sort((a, b) => a - b)).toEqual(d);
    expect(r.every((x) => x.origem === 'clube')).toBe(true);
  });

  it('não busca com menos de 2 letras', () => {
    expect(buscarNoClube('p')).toEqual([]);
  });

  it('busca endereços no Photon perto de onde o irmão está', async () => {
    const buscar = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            geometry: { coordinates: [-56.1, -15.6] },
            properties: { osm_id: 1, name: 'Praça Alencastro', city: 'Cuiabá', state: 'Mato Grosso' },
          },
          {
            geometry: { coordinates: [-56.09, -15.59] },
            properties: { osm_id: 2, street: 'Avenida Getúlio Vargas', housenumber: '100', city: 'Cuiabá' },
          },
          { properties: { name: 'sem coordenada' } },
        ],
      }),
    });
    const r = await buscarEnderecos('praça', { lat: -15.6, lng: -56.1 }, buscar);
    expect(buscar.mock.calls[0][0]).toContain('lat=-15.6000');
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({
      nome: 'Praça Alencastro',
      detalhe: 'Cuiabá · Mato Grosso',
      origem: 'endereco',
    });
    expect(r[1]!.nome).toBe('Avenida Getúlio Vargas, 100');
  });

  it('erro do servidor vira lista vazia', async () => {
    expect(await buscarEnderecos('praça', null, jest.fn().mockResolvedValue({ ok: false }))).toEqual([]);
  });
});
