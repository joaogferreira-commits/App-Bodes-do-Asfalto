import { conquistou, exemploIrmao, nivelDoXp, niveis, selos } from './conquistas';

describe('níveis e selos', () => {
  it('níveis em ordem crescente de XP, começando em 0', () => {
    expect(niveis[0]!.xpMinimo).toBe(0);
    for (let i = 1; i < niveis.length; i++)
      expect(niveis[i]!.xpMinimo).toBeGreaterThan(niveis[i - 1]!.xpMinimo);
  });

  it('calcula nível, próximo e quanto falta', () => {
    expect(nivelDoXp(0).atual.chave).toBe('cabrito');
    const n = nivelDoXp(3000);
    expect(n.atual.chave).toBe('bode');
    expect(n.proximo?.chave).toBe('bodeVelho');
    expect(n.falta).toBe(2000);
    expect(n.progresso).toBeCloseTo(0.5);
    expect(nivelDoXp(99999)).toMatchObject({ proximo: null, progresso: 1, falta: 0 });
  });

  it('selo conquistado só ao atingir a meta', () => {
    expect(conquistou('agape', exemploIrmao.progresso)).toBe(true);
    expect(conquistou('sedesMt', exemploIrmao.progresso)).toBe(false);
  });

  it('o exemplo mostra conquistados e por conquistar (para dar vontade)', () => {
    const feitos = selos.filter((s) => conquistou(s.chave, exemploIrmao.progresso));
    expect(feitos.length).toBeGreaterThan(0);
    expect(feitos.length).toBeLessThan(selos.length);
  });
});
