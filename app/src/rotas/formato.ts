import type { Coordenada } from '@/navegacao/destinos';

import type { Trecho } from './tipos';

export function formatarDuracao(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function horaChegada(minutos: number, agora: Date = new Date()): string {
  const chegada = new Date(agora.getTime() + minutos * 60_000);
  return `${String(chegada.getHours()).padStart(2, '0')}:${String(chegada.getMinutes()).padStart(2, '0')}`;
}

export function formatarKm(km: number): string {
  return km >= 100 ? String(Math.round(km)) : String(Math.round(km * 10) / 10).replace('.', ',');
}

/** Retângulo [oeste, sul, leste, norte] que contém todos os pontos. */
export function limites(pontos: Coordenada[]): [number, number, number, number] {
  const lngs = pontos.map((p) => p.lng);
  const lats = pontos.map((p) => p.lat);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

/** Linhas da rota para o mapa, cada trecho marcado como terra ou asfalto. */
export function trechosGeoJSON(trechos: Trecho[]) {
  return {
    type: 'FeatureCollection' as const,
    features: trechos.map((t, i) => ({
      type: 'Feature' as const,
      id: i,
      properties: { terra: t.terra },
      geometry: { type: 'LineString' as const, coordinates: t.pontos.map((p) => [p.lng, p.lat]) },
    })),
  };
}

export function percentualTerra(km: number, kmTerra: number): number {
  if (km <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((kmTerra / km) * 100)));
}
