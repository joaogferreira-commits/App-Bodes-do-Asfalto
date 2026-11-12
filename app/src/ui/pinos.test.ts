import { filtros, tiposDoFiltro, pontosColetados } from '@/dados/exemplos';
import { TIPOS_DO_BANCO } from '@/servidor/pontos';

import { caminhosIcones } from './icones';
import { pinos, type TipoPino } from './Pino';

const tipos = Object.keys(pinos) as TipoPino[];

describe('ícones dos pinos do mapa', () => {
  it('cada tipo tem um ícone de traço próprio (nenhum repetido, nenhum traçado igual)', () => {
    const nomes = tipos.map((t) => pinos[t].icone);
    expect(new Set(nomes).size).toBe(tipos.length);
    const tracados = nomes.map((n) => JSON.stringify(caminhosIcones[n]));
    expect(new Set(tracados).size).toBe(tipos.length);
  });

  it('cada tipo tem emblema próprio e o ponto turístico não usa mais cachoeira', () => {
    expect(new Set(tipos.map((t) => pinos[t].imagem)).size).toBe(tipos.length);
    expect(tipos).not.toContain('turistico');
    expect(pinos.atracao.icone).not.toBe(pinos.cachoeira.icone);
    expect(pinos.atracao.imagem).not.toBe(pinos.cachoeira.imagem);
  });

  it('todos os tipos da tabela pontos_osm têm pino', () => {
    for (const t of TIPOS_DO_BANCO) expect(pinos[t]).toBeDefined();
    expect(TIPOS_DO_BANCO).toHaveLength(15);
  });

  it('os pontos do pacote usam tipos que existem; atração urbana não vira cachoeira', () => {
    for (const p of pontosColetados) expect(pinos[p.tipo]).toBeDefined();
    const atracoes = pontosColetados.filter((p) => p.tipo === 'atracao');
    expect(atracoes.length).toBeGreaterThan(0);
    expect(atracoes.some((p) => /cachoeira/i.test(p.nome))).toBe(false);
  });
});

describe('filtros do mapa', () => {
  it('poucos grupos (público de 40 a 60 anos) e todo tipo do banco cai em algum grupo', () => {
    expect(filtros.length).toBeLessThanOrEqual(8);
    const agrupados = new Set(Object.values(tiposDoFiltro).flatMap((t) => (Array.isArray(t) ? t : [])));
    for (const t of TIPOS_DO_BANCO) expect(agrupados.has(t)).toBe(true);
    expect(tiposDoFiltro.natureza).toEqual(
      expect.arrayContaining(['cachoeira', 'mirante', 'praia', 'parque', 'camping']),
    );
    expect(tiposDoFiltro.apoio).toEqual(
      expect.arrayContaining(['hospital', 'policia_rodoviaria', 'hospedagem']),
    );
  });
});
