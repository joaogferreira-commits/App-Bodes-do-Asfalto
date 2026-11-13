import type { Area } from '@/servidor/pontos';

type Ponto = { lat: number; lng: number };

/** Distância em km entre dois pontos (haversine). */
export function distanciaKm(a: Ponto, b: Ponto): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export const centroDaArea = (a: Area): Ponto => ({
  lat: (a.minLat + a.maxLat) / 2,
  lng: (a.minLon + a.maxLon) / 2,
});

/** Minutos até o início ("19h30" ou "19:30"); negativo = já começou. Dia seguinte se passou de 1 h. */
export function minutosAteHorario(horario: string, agora: number): number | null {
  const m = /^(\d{1,2})[h:](\d{2})?$/.exec(horario.trim());
  if (!m) return null;
  const alvo = Number(m[1]) * 60 + Number(m[2] ?? 0);
  const d = new Date(agora);
  let diff = alvo - (d.getHours() * 60 + d.getMinutes());
  if (diff < -60) diff += 1440;
  return diff;
}

export const RAIO_AGAPE_KM = 10;
export const JANELA_AGAPE_MIN = 120;

/** Banner do Ágape: só se estiver a até 10 km ou começar em até 2 h (ou tiver começado há menos de 1 h). */
export function agapeRelevante(
  ag: { lat: number; lng: number; horario: string },
  referencia: Ponto,
  agora: number,
): boolean {
  if (distanciaKm(referencia, ag) <= RAIO_AGAPE_KM) return true;
  const min = minutosAteHorario(ag.horario, agora);
  return min !== null && min >= -60 && min <= JANELA_AGAPE_MIN;
}
