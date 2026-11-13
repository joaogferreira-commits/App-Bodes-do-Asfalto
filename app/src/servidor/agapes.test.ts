import {
  criarAgape,
  inicioDoHorario,
  linhaParaAgape,
  listarAgapes,
  responderAgape,
  textoFalta,
} from './agapes';

jest.mock('./supabase', () => ({
  get supabase() {
    return mockCliente;
  },
}));

let mockCliente: object | null;
let listaResultado: { data: unknown; error: unknown };
let atualizaResultado: { data: unknown; error: unknown };
let insercao: { error: unknown };
const inseridos: { tabela: string; valor: unknown }[] = [];

beforeEach(() => {
  inseridos.length = 0;
  listaResultado = { data: [], error: null };
  atualizaResultado = { data: [{ agape_id: 'a' }], error: null };
  insercao = { error: null };
  const lista: Record<string, unknown> = {};
  for (const m of ['gt', 'order', 'limit']) lista[m] = () => lista;
  lista.then = (res: (v: unknown) => unknown) => Promise.resolve(listaResultado).then(res);
  const atualiza: Record<string, unknown> = {};
  for (const m of ['eq', 'select']) atualiza[m] = () => atualiza;
  atualiza.then = (res: (v: unknown) => unknown) => Promise.resolve(atualizaResultado).then(res);
  mockCliente = {
    auth: { getUser: async () => ({ data: { user: { id: 'eu' } } }) },
    from: (tabela: string) => ({
      select: () =>
        tabela === 'perfis'
          ? { eq: () => ({ maybeSingle: async () => ({ data: { capitulo_id: 'cap1' } }) }) }
          : lista,
      insert: (valor: unknown) => {
        inseridos.push({ tabela, valor });
        return Promise.resolve(insercao);
      },
      update: () => atualiza,
    }),
  };
});

const AGORA = new Date(2026, 10, 13, 18, 0).getTime();

describe('listar Ágapes', () => {
  it('converte a linha: horário, quanto falta e quem vai', () => {
    const a = linhaParaAgape(
      {
        id: 'a1',
        local: 'Posto Trevo',
        texto: null,
        lat: -15.5,
        lng: -56,
        comeca_em: new Date(2026, 10, 13, 19, 20).toISOString(),
        criador: 'z',
        perfis: { nome: 'Zé' },
        presencas_agape: [
          { status: 'vou', perfis: { nome: 'Zé' } },
          { status: 'nao_vou', perfis: { nome: 'Edu' } },
        ],
      },
      AGORA,
    );
    expect(a).toMatchObject({
      id: 'a1',
      horario: '19h20',
      comecaEm: '1h20',
      organizador: 'Zé',
      vao: ['Zé'],
      texto: '',
    });
  });

  it('devolve a lista do banco', async () => {
    listaResultado = {
      data: [
        {
          id: 'a1',
          local: 'X',
          texto: 't',
          lat: 1,
          lng: 2,
          comeca_em: new Date(AGORA).toISOString(),
          criador: 'z',
          perfis: null,
          presencas_agape: null,
        },
      ],
      error: null,
    };
    expect((await listarAgapes(AGORA)).map((a) => a.id)).toEqual(['a1']);
  });

  it('tabela ausente (migration não aplicada), erro ou sem servidor: lista vazia, sem quebrar', async () => {
    listaResultado = { data: null, error: { code: '42P01', message: 'relation "agapes" does not exist' } };
    expect(await listarAgapes(AGORA)).toEqual([]);
    mockCliente = {
      from: () => {
        throw new Error('boom');
      },
      auth: { getUser: async () => ({ data: { user: null } }) },
    };
    expect(await listarAgapes(AGORA)).toEqual([]);
    mockCliente = null;
    expect(await listarAgapes(AGORA)).toEqual([]);
  });
});

describe('horários', () => {
  it('relativos e de relógio', () => {
    expect(inicioDoHorario('30 min', AGORA).getTime()).toBe(AGORA + 30 * 60_000);
    expect(inicioDoHorario('2 h', AGORA).getTime()).toBe(AGORA + 120 * 60_000);
    expect(inicioDoHorario('20h', AGORA)).toEqual(new Date(2026, 10, 13, 20, 0));
    expect(inicioDoHorario('17h', AGORA)).toEqual(new Date(2026, 10, 14, 17, 0));
  });
  it('texto de quanto falta', () => {
    expect(textoFalta(-5)).toBe('0 min');
    expect(textoFalta(45)).toBe('45 min');
    expect(textoFalta(80)).toBe('1h20');
    expect(textoFalta(120)).toBe('2h');
  });
});

describe('criar e responder', () => {
  it('cria com capítulo, início e fim de 3 h', async () => {
    expect(
      await criarAgape({ local: ' Posto Trevo ', texto: '', horario: '1 h', lat: -15.5, lng: -56 }, AGORA),
    ).toBe(true);
    const v = inseridos[0]!.valor as Record<string, unknown>;
    expect(inseridos[0]!.tabela).toBe('agapes');
    expect(v).toMatchObject({ criador: 'eu', capitulo_id: 'cap1', local: 'Posto Trevo', texto: null });
    expect(new Date(v.termina_em as string).getTime() - new Date(v.comeca_em as string).getTime()).toBe(
      180 * 60_000,
    );
  });
  it('devolve false se o banco recusar', async () => {
    insercao = { error: { code: '42P01' } };
    expect(await criarAgape({ local: 'X', texto: '', horario: '1 h', lat: 0, lng: 0 }, AGORA)).toBe(false);
  });
  it('Vou atualiza a presença existente; sem linha, insere', async () => {
    expect(await responderAgape('a', true)).toBe(true);
    expect(inseridos).toHaveLength(0);
    atualizaResultado = { data: [], error: null };
    expect(await responderAgape('a', false)).toBe(true);
    expect(inseridos[0]).toEqual({
      tabela: 'presencas_agape',
      valor: { agape_id: 'a', usuario_id: 'eu', status: 'nao_vou' },
    });
  });
});
