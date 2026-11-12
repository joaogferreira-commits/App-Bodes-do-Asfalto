import type { LugarExemplo } from '@/dados/exemplos';

import { areaDaChave, chaveDaArea, mesclarPontos } from './pontos';

const p = (o: Partial<LugarExemplo> & { id: string; nome: string }): LugarExemplo => ({
  tipo: 'atracao',
  lng: -56,
  lat: -15.6,
  fonte: 'osm',
  ...o,
});

describe('mesclarPontos', () => {
  it('sem pontos do banco devolve exatamente os do app', () => {
    const locais = [p({ id: 'osm-n1', nome: 'A' })];
    expect(mesclarPontos(locais, [])).toBe(locais);
  });

  it('descarta o do app com o mesmo id do OpenStreetMap e fica com o do banco', () => {
    const local = p({ id: 'osm-n123', nome: 'Cristo', lng: -56.1 });
    const banco = p({ id: 'node/123', nome: 'Cristo Redentor', lng: -56.1, site: 'https://x.example' });
    const r = mesclarPontos([local], [banco]);
    expect(r).toEqual([banco]);
  });

  it('descarta por nome igual (sem acento) a menos de 150 m e por mesmo tipo a menos de 40 m', () => {
    const a = p({ id: 'x1', nome: 'Praça Alencastro', lat: -15.6 });
    const b = p({ id: 'x2', nome: 'Outro nome', tipo: 'museu', lat: -15.7 });
    const banco = [
      p({ id: 'node/9', nome: 'Praca alencastro', lat: -15.6008 }),
      p({ id: 'node/10', nome: 'Museu qualquer', tipo: 'museu', lat: -15.7002 }),
    ];
    const r = mesclarPontos([a, b], banco);
    expect(r.map((x) => x.id)).toEqual(['node/9', 'node/10']);
  });

  it('mantém os que estão longe, mesmo com nome igual, e nunca remove Rota Biker', () => {
    const longe = p({ id: 'x3', nome: 'Igreja Matriz', lat: -15.9 });
    const rb = p({ id: 'rb-1', nome: 'Igreja Matriz', fonte: 'rotaBiker', tipo: 'rotaBiker' });
    const banco = [p({ id: 'node/5', nome: 'Igreja Matriz' })];
    expect(mesclarPontos([longe, rb], banco).map((x) => x.id)).toEqual(['x3', 'rb-1', 'node/5']);
  });
});

describe('chave da área', () => {
  it('arredonda para fora, então arrastar pouco mantém a chave', () => {
    const a = { minLon: -56.231, minLat: -15.741, maxLon: -55.951, maxLat: -15.461 };
    const b = { minLon: -56.229, minLat: -15.739, maxLon: -55.949, maxLat: -15.459 };
    expect(chaveDaArea(a)).toEqual(chaveDaArea(b));
    expect(chaveDaArea(a)).toEqual([-56.3, -15.8, -55.9, -15.4]);
    const area = areaDaChave(chaveDaArea(a));
    expect(area.minLon).toBeLessThanOrEqual(a.minLon);
    expect(area.maxLat).toBeGreaterThanOrEqual(a.maxLat);
  });
});
