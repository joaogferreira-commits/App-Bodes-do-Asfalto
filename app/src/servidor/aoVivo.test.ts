import { escolherModo, visibilidadePadrao } from '@/estado/visibilidadeMapa';

import {
  devePublicar,
  irmaosNaArea,
  linhaParaIrmao,
  podePublicar,
  publicarPosicao,
  sincronizarVisibilidade,
} from './aoVivo';

jest.mock('./supabase', () => ({
  get supabase() {
    return mockCliente;
  },
}));

const mockUpsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockRpc = jest.fn();
const mockPerfis = jest.fn();
let mockCliente: object | null;

function montar() {
  mockCliente = {
    auth: { getUser: async () => ({ data: { user: { id: 'eu' } } }) },
    rpc: mockRpc,
    from: (tabela: string) =>
      tabela === 'perfis'
        ? { select: () => ({ in: mockPerfis }) }
        : {
            upsert: mockUpsert,
            update: (v: object) => ({ eq: (c: string, id: string) => mockUpdate(v, c, id) }),
            delete: () => ({ eq: (c: string, id: string) => mockDelete(c, id) }),
          },
  };
}

beforeEach(() => {
  [mockUpsert, mockUpdate, mockDelete, mockRpc, mockPerfis].forEach((m) => m.mockReset());
  mockUpsert.mockResolvedValue({ error: null });
  mockUpdate.mockResolvedValue({ error: null });
  mockDelete.mockResolvedValue({ error: null });
  montar();
});

describe('freio de envio', () => {
  const base = { lat: -15.6, lon: -56.1, em: 1_000_000 };
  it('publica a primeira vez', () => expect(devePublicar(null, base)).toBe(true));
  it('não publica parado e antes de 60 s', () =>
    expect(devePublicar(base, { ...base, em: base.em + 30_000 })).toBe(false));
  it('publica depois de 60 s mesmo parado (mantém o sinal vivo)', () =>
    expect(devePublicar(base, { ...base, em: base.em + 60_000 })).toBe(true));
  it('publica ao andar 500 m (cerca de 0,0045 grau)', () => {
    expect(devePublicar(base, { ...base, lat: base.lat + 0.0046, em: base.em + 5_000 })).toBe(true);
    expect(devePublicar(base, { ...base, lat: base.lat + 0.002, em: base.em + 5_000 })).toBe(false);
  });
  it('invisível ou sem permissão não publica', () => {
    expect(podePublicar('invisivel', true)).toBe(false);
    expect(podePublicar('aproximado', false)).toBe(false);
    expect(podePublicar('aproximado', true)).toBe(true);
  });
});

describe('publicar e apagar', () => {
  it('envia ponto, modo e status ao servidor', async () => {
    const ok = await publicarPosicao({ lat: -15.6, lon: -56.1 }, { ...visibilidadePadrao, status: 'cafe' });
    expect(ok).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario_id: 'eu',
        ponto: 'SRID=4326;POINT(-56.1 -15.6)',
        visibilidade: 'aproximado',
        status: 'parado_cafe',
        modo_ate: null,
      }),
      { onConflict: 'usuario_id' },
    );
  });

  it('modo temporário manda o prazo (modo_ate)', async () => {
    const agora = Date.now();
    const e = escolherModo(visibilidadePadrao, 'precisoAmigos', true, agora);
    await publicarPosicao({ lat: 1, lon: 2 }, e, agora);
    const linha = mockUpsert.mock.calls[0]![0] as { visibilidade: string; modo_ate: string };
    expect(linha.visibilidade).toBe('preciso_amigos');
    expect(new Date(linha.modo_ate).getTime()).toBe(e.temporario!.ate);
  });

  it('invisível nunca envia posição', async () => {
    const ok = await publicarPosicao({ lat: 1, lon: 2 }, { ...visibilidadePadrao, modo: 'invisivel' });
    expect(ok).toBe(false);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('escolher invisível apaga a minha posição no servidor', async () => {
    await sincronizarVisibilidade({ ...visibilidadePadrao, modo: 'invisivel' });
    expect(mockDelete).toHaveBeenCalledWith('usuario_id', 'eu');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('outros modos só atualizam modo e status', async () => {
    await sincronizarVisibilidade({ ...visibilidadePadrao, modo: 'cidade', status: 'aberto' });
    expect(mockUpdate).toHaveBeenCalledWith(
      { visibilidade: 'cidade', status: 'aberto_encontro', modo_ate: null },
      'usuario_id',
      'eu',
    );
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('sem servidor devolve falso sem quebrar', async () => {
    mockCliente = null;
    expect(await removerOuFalso()).toBe(false);
  });
});

async function removerOuFalso() {
  return sincronizarVisibilidade({ ...visibilidadePadrao, modo: 'invisivel' });
}

describe('irmãos na área', () => {
  const area = { minLon: -56.3, minLat: -15.8, maxLon: -55.9, maxLat: -15.4 };

  it('chama posicoes_visiveis e junta nome, apelido e capítulo', async () => {
    mockRpc.mockResolvedValue({
      data: [
        { usuario_id: 'a', lat: -15.575, lon: -56.075, precisao: 'aproximado', status: 'parado_cafe' },
        { usuario_id: 'b', lat: -15.6, lon: -56.1, precisao: 'exata', status: 'nao_perturbe' },
        { usuario_id: 'c', lat: -15.6, lon: -56.1, precisao: 'cidade', status: 'na_estrada' },
      ],
      error: null,
    });
    mockPerfis.mockResolvedValue({
      data: [
        { id: 'a', nome: 'Zé Ferreira', apelido: 'Zé', capitulos: { nome: 'Cuiabá' } },
        { id: 'b', nome: 'Edu Prado', apelido: null, capitulos: [{ nome: 'Várzea Grande' }] },
      ],
      error: null,
    });
    const r = await irmaosNaArea(area);
    expect(mockRpc).toHaveBeenCalledWith('posicoes_visiveis', {
      min_lon: -56.3,
      min_lat: -15.8,
      max_lon: -55.9,
      max_lat: -15.4,
    });
    expect(r).toEqual([
      expect.objectContaining({
        id: 'a',
        apelido: 'Zé',
        capitulo: 'Cuiabá',
        status: 'cafe',
        precisao: 'aproximado',
        lng: -56.075,
      }),
      expect.objectContaining({
        id: 'b',
        capitulo: 'Várzea Grande',
        status: 'naoPerturbe',
        precisao: 'exata',
      }),
    ]); // 'c' sem perfil visível fica de fora
  });

  it('falha do servidor vira lista vazia', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'x' } });
    expect(await irmaosNaArea(area)).toEqual([]);
    mockRpc.mockRejectedValue(new Error('rede'));
    expect(await irmaosNaArea(area)).toEqual([]);
  });

  it('descarta coordenada inválida e status desconhecido vira na estrada', () => {
    const perfis = { a: { id: 'a', nome: 'A B', apelido: null, capitulo: null } };
    expect(
      linhaParaIrmao({ usuario_id: 'a', lat: NaN, lon: 1, precisao: 'cidade', status: 'na_estrada' }, perfis),
    ).toBeNull();
    expect(
      linhaParaIrmao({ usuario_id: 'a', lat: 1, lon: 1, precisao: 'cidade', status: 'novo' }, perfis)?.status,
    ).toBe('estrada');
  });
});
