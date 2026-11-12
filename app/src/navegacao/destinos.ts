export type Coordenada = { lat: number; lng: number };

export type Destino = {
  chave: 'chapada' | 'centroCuiaba' | 'cincoKm' | 'postoTrevo' | 'busca' | 'bateVolta';
  posicao?: Coordenada;
  /** Nome vindo da busca no mapa (lugar do app ou endereço). */
  nome?: string;
};

/** Nome para mostrar: o da busca ou o texto traduzido do destino fixo. */
export function nomeDoDestino(d: Destino, t: (chave: string) => string): string {
  return d.nome ?? t(`destinos.${d.chave}`);
}

/** Destinos fixos da prova (região de Cuiabá) e um ponto a 5 km para testar em qualquer cidade. */
export const destinosDaProva: Destino[] = [
  { chave: 'chapada', posicao: { lat: -15.4604, lng: -55.7497 } },
  { chave: 'centroCuiaba', posicao: { lat: -15.601, lng: -56.0974 } },
  { chave: 'cincoKm' },
];

/** Posto de exemplo (até a importação dos postos na Etapa 2). */
export const postoExemplo: Destino = { chave: 'postoTrevo', posicao: { lat: -15.5712, lng: -56.0751 } };

const RAIO_TERRA_KM = 6371;

/** Ponto a `km` de distância de `origem`, na direção `rumoGraus` (0 = norte). */
export function pontoADistancia(origem: Coordenada, km: number, rumoGraus = 0): Coordenada {
  const rad = Math.PI / 180;
  const d = km / RAIO_TERRA_KM;
  const rumo = rumoGraus * rad;
  const lat1 = origem.lat * rad;
  const lng1 = origem.lng * rad;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(rumo));
  const lng2 =
    lng1 +
    Math.atan2(Math.sin(rumo) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
  return { lat: lat2 / rad, lng: lng2 / rad };
}

/** Distância em km entre dois pontos (fórmula de haversine). */
export function distanciaKm(a: Coordenada, b: Coordenada): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_KM * Math.asin(Math.sqrt(h));
}

export function posicaoDoDestino(destino: Destino, atual: Coordenada): Coordenada {
  return destino.posicao ?? pontoADistancia(atual, 5);
}
