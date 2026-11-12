import { desafiosExemplo, placarEntreCapitulos, tabelaXpKm, validarDesafio, xpDoDesafio } from './desafios';

describe('desafios', () => {
  it('XP do irmão segue a tabela fixa por km total', () => {
    expect(xpDoDesafio({ tipo: 'km', meta: 100, origem: 'irmao' })).toBe(50);
    expect(xpDoDesafio({ tipo: 'km', meta: 101, origem: 'irmao' })).toBe(120);
    expect(xpDoDesafio({ tipo: 'km', meta: 5000, origem: 'irmao' })).toBe(1000);
    expect(xpDoDesafio({ tipo: 'km', meta: 1000, origem: 'diretoria' })).toBe(600);
    expect(tabelaXpKm.at(-1)!.xp).toBe(1000);
  });

  it('não aceita prazo acima de 90 dias, 2 desafios do mesmo irmão no mês nem 4 ativos no capítulo', () => {
    const base = {
      titulo: 'Rodar 500 km',
      meta: 500,
      origem: 'irmao' as const,
      capitulos: ['X'],
      criador: 'Eu',
    };
    const hoje = new Date('2026-11-12');
    expect(validarDesafio({ ...base, inicio: '2026-11-12', fim: '2027-03-01' }, [], hoje)).toBe('prazo');
    const meu = { ...desafiosExemplo[1]!, criador: 'Eu', inicio: '2026-11-02' };
    expect(validarDesafio({ ...base, inicio: '2026-11-12', fim: '2026-12-12' }, [meu], hoje)).toBe(
      'umPorMes',
    );
    const tres = [0, 1, 2].map((i) => ({
      ...desafiosExemplo[1]!,
      id: `a${i}`,
      criador: `o${i}`,
      capitulos: ['X'],
    }));
    expect(validarDesafio({ ...base, inicio: '2026-11-12', fim: '2026-12-12' }, tres, hoje)).toBe(
      'limiteCapitulo',
    );
    expect(validarDesafio({ ...base, inicio: '2026-11-12', fim: '2026-12-12' }, [], hoje)).toBeNull();
  });

  it('entre capítulos vale a média por irmão ativo, não o total', () => {
    const p = placarEntreCapitulos({
      Grande: { total: 10000, ativos: 100 },
      Pequeno: { total: 3000, ativos: 20 },
    });
    expect(p[0]!.capitulo).toBe('Pequeno');
  });
});
