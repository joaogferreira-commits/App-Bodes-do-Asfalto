import type { LugarExemplo } from '@/dados/exemplos';

import type { Area } from '@/servidor/pontos';

/** Área visível arredondada (0,1 grau ≈ 11 km): chave estável para o cache, sem refazer a busca a cada arrasto. */
export function chaveDaArea(a: Area, passo = 0.1): (number | string)[] {
  const r = (v: number, f: (x: number) => number) => Number((f(v / passo) * passo).toFixed(2));
  return [r(a.minLon, Math.floor), r(a.minLat, Math.floor), r(a.maxLon, Math.ceil), r(a.maxLat, Math.ceil)];
}

/** Área a pedir ao servidor: a da chave (arredondada para fora). */
export function areaDaChave(chave: (number | string)[]): Area {
  const [minLon, minLat, maxLon, maxLat] = chave.map(Number) as [number, number, number, number];
  return { minLon, minLat, maxLon, maxLat };
}

const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** "node/123" (banco) e "osm-n123" (pacote do app) são o mesmo ponto do OpenStreetMap. */
function idOsm(id: string): string | null {
  const m = /^(node|way|relation)\/(\d+)$/.exec(id) ?? /^osm-([nwr])(\d+)$/.exec(id);
  if (!m) return null;
  return `${m[1]![0]}${m[2]}`;
}

function metros(a: LugarExemplo, b: LugarExemplo) {
  const dLat = (a.lat - b.lat) * 111_320;
  const dLng = (a.lng - b.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

/**
 * Junta os pontos do app com os do banco sem duplicar: mesmo id do OpenStreetMap, ou mesmo nome a menos de
 * 150 m, ou (mesmo tipo e a menos de 40 m). Em duplicata vale o do banco (tem site e telefone).
 */
export function mesclarPontos(locais: LugarExemplo[], doBanco: LugarExemplo[], raio = 150): LugarExemplo[] {
  if (doBanco.length === 0) return locais;
  const ids = new Set(doBanco.map((p) => idOsm(p.id)).filter(Boolean));
  const nomes = doBanco.map((p) => ({ p, n: normalizar(p.nome) }));
  const repetido = (l: LugarExemplo) => {
    const id = idOsm(l.id);
    if (id && ids.has(id)) return true;
    if (l.fonte === 'rotaBiker') return false;
    const n = normalizar(l.nome);
    return nomes.some(({ p, n: nb }) => {
      const d = metros(l, p);
      return (n === nb && d <= raio) || (l.tipo === p.tipo && d <= 40);
    });
  };
  return [...locais.filter((l) => !repetido(l)), ...doBanco];
}
