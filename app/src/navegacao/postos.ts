import type { LugarExemplo } from '@/dados/exemplos';

import { distanciaKm, type Coordenada } from './destinos';

export type PostoEscolhido = { posto: LugarExemplo; km: number };

export const RAIO_POSTO_KM = 15;
export const DESVIO_MAXIMO_KM = 1.5;

const ponto = (l: { lat: number; lng: number }): Coordenada => ({ lat: l.lat, lng: l.lng });

/** Posto mais perto em linha reta, dentro do raio. */
export function postoMaisProximo(
  atual: Coordenada,
  postos: LugarExemplo[],
  raioKm = RAIO_POSTO_KM,
): PostoEscolhido | null {
  let melhor: PostoEscolhido | null = null;
  for (const posto of postos) {
    if (posto.tipo !== 'posto') continue;
    const km = distanciaKm(atual, ponto(posto));
    if (km <= raioKm && (!melhor || km < melhor.km)) melhor = { posto, km };
  }
  return melhor;
}

/** Distância (km) de p ao segmento a-b e fração do segmento onde fica o ponto mais próximo. */
function aoSegmento(p: Coordenada, a: Coordenada, b: Coordenada) {
  const kx = Math.cos((p.lat * Math.PI) / 180) * 111.32;
  const ky = 110.57;
  const ax = (a.lng - p.lng) * kx;
  const ay = (a.lat - p.lat) * ky;
  const bx = (b.lng - p.lng) * kx;
  const by = (b.lat - p.lat) * ky;
  const dx = bx - ax;
  const dy = by - ay;
  const comp = dx * dx + dy * dy;
  const f = comp === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / comp));
  return { km: Math.hypot(ax + f * dx, ay + f * dy), f };
}

/**
 * Posto à frente na rota restante com o menor desvio. O trecho restante começa no ponto da rota mais
 * perto de `atual`. Nota = km já percorridos até o posto + 2 × desvio (o primeiro à frente ganha, mas um
 * posto colado na rota vence outro um pouco antes que exija desvio grande).
 * Sem rota, age como "mais próximo".
 */
export function postoNaRota(
  rota: Coordenada[] | null | undefined,
  atual: Coordenada,
  postos: LugarExemplo[],
  limiteKm = DESVIO_MAXIMO_KM,
): PostoEscolhido | null {
  if (!rota || rota.length < 2) return postoMaisProximo(atual, postos);
  let inicio = 0;
  let menor = Infinity;
  for (let i = 0; i < rota.length - 1; i++) {
    const { km } = aoSegmento(atual, rota[i]!, rota[i + 1]!);
    if (km < menor) {
      menor = km;
      inicio = i;
    }
  }
  const restante = rota.slice(inicio);
  const acumulado: number[] = [0];
  for (let i = 1; i < restante.length; i++)
    acumulado.push(acumulado[i - 1]! + distanciaKm(restante[i - 1]!, restante[i]!));

  let melhor: (PostoEscolhido & { nota: number }) | null = null;
  for (const posto of postos) {
    if (posto.tipo !== 'posto') continue;
    const p = ponto(posto);
    let desvio = Infinity;
    let ao = 0;
    for (let i = 0; i < restante.length - 1; i++) {
      const s = aoSegmento(p, restante[i]!, restante[i + 1]!);
      if (s.km < desvio) {
        desvio = s.km;
        ao = acumulado[i]! + s.f * (acumulado[i + 1]! - acumulado[i]!);
      }
    }
    if (desvio > limiteKm) continue;
    const nota = ao + 2 * desvio;
    if (!melhor || nota < melhor.nota) melhor = { posto, km: distanciaKm(atual, p), nota };
  }
  return melhor ? { posto: melhor.posto, km: melhor.km } : null;
}
