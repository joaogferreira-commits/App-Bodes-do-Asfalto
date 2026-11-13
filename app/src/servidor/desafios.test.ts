import type { Desafio } from '@/dados/desafios';

import {
  carregarRanking,
  codigoDoErro,
  criarDesafioServidor,
  decidirDesafioServidor,
  definirForaDoRanking,
  desafiosParaAprovar,
  linhaParaDesafio,
  listarDesafios,
  registrarProgressoServidor,
  sincronizarKm,
} from './desafios';

jest.mock('./supabase', () => ({
  get supabase() {
    return mockCliente;
  },
}));

const mockRpc = jest.fn();
const mockLimit = jest.fn();
let mockCliente: object | null;

beforeEach(() => {
  mockRpc.mockReset();
  mockLimit.mockReset();
  mockCliente = {
    rpc: mockRpc,
    from: () => ({ select: () => ({ order: () => ({ limit: mockLimit }) }) }),
  };
});

const linha = {
  id: 'd1',
  criador: 'u1',
  titulo: 'Rodar 500 km',
  modalidade: 'km' as const,
  meta: 500,
  xp: 250,
  tipo: 'membro' as const,
  status: 'aprovado' as const,
  inicio: '2026-11-01',
  fim: '2026-12-01',
  dias: 30,
  participantes: 4,
  perfis: { nome: 'Zé', apelido: 'Zezão' },
  capitulos: [{ nome: 'Cuiabá' }],
  desafio_capitulos: [],
  participacoes: [{ km_feitos: 120.5, concluido_em: null }],
};

describe('leitura', () => {
  it('traduz a linha do banco: XP do servidor, origem, situação e meu progresso', () => {
    const d = linhaParaDesafio(linha, Date.parse('2026-11-13'));
    expect(d).toMatchObject({
      origem: 'irmao',
      situacao: 'ativo',
      xpServidor: 250,
      kmFeitos: 120.5,
      participo: true,
      concluido: false,
      criador: 'Zezão',
      capitulos: ['Cuiabá'],
    });
    expect(linhaParaDesafio(linha, Date.parse('2027-02-01')).situacao).toBe('encerrado');
    expect(linhaParaDesafio({ ...linha, status: 'pendente', fim: null }).situacao).toBe('aguardando');
    expect(linhaParaDesafio({ ...linha, status: 'recusado' }).situacao).toBe('recusado');
    expect(linhaParaDesafio({ ...linha, tipo: 'capitulos' }).origem).toBe('capitulos');
  });

  it('lista vazia se o servidor falha ou não existe', async () => {
    mockLimit.mockResolvedValue({ data: null, error: { message: 'x' } });
    expect(await listarDesafios()).toEqual([]);
    mockLimit.mockRejectedValue(new Error('rede'));
    expect(await listarDesafios()).toEqual([]);
    mockCliente = null;
    expect(await listarDesafios()).toEqual([]);
  });

  it('para aprovar: só pendentes de outros irmãos', async () => {
    mockLimit.mockResolvedValue({
      data: [
        { ...linha, id: 'a', status: 'pendente', criador: 'u2' },
        { ...linha, id: 'b', status: 'pendente', criador: 'eu' },
        { ...linha, id: 'c', status: 'aprovado', criador: 'u2' },
      ],
      error: null,
    });
    const l = await desafiosParaAprovar('eu');
    expect(l.map((d) => d.id)).toEqual(['a']);
  });
});

describe('chamadas', () => {
  it('criar manda os parâmetros e devolve o id; a regra do mês vira código', async () => {
    mockRpc.mockResolvedValueOnce({ data: 'novo', error: null });
    const r = await criarDesafioServidor({ titulo: 'Rodar 500 km', modalidade: 'km', meta: 500, dias: 30 });
    expect(r).toEqual({ ok: true, valor: 'novo' });
    expect(mockRpc).toHaveBeenCalledWith('criar_desafio', {
      p_titulo: 'Rodar 500 km',
      p_descricao: '',
      p_modalidade: 'km',
      p_meta: 500,
      p_dias: 30,
    });
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'um_por_mes' } });
    expect(await criarDesafioServidor({ titulo: 'Outro', modalidade: 'km', meta: 5, dias: 3 })).toEqual({
      ok: false,
      erro: 'um_por_mes',
    });
  });

  it('decidir e registrar progresso chamam as funções do banco', async () => {
    mockRpc.mockResolvedValue({ data: 'recusado', error: null });
    await decidirDesafioServidor('d1', false, 'Meta irreal');
    expect(mockRpc).toHaveBeenCalledWith('decidir_desafio', {
      p_desafio: 'd1',
      p_aprovar: false,
      p_motivo: 'Meta irreal',
    });
    mockRpc.mockResolvedValue({ data: 12.5, error: null });
    expect(await registrarProgressoServidor('d1', 12.504)).toEqual({ ok: true, valor: 12.5 });
    expect(mockRpc).toHaveBeenLastCalledWith('registrar_progresso', { p_desafio: 'd1', p_km: 12.5 });
  });

  it('erro desconhecido, exceção ou sem servidor viram "rede"', async () => {
    expect(codigoDoErro({ message: 'salto' })).toBe('salto');
    expect(codigoDoErro({ message: 'boom' })).toBe('rede');
    mockRpc.mockRejectedValue(new Error('x'));
    expect(await registrarProgressoServidor('d1', 1)).toEqual({ ok: false, erro: 'rede' });
    mockCliente = null;
    expect(await definirForaDoRanking(true)).toBe(false);
  });
});

describe('antifraude no app (o banco decide; aqui só não insistir)', () => {
  const base = (o: Partial<Desafio> = {}): Desafio => ({
    ...linhaParaDesafio(linha, Date.parse('2026-11-13')),
    ...o,
  });

  it('envia só o avanço desde o marcador e avança o marcador', async () => {
    mockRpc.mockResolvedValue({ data: 130, error: null });
    const m = await sincronizarKm([base()], 110, { d1: 100 });
    expect(mockRpc).toHaveBeenCalledWith('registrar_progresso', { p_desafio: 'd1', p_km: 10 });
    expect(m.d1).toBe(110);
  });

  it('quebra saltos em no máximo 200 km por chamada', async () => {
    mockRpc.mockResolvedValue({ data: 1, error: null });
    const m = await sincronizarKm([base()], 700, { d1: 0 });
    expect(mockRpc).toHaveBeenCalledWith('registrar_progresso', { p_desafio: 'd1', p_km: 200 });
    expect(m.d1).toBe(200);
  });

  it('salto recusado pelo servidor é descartado; falha de rede mantém o marcador', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'salto' } });
    expect((await sincronizarKm([base()], 50, { d1: 0 })).d1).toBe(50);
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'timeout' } });
    expect((await sincronizarKm([base()], 50, { d1: 0 })).d1).toBe(0);
  });

  it('ignora avanço pequeno, concluídos, quem não participa e desafios que não são de km', async () => {
    mockRpc.mockClear();
    await sincronizarKm([base()], 100.2, { d1: 100 });
    await sincronizarKm([base({ concluido: true })], 300, { d1: 100 });
    await sincronizarKm([base({ participo: false })], 300, { d1: 100 });
    await sincronizarKm([base({ tipo: 'sedes' })], 300, { d1: 100 });
    expect(mockRpc).not.toHaveBeenCalled();
    expect((await sincronizarKm([base()], 77, {})).d1).toBe(77);
  });
});

describe('ranking', () => {
  it('traduz as linhas e marca a minha; falha vira lista vazia', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        { posicao: '1', usuario_id: 'u2', nome: 'Outro', apelido: null, xp: '900' },
        { posicao: '2', usuario_id: 'eu', nome: 'Eu', apelido: 'Bravo', xp: 250 },
      ],
      error: null,
    });
    const r = await carregarRanking('cap1', 'mes', 'eu');
    expect(mockRpc).toHaveBeenCalledWith('ranking', { p_capitulo: 'cap1', p_periodo: 'mes' });
    expect(r.map((l) => [l.posicao, l.xp, l.eu])).toEqual([
      [1, 900, false],
      [2, 250, true],
    ]);
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'x' } });
    expect(await carregarRanking(null, 'sempre', 'eu')).toEqual([]);
  });

  it('sair do ranking chama a função do banco', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    expect(await definirForaDoRanking(true)).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('definir_fora_do_ranking', { p_fora: true });
  });
});
