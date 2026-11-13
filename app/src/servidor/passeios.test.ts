import {
  criarPasseio,
  linhaParaPasseio,
  listarPasseios,
  montarData,
  podeCriarPasseio,
  responderPasseio,
} from './passeios';

jest.mock('./supabase', () => ({
  get supabase() {
    return mockCliente;
  },
}));

type Resultado = { data?: unknown; error?: unknown };
let mockCliente: object | null;
let resultados: Record<string, Resultado[]>;
const chamadas: { tabela: string; op: string; args: unknown[] }[] = [];

/** Cadeia do Supabase: cada método devolve a cadeia; ao aguardar, entrega o próximo resultado da tabela. */
function cadeia(tabela: string, op = 'select') {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'order', 'limit', 'eq', 'gt'])
    c[m] = (...a: unknown[]) => (chamadas.push({ tabela, op: m, args: a }), c);
  c.maybeSingle = async () => (resultados[tabela + ':perfil'] ?? [{ data: null }])[0];
  c.then = (res: (v: Resultado) => unknown, rej?: (e: unknown) => unknown) =>
    Promise.resolve(
      (resultados[tabela] ?? [{ data: [], error: null }]).shift() ?? { data: [], error: null },
    ).then(res, rej);
  void op;
  return c;
}

beforeEach(() => {
  chamadas.length = 0;
  resultados = {};
  mockCliente = {
    auth: { getUser: async () => ({ data: { user: { id: 'eu' } } }) },
    from: (tabela: string) => ({
      select: (...a: unknown[]) => {
        chamadas.push({ tabela, op: 'select', args: a });
        return cadeia(tabela);
      },
      insert: (v: unknown) => {
        chamadas.push({ tabela, op: 'insert', args: [v] });
        return Promise.resolve((resultados[tabela + ':insert'] ?? [{ error: null }])[0]);
      },
      update: (v: unknown) => {
        chamadas.push({ tabela, op: 'update', args: [v] });
        return cadeia(tabela + ':update', 'update');
      },
      delete: () => {
        chamadas.push({ tabela, op: 'delete', args: [] });
        return cadeia(tabela + ':delete', 'delete');
      },
    }),
  };
});

const linha = {
  id: 'p1',
  titulo: 'Passeio à Chapada',
  descricao: 'Café na sede',
  data: new Date(2026, 10, 22, 6, 30).toISOString(),
  ponto_encontro: 'Sede Cuiabá',
  rota: { destino: 'Chapada', km: 150 },
  capitulos: { nome: 'Cuiabá' },
  perfis: { nome: 'Diretor', papel: 'diretoria_capitulo' },
  presencas: [
    { usuario_id: 'eu', status: 'vou', perfis: { nome: 'Eu' } },
    { usuario_id: 'z', status: 'talvez', perfis: { nome: 'Zé' } },
  ],
};

describe('papéis que criam passeio', () => {
  it('só diretoria do capítulo, diretoria geral e admin', () => {
    expect(podeCriarPasseio('diretoria_capitulo')).toBe(true);
    expect(podeCriarPasseio('diretoria_geral')).toBe(true);
    expect(podeCriarPasseio('admin')).toBe(true);
    expect(podeCriarPasseio('membro')).toBe(false);
    expect(podeCriarPasseio('moderador')).toBe(false);
    expect(podeCriarPasseio(undefined)).toBe(false);
  });
});

describe('listar passeios', () => {
  it('converte a linha do banco: oficial, contagens e a minha presença', () => {
    const p = linhaParaPasseio(linha, 'eu', new Date(2026, 10, 1).getTime());
    expect(p).toMatchObject({
      id: 'p1',
      capitulo: 'Cuiabá',
      oficial: true,
      saida: 'Sede Cuiabá',
      destino: 'Chapada',
      km: 150,
      vou: 1,
      talvez: 1,
      confirmados: ['Eu'],
      quando: 'proximos',
      servidor: true,
      minhaPresenca: 'vou',
      hora: '6h30',
    });
  });

  it('passeio passado vai para "passados" e o de irmão comum não é oficial', () => {
    const p = linhaParaPasseio(
      { ...linha, perfis: { nome: 'Z', papel: 'membro' } },
      null,
      new Date(2026, 11, 30).getTime(),
    );
    expect(p.quando).toBe('passados');
    expect(p.oficial).toBe(false);
    expect(p.minhaPresenca).toBeNull();
  });

  it('próximos primeiro; erro ou sem servidor vira lista vazia', async () => {
    const antigo = { ...linha, id: 'p0', data: new Date(2026, 9, 1).toISOString() };
    resultados.passeios = [{ data: [antigo, linha], error: null }];
    const l = await listarPasseios(new Date(2026, 10, 1).getTime());
    expect(l.map((p) => p.id)).toEqual(['p1', 'p0']);
    resultados.passeios = [{ data: null, error: { message: 'x' } }];
    expect(await listarPasseios()).toEqual([]);
    mockCliente = null;
    expect(await listarPasseios()).toEqual([]);
  });
});

describe('criar passeio', () => {
  const data = new Date(2026, 10, 22, 6, 30);
  it('grava no capítulo do meu perfil', async () => {
    resultados['perfis:perfil'] = [{ data: { capitulo_id: 'cap1' } }];
    expect(await criarPasseio({ titulo: ' Chapada ', data, pontoEncontro: 'Sede', destino: 'Mirante' })).toBe(
      true,
    );
    const ins = chamadas.find((c) => c.op === 'insert')!;
    expect(ins.tabela).toBe('passeios');
    expect(ins.args[0]).toMatchObject({
      capitulo_id: 'cap1',
      criador: 'eu',
      titulo: 'Chapada',
      ponto_encontro: 'Sede',
      rota: { destino: 'Mirante' },
    });
  });
  it('a RLS recusando (não é diretoria) devolve false', async () => {
    resultados['perfis:perfil'] = [{ data: { capitulo_id: 'cap1' } }];
    resultados['passeios:insert'] = [{ error: { code: '42501' } }];
    expect(await criarPasseio({ titulo: 'Chapada', data })).toBe(false);
  });
  it('sem capítulo no perfil não tenta gravar', async () => {
    expect(await criarPasseio({ titulo: 'Chapada', data })).toBe(false);
    expect(chamadas.some((c) => c.op === 'insert')).toBe(false);
  });
});

describe('montarData', () => {
  const agora = new Date(2026, 10, 1).getTime();
  it('aceita dd/mm/aaaa e hh:mm ou 6h30', () => {
    expect(montarData('22/11/2026', '6:30', agora)).toEqual(new Date(2026, 10, 22, 6, 30));
    expect(montarData('22/11/2026', '19h30', agora)).toEqual(new Date(2026, 10, 22, 19, 30));
    expect(montarData('22/11/2026', '7h', agora)).toEqual(new Date(2026, 10, 22, 7, 0));
  });
  it('recusa data inexistente, formato errado e passado', () => {
    expect(montarData('31/02/2026', '6:30', agora)).toBeNull();
    expect(montarData('22-11-2026', '6:30', agora)).toBeNull();
    expect(montarData('22/11/2026', '25:00', agora)).toBeNull();
    expect(montarData('22/10/2026', '6:30', agora)).toBeNull();
  });
});

describe('Vou / Talvez', () => {
  it('atualiza a presença que já existe (só a coluna status)', async () => {
    resultados['presencas:update'] = [{ data: [{ passeio_id: 'p1' }], error: null }];
    expect(await responderPasseio('p1', 'talvez')).toBe(true);
    expect(chamadas.find((c) => c.op === 'update')!.args[0]).toEqual({ status: 'talvez' });
    expect(chamadas.some((c) => c.op === 'insert')).toBe(false);
  });
  it('sem presença anterior, insere', async () => {
    resultados['presencas:update'] = [{ data: [], error: null }];
    expect(await responderPasseio('p1', 'vou')).toBe(true);
    expect(chamadas.find((c) => c.op === 'insert')!.args[0]).toEqual({
      passeio_id: 'p1',
      usuario_id: 'eu',
      status: 'vou',
    });
  });
  it('desmarcar apaga a presença', async () => {
    expect(await responderPasseio('p1', null)).toBe(true);
    expect(chamadas.some((c) => c.tabela === 'presencas' && c.op === 'delete')).toBe(true);
  });
  it('erro do banco devolve false', async () => {
    resultados['presencas:update'] = [{ data: null, error: { message: 'x' } }];
    expect(await responderPasseio('p1', 'vou')).toBe(false);
  });
});
