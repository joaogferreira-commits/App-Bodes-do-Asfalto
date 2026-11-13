import {
  atualizarPosicaoSos,
  encerrarSosServidor,
  iniciarSosServidor,
  lerSos,
  linkLigar,
  linkRotaAte,
} from './sos';

jest.mock('./supabase', () => ({
  get supabase() {
    return mockCliente;
  },
}));

const mockRpc = jest.fn();
const mockMaybe = jest.fn();
const mockEq = jest.fn(() => ({ maybeSingle: mockMaybe }));
let mockCliente: object | null;

beforeEach(() => {
  mockRpc.mockReset();
  mockMaybe.mockReset();
  mockCliente = { rpc: mockRpc, from: () => ({ select: () => ({ eq: mockEq }) }) };
});

const pos = { lat: -15.6, lng: -56.1 };

describe('iniciar', () => {
  it('chama iniciar_sos com tipo, mensagem e posição exata e devolve o id', async () => {
    mockRpc.mockResolvedValue({ data: 'abc', error: null });
    expect(await iniciarSosServidor({ tipo: 'pane', mensagem: 'Moto parou', posicao: pos })).toBe('abc');
    expect(mockRpc).toHaveBeenCalledWith('iniciar_sos', {
      p_tipo: 'pane',
      p_mensagem: 'Moto parou',
      p_lat: -15.6,
      p_lng: -56.1,
    });
  });
  it('sem tipo manda texto vazio', async () => {
    mockRpc.mockResolvedValue({ data: 'abc', error: null });
    await iniciarSosServidor({ tipo: null, posicao: pos });
    expect(mockRpc).toHaveBeenCalledWith(
      'iniciar_sos',
      expect.objectContaining({ p_tipo: '', p_mensagem: '' }),
    );
  });
  it('erro, exceção ou sem servidor viram null', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'x' } });
    expect(await iniciarSosServidor({ tipo: null, posicao: pos })).toBeNull();
    mockRpc.mockRejectedValue(new Error('rede'));
    expect(await iniciarSosServidor({ tipo: null, posicao: pos })).toBeNull();
    mockCliente = null;
    expect(await iniciarSosServidor({ tipo: null, posicao: pos })).toBeNull();
  });
});

describe('atualizar e encerrar', () => {
  it('atualiza a posição e devolve se ainda está ativo', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    expect(await atualizarPosicaoSos('abc', pos)).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('atualizar_posicao_sos', {
      p_id: 'abc',
      p_lat: -15.6,
      p_lng: -56.1,
    });
    mockRpc.mockResolvedValue({ data: false, error: null });
    expect(await atualizarPosicaoSos('abc', pos)).toBe(false);
  });
  it('encerra', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    expect(await encerrarSosServidor('abc')).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('encerrar_sos', { p_id: 'abc' });
    mockRpc.mockRejectedValue(new Error('rede'));
    expect(await encerrarSosServidor('abc')).toBe(false);
  });
});

describe('ler', () => {
  it('converte a linha, preferindo o apelido', async () => {
    mockMaybe.mockResolvedValue({
      data: {
        id: 'abc',
        tipo: 'pane',
        mensagem: null,
        telefone: '65 99999-0000',
        lat: -15.6,
        lng: -56.1,
        atualizado_em: '2026-11-13T10:00:00Z',
        encerrado_em: null,
        perfis: { nome: 'Zé da Silva', apelido: 'Zezão' },
      },
      error: null,
    });
    const s = await lerSos('abc');
    expect(mockEq).toHaveBeenCalledWith('id', 'abc');
    expect(s).toMatchObject({ quem: 'Zezão', tipo: 'pane', posicao: pos, encerrado: false, mensagem: '' });
  });
  it('sem acesso (RLS) ou erro devolve null', async () => {
    mockMaybe.mockResolvedValue({ data: null, error: null });
    expect(await lerSos('abc')).toBeNull();
    mockMaybe.mockResolvedValue({ data: null, error: { message: 'x' } });
    expect(await lerSos('abc')).toBeNull();
  });
});

it('monta os links de rota e de ligação', () => {
  expect(linkRotaAte(pos)).toBe(
    'https://www.google.com/maps/dir/?api=1&destination=-15.600000,-56.100000&travelmode=driving',
  );
  expect(linkLigar('(65) 99999-0000')).toBe('tel:65999990000');
});
