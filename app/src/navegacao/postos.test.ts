import type { LugarExemplo } from '@/dados/exemplos';

import { areaDeBusca, escolherPosto } from './acoesPilotando';
import { postoMaisProximo, postoNaRota } from './postos';

const posto = (id: string, lat: number, lng: number, tipo: LugarExemplo['tipo'] = 'posto'): LugarExemplo => ({
  id,
  tipo,
  nome: id,
  lat,
  lng,
});

// rota reta para o leste a -15,6 (1 grau de longitude ~ 107 km)
const rota = Array.from({ length: 11 }, (_, i) => ({ lat: -15.6, lng: -56.2 + i * 0.05 }));
const atual = { lat: -15.6, lng: -56.2 };

describe('posto mais próximo', () => {
  it('escolhe o mais perto em linha reta e ignora o que não é posto ou passa do raio', () => {
    const r = postoMaisProximo(atual, [
      posto('longe', -15.6, -56.0),
      posto('perto', -15.61, -56.19),
      posto('hospital', -15.6, -56.2, 'hospital'),
      posto('foraDoRaio', -15.6, -55.5),
    ]);
    expect(r?.posto.id).toBe('perto');
    expect(r!.km).toBeGreaterThan(1);
    expect(r!.km).toBeLessThan(2);
  });

  it('sem posto no raio de 100 km devolve null', () => {
    expect(postoMaisProximo(atual, [posto('longe', -16.6, -56.1)])).toBeNull();
  });
});

describe('posto na rota', () => {
  it('ignora postos atrás de você e os que exigem desvio acima de 1,5 km', () => {
    const r = postoNaRota(rota, { lat: -15.6, lng: -56.1 }, [
      posto('atras', -15.6, -56.19),
      posto('desviado', -15.63, -56.0), // ~3,3 km da rota
      posto('naRota', -15.605, -55.95),
    ]);
    expect(r?.posto.id).toBe('naRota');
  });

  it('prefere o primeiro à frente, mas um posto colado na rota vence outro que exige desvio grande', () => {
    const postos = [posto('perto-desvio', -15.614, -56.15), posto('colado', -15.6, -56.13)];
    expect(postoNaRota(rota, atual, postos)?.posto.id).toBe('colado');
    expect(
      postoNaRota(rota, atual, [posto('segundo', -15.6, -56.0), posto('primeiro', -15.6, -56.1)])?.posto.id,
    ).toBe('primeiro');
  });

  it('sem rota ativa age como "mais próximo"', () => {
    const postos = [posto('a', -15.61, -56.19), posto('b', -15.6, -56.0)];
    expect(postoNaRota(null, atual, postos)?.posto.id).toBe('a');
    expect(postoNaRota([], atual, postos)?.posto.id).toBe('a');
  });
});

describe('busca no banco', () => {
  it('"próximo" busca ~100 km em volta (estrada); "rota" cobre o trecho à frente', () => {
    const a = areaDeBusca(atual);
    expect(a.maxLat - a.minLat).toBeCloseTo(2 * (100 / 110), 2);
    const b = areaDeBusca(atual, rota);
    expect(b.maxLon).toBeGreaterThan(-55.7);
  });

  it('escolherPosto usa o carregador e o modo certo', async () => {
    const carregar = jest.fn(async () => [posto('p', -15.6, -56.1)]);
    expect((await escolherPosto('proximo', atual, null, carregar))?.posto.id).toBe('p');
    expect((await escolherPosto('rota', atual, rota, carregar))?.posto.id).toBe('p');
    expect(carregar).toHaveBeenCalledTimes(2);
    expect(await escolherPosto('proximo', atual, null, async () => [])).toBeNull();
  });
});
