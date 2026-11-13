import {
  apagarLoja,
  arredondar,
  criarLoja,
  decidirLoja,
  editarLoja,
  lojaParaLugar,
  lojasPendentes,
  paraLoja,
} from './lojas';
import {
  aniversariantes,
  aniversarioValido,
  diasAteAniversario,
  listarMembros,
  meuAniversario,
  salvarAniversario,
  type Membro,
} from './membros';
import {
  criarNegocio,
  dataValida,
  decidirNegocio,
  definirDestaque,
  destaqueVigente,
  editarNegocio,
  negocioParaLugar,
  negociosPendentes,
  normalizarSite,
  paraGuia,
  paraNegocio,
  subirFotoNegocio,
  urlsDasFotos,
} from './negocios';

jest.mock('./supabase', () => ({
  get supabase() {
    return mockCliente;
  },
}));

const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockUpsert = jest.fn();
const mockEq = jest.fn();
const mockRpc = jest.fn();
const mockUpload = jest.fn();
const mockSigned = jest.fn();
let mockCliente: object | null;

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn(async () => ({ arrayBuffer: async () => new ArrayBuffer(4) })) as never;
  mockInsert.mockResolvedValue({ error: null });
  mockUpsert.mockResolvedValue({ error: null });
  mockRpc.mockResolvedValue({ data: [], error: null });
  mockUpload.mockResolvedValue({ error: null });
  mockSigned.mockResolvedValue({ data: [{ path: 'u1/a.jpg', signedUrl: 'https://x/a.jpg' }] });
  mockCliente = {
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    rpc: mockRpc,
    storage: { from: () => ({ upload: mockUpload, createSignedUrls: mockSigned }) },
    from: () => ({
      insert: mockInsert,
      upsert: mockUpsert,
      update: (v: unknown) => {
        mockUpdate(v);
        return { eq: async (...a: unknown[]) => (mockEq(...a), { error: null }) };
      },
      delete: () => {
        mockDelete();
        return { eq: async (...a: unknown[]) => (mockEq(...a), { error: null }) };
      },
      select: () => ({ maybeSingle: async () => ({ data: { dia: 7, mes: 9, visivel: true }, error: null }) }),
    }),
  };
});

const dadosLoja = {
  nome: ' Loja Estrela ',
  oriente: 'Cuiabá',
  potencia: '',
  diasSessao: '2as',
  endereco: '',
  cidade: 'Cuiabá',
  lat: -15.60123,
  lng: -56.09789,
};

describe('lojas', () => {
  it('arredonda a posição a ~1 km', () => {
    expect(arredondar(-15.60123)).toBe(-15.6);
    expect(arredondar(-56.09789)).toBe(-56.1);
  });

  it('cadastra declarando a Loja e como contato o próprio irmão, com posição aproximada', async () => {
    await criarLoja(dadosLoja);
    expect(mockInsert).toHaveBeenCalledWith({
      nome: 'Loja Estrela',
      oriente: 'Cuiabá',
      potencia: null,
      dias_sessao: '2as',
      endereco: null,
      cidade: 'Cuiabá',
      lat: -15.6,
      lng: -56.1,
      irmao_contato: 'u1',
      declaracao: true,
    });
  });

  it('sem posição, grava lat e lng nulos; edita e apaga pelo id', async () => {
    await editarLoja('l1', { ...dadosLoja, lat: null, lng: null });
    expect(mockUpdate.mock.calls[0][0]).toMatchObject({ lat: null, lng: null });
    expect(mockEq).toHaveBeenCalledWith('id', 'l1');
    await apagarLoja('l2');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', 'l2');
  });

  it('o contato logado é "meu"; o nome do contato vem com apelido', () => {
    const l = paraLoja(
      {
        id: 'l1',
        nome: 'Estrela',
        oriente: null,
        potencia: null,
        dias_sessao: null,
        endereco: null,
        cidade: 'Cuiabá',
        lat: -15.6,
        lng: -56.1,
        irmao_contato: 'u1',
        status: 'aprovada',
        motivo_recusa: null,
        contato: [{ nome: 'Zé', apelido: 'Zezão' }],
      },
      'u1',
    );
    expect(l.meu).toBe(true);
    expect(l.contatoNome).toBe('Zé “Zezão”');
    expect(
      paraLoja(
        {
          ...{
            id: 'x',
            nome: 'n',
            oriente: null,
            potencia: null,
            dias_sessao: null,
            endereco: null,
            cidade: 'c',
            lat: null,
            lng: null,
            irmao_contato: 'u2',
            status: 'pendente' as const,
            motivo_recusa: null,
          },
        },
        'u1',
      ).meu,
    ).toBe(false);
  });

  it('só Loja aprovada com posição vira pino "loja"', () => {
    const base = paraLoja(
      {
        id: 'l1',
        nome: 'Estrela',
        oriente: null,
        potencia: null,
        dias_sessao: '2as',
        endereco: null,
        cidade: 'c',
        lat: -15.6,
        lng: -56.1,
        irmao_contato: null,
        status: 'aprovada',
        motivo_recusa: null,
      },
      null,
    );
    expect(lojaParaLugar(base)).toMatchObject({
      id: 'loja:l1',
      tipo: 'loja',
      lojaId: 'l1',
      lat: -15.6,
      lng: -56.1,
      detalhe: '2as',
    });
    expect(lojaParaLugar({ ...base, status: 'pendente' })).toBeNull();
    expect(lojaParaLugar({ ...base, lat: null, lng: null })).toBeNull();
  });

  it('moderação: fila e decisão pelas funções do banco', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [{ id: 'l1', nome: 'E', cidade: 'C', autor: 'Zé', oriente: null }],
      error: null,
    });
    expect((await lojasPendentes())[0]).toMatchObject({ id: 'l1', autor: 'Zé', oriente: '' });
    await decidirLoja('l1', false, 'sem dados');
    expect(mockRpc).toHaveBeenLastCalledWith('decidir_loja', {
      p_id: 'l1',
      p_aprovar: false,
      p_motivo: 'sem dados',
    });
  });

  it('propaga o erro do banco', async () => {
    mockInsert.mockResolvedValueOnce({ error: new Error('limite_diario') });
    await expect(criarLoja(dadosLoja)).rejects.toThrow('limite_diario');
  });
});

const dadosNegocio = {
  nome: 'Oficina do Bode',
  categoria: 'oficina' as const,
  descricao: '',
  cidade: 'Cuiabá',
  beneficio: ' 10% na revisão ',
  telefone: '',
  whatsapp: '65999990000',
  site: '',
  lat: -15.62,
  lng: -56.06,
  fotos: ['u1/a.jpg', 'u1/b.jpg', 'u1/c.jpg', 'u1/d.jpg'],
};

describe('negócios', () => {
  it('cadastra com benefício, no máximo 3 fotos, sem destaque', async () => {
    await criarNegocio(dadosNegocio);
    const corpo = mockInsert.mock.calls[0][0];
    expect(corpo).toMatchObject({
      beneficio_irmaos: '10% na revisão',
      whatsapp: '65999990000',
      telefone: null,
    });
    expect(corpo.fotos).toHaveLength(3);
    expect(corpo).not.toHaveProperty('destaque_ate');
    expect(corpo).not.toHaveProperty('status');
    expect(corpo).not.toHaveProperty('dono');
    await editarNegocio('n1', dadosNegocio);
    expect(mockEq).toHaveBeenCalledWith('id', 'n1');
  });

  it('envia a foto para a pasta do irmão e pede links temporários', async () => {
    const caminho = await subirFotoNegocio('file:///foto.jpg');
    expect(caminho.startsWith('u1/')).toBe(true);
    expect(mockUpload).toHaveBeenCalledWith(caminho, expect.anything(), { contentType: 'image/jpeg' });
    expect(await urlsDasFotos(['u1/a.jpg'])).toEqual({ 'u1/a.jpg': 'https://x/a.jpg' });
    expect(await urlsDasFotos([])).toEqual({});
  });

  it('destaque vale até o fim do dia; data precisa ser real', () => {
    expect(destaqueVigente('2026-11-13', '2026-11-13')).toBe(true);
    expect(destaqueVigente('2026-11-12', '2026-11-13')).toBe(false);
    expect(destaqueVigente(null)).toBe(false);
    expect(dataValida('2026-02-31')).toBe(false);
    expect(dataValida('2026-12-31')).toBe(true);
    expect(dataValida('31/12/2026')).toBe(false);
  });

  it('só o admin (função do banco) define ou tira o destaque; data inválida nem chama o banco', async () => {
    await definirDestaque('n1', '2026-12-31');
    expect(mockRpc).toHaveBeenLastCalledWith('definir_destaque', { p_id: 'n1', p_ate: '2026-12-31' });
    await definirDestaque('n1', null);
    expect(mockRpc).toHaveBeenLastCalledWith('definir_destaque', { p_id: 'n1', p_ate: null });
    mockRpc.mockClear();
    await expect(definirDestaque('n1', '2026-13-01')).rejects.toThrow();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('site só http(s)', () => {
    expect(normalizarSite('')).toBe('');
    expect(normalizarSite('loja.com.br')).toBe('https://loja.com.br');
    expect(normalizarSite('http://a.com')).toBe('http://a.com');
    expect(normalizarSite('javascript:alert(1)')).toBeNull();
    expect(normalizarSite('a b')).toBeNull();
  });

  const linha = {
    id: 'n1',
    dono: 'u1',
    nome: 'Oficina',
    categoria: 'comida' as const,
    descricao: null,
    cidade: 'Cuiabá',
    lat: -15.6,
    lng: -56.1,
    telefone: null,
    whatsapp: null,
    site: null,
    beneficio_irmaos: 'Café grátis',
    fotos: ['u1/a.jpg', 'u1/falha.jpg'],
    destaque_ate: '2026-12-31',
    status: 'aprovado' as const,
    motivo_recusa: null,
    dono_perfil: { nome: 'Zé' },
  };

  it('converte para o Guia: destaque vira plano parceiro e foto só com link', () => {
    const g = paraGuia(paraNegocio(linha, 'u1'), { 'u1/a.jpg': 'https://x/a.jpg' });
    expect(g).toMatchObject({
      plano: 'parceiro',
      validade: '2026-12-31',
      dono: 'Zé',
      meu: true,
      servidor: true,
    });
    expect(g.fotos).toEqual([{ uri: 'https://x/a.jpg' }]);
    expect(paraGuia(paraNegocio({ ...linha, destaque_ate: null }, 'u2'), {})).toMatchObject({
      plano: 'gratis',
      meu: false,
    });
  });

  it('pino do mapa: comida vira restaurante; pendente ou sem posição não aparece', () => {
    const n = paraNegocio(linha, null);
    expect(negocioParaLugar(n)).toMatchObject({
      id: 'negocio:n1',
      tipo: 'restaurante',
      negocioId: 'n1',
      detalhe: 'Café grátis',
    });
    expect(negocioParaLugar({ ...n, categoria: 'pouso' })?.tipo).toBe('hospedagem');
    expect(negocioParaLugar({ ...n, status: 'pendente' })).toBeNull();
    expect(negocioParaLugar({ ...n, lat: null, lng: null })).toBeNull();
  });

  it('moderação: fila e decisão', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        { id: 'n1', nome: 'O', categoria: 'oficina', cidade: 'C', dono_nome: 'Zé', beneficio_irmaos: 'b' },
      ],
      error: null,
    });
    expect((await negociosPendentes())[0]).toMatchObject({ donoNome: 'Zé', beneficio: 'b' });
    await decidirNegocio('n1', true);
    expect(mockRpc).toHaveBeenLastCalledWith('decidir_negocio', {
      p_id: 'n1',
      p_aprovar: true,
      p_motivo: null,
    });
  });
});

describe('membros e aniversários', () => {
  it('lista de membros: aniversário só quando o servidor devolve', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        { id: 'a', nome: 'Ana', apelido: null, capitulo: 'Cuiabá', aniversario_dia: 7, aniversario_mes: 9 },
        { id: 'b', nome: 'Beto', apelido: 'B', capitulo: null, aniversario_dia: null, aniversario_mes: null },
      ],
      error: null,
    });
    const l = await listarMembros();
    expect(l[0]!.aniversario).toEqual({ dia: 7, mes: 9 });
    expect(l[1]!).toMatchObject({ aniversario: null, capitulo: '', apelido: 'B' });
  });

  it('valida dia e mês', () => {
    expect(aniversarioValido(29, 2)).toBe(true);
    expect(aniversarioValido(30, 2)).toBe(false);
    expect(aniversarioValido(31, 4)).toBe(false);
    expect(aniversarioValido(31, 12)).toBe(true);
    expect(aniversarioValido(1, 13)).toBe(false);
    expect(aniversarioValido(0, 1)).toBe(false);
  });

  it('salva (escondido por padrão no banco) e recusa data inválida', async () => {
    await salvarAniversario({ dia: 7, mes: 9, visivel: false });
    expect(mockUpsert).toHaveBeenCalledWith({ id: 'u1', dia: 7, mes: 9, visivel: false });
    await expect(salvarAniversario({ dia: 31, mes: 2, visivel: true })).rejects.toThrow();
    expect(await meuAniversario()).toEqual({ dia: 7, mes: 9, visivel: true });
  });

  it('dias até o aniversário, virando o ano e o 29/02', () => {
    const hoje = new Date(2026, 10, 13);
    expect(diasAteAniversario({ dia: 13, mes: 11 }, hoje)).toBe(0);
    expect(diasAteAniversario({ dia: 14, mes: 11 }, hoje)).toBe(1);
    expect(diasAteAniversario({ dia: 12, mes: 11 }, hoje)).toBe(364);
    expect(diasAteAniversario({ dia: 2, mes: 1 }, hoje)).toBe(50);
    expect(diasAteAniversario({ dia: 29, mes: 2 }, hoje)).toBe(107); // 28/02/2027
  });

  it('aniversariantes: só quem mostrou, do mais próximo ao mais distante', () => {
    const m = (id: string, nome: string, a: Membro['aniversario']): Membro => ({
      id,
      nome,
      apelido: '',
      capitulo: '',
      aniversario: a,
    });
    const l = aniversariantes(
      [
        m('1', 'Zeca', { dia: 20, mes: 11 }),
        m('2', 'Ana', null),
        m('3', 'Beto', { dia: 13, mes: 11 }),
        m('4', 'Caio', { dia: 1, mes: 1 }),
      ],
      new Date(2026, 10, 13),
    );
    expect(l.map((x) => x.membro.nome)).toEqual(['Beto', 'Zeca', 'Caio']);
    expect(
      aniversariantes(
        [m('1', 'Zeca', { dia: 20, mes: 11 }), m('4', 'Caio', { dia: 1, mes: 1 })],
        new Date(2026, 10, 13),
        30,
      ).map((x) => x.membro.nome),
    ).toEqual(['Zeca']);
  });
});
