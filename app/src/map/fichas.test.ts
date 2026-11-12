import { irmaosExemplo, lugaresExemplo } from '@/dados/exemplos';

import { ACENOS_POR_DIA, acenar, fichaDoIrmao, fichaDoLugar, lerPrecoCombustivel } from './fichas';

describe('fichas do mapa', () => {
  it('todo lugar do mapa abre ficha com "Rota até aqui" como primeira ação', () => {
    for (const l of lugaresExemplo) {
      const f = fichaDoLugar(l);
      expect(f.acoes[0]).toBe('rota');
      expect(f.acoes.length).toBeLessThanOrEqual(2);
    }
  });

  it('irmão nunca tem rota até ele (posição aproximada) e "não perturbe" não recebe aceno', () => {
    for (const i of irmaosExemplo) expect(fichaDoIrmao(i).acoes).not.toContain('rota');
    expect(fichaDoIrmao({ ...irmaosExemplo[0]!, status: 'naoPerturbe' }).acoes).toEqual(['perfil']);
  });

  it('posto mostra o preço do irmão com data quando informado', () => {
    const posto = lugaresExemplo.find((l) => l.tipo === 'posto')!;
    const f = fichaDoLugar(posto, { valor: '6,10', dia: '12/11/2026' });
    expect(f.linhas[0]).toMatchObject({
      chave: 'ficha.precoIrmao',
      valores: { preco: '6,10', dia: '12/11/2026' },
    });
  });

  it('acenos: um por irmão por dia e no máximo o limite diário', () => {
    let r = { dia: '', para: [] as string[] };
    r = acenar(r, 'ze', '2026-11-12')!;
    expect(acenar(r, 'ze', '2026-11-12')).toBeNull();
    for (let i = 1; i < ACENOS_POR_DIA; i++) r = acenar(r, `i${i}`, '2026-11-12')!;
    expect(acenar(r, 'outro', '2026-11-12')).toBeNull();
    expect(acenar(r, 'ze', '2026-11-13')).toEqual({ dia: '2026-11-13', para: ['ze'] });
  });

  it.each([
    ['6,29', '6,29'],
    ['R$ 6.5', '6,50'],
    ['abc', null],
    ['62', null],
  ])('preço "%s" → %s', (e, s) => expect(lerPrecoCombustivel(e)).toBe(s));
});

describe('pontos coletados', () => {
  it('Rota Biker tem ficha com número, crédito e link do site oficial', () => {
    const { pontosColetados } = jest.requireActual('@/dados/exemplos') as typeof import('@/dados/exemplos');
    const rb = pontosColetados.filter((p) => p.tipo === 'rotaBiker');
    expect(rb.length).toBeGreaterThanOrEqual(40);
    const f = fichaDoLugar(rb[0]!);
    expect(f.acoes).toEqual(['rota', 'site']);
    expect(f.link).toContain('monumentobikers.com.br');
    expect(f.linhas.map((l) => l.chave)).toContain('ficha.fonteRotaBiker');
  });

  it('cachoeiras e mirantes do OpenStreetMap trazem o crédito e o tipo certo', () => {
    const { pontosColetados } = jest.requireActual('@/dados/exemplos') as typeof import('@/dados/exemplos');
    const c = pontosColetados.find((p) => p.subtipo === 'cachoeira')!;
    const f = fichaDoLugar(c);
    expect(f.subtitulo).toBe('ficha.tipos.cachoeira');
    expect(f.linhas[0]!.chave).toBe('ficha.fonteOsm');
    expect(new Set(pontosColetados.map((p) => p.id)).size).toBe(pontosColetados.length);
  });
});
