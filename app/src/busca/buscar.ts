import { lugaresExemplo, type LugarExemplo } from '@/dados/exemplos';
import { distanciaKm, type Coordenada } from '@/navegacao/destinos';
import type { TipoPino } from '@/ui';

/**
 * Busca do mapa: primeiro os lugares do clube (sedes, Lojas, postos, Ágapes…),
 * depois endereços, cidades e estradas do OpenStreetMap pelo Photon (komoot, gratuito, sem chave).
 * Antes do lançamento: trocar por um servidor próprio ou plano pago se o uso crescer.
 */
export const SERVIDOR_BUSCA = 'https://photon.komoot.io/api/';

export type Resultado = {
  id: string;
  nome: string;
  detalhe: string;
  posicao: Coordenada;
  origem: 'clube' | 'endereco';
  tipo?: TipoPino;
  distanciaKm?: number;
};

/** Compara sem acento e sem maiúscula. */
export const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function buscarNoClube(
  termo: string,
  perto?: Coordenada | null,
  lugares: LugarExemplo[] = lugaresExemplo,
) {
  const q = normalizar(termo);
  if (q.length < 2) return [];
  return lugares
    .filter((l) => normalizar(l.nome).includes(q))
    .map<Resultado>((l) => ({
      id: `clube-${l.id}`,
      nome: l.nome,
      detalhe: l.rotulo ?? '',
      posicao: { lat: l.lat, lng: l.lng },
      origem: 'clube',
      tipo: l.tipo,
      distanciaKm: perto ? distanciaKm(perto, { lat: l.lat, lng: l.lng }) : undefined,
    }))
    .sort((a, b) => (a.distanciaKm ?? 0) - (b.distanciaKm ?? 0));
}

type RespostaPhoton = {
  features?: {
    geometry?: { coordinates?: [number, number] };
    properties?: {
      osm_id?: number;
      name?: string;
      street?: string;
      housenumber?: string;
      city?: string;
      state?: string;
      country?: string;
    };
  }[];
};

type Buscar = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

export async function buscarEnderecos(
  termo: string,
  perto?: Coordenada | null,
  buscar: Buscar = fetch as unknown as Buscar,
): Promise<Resultado[]> {
  const q = termo.trim();
  if (q.length < 3) return [];
  const params = new URLSearchParams({ q, limit: '8' });
  if (perto) {
    params.set('lat', perto.lat.toFixed(4));
    params.set('lon', perto.lng.toFixed(4));
  }
  const resp = await buscar(`${SERVIDOR_BUSCA}?${params.toString()}`);
  if (!resp.ok) return [];
  const dados = (await resp.json()) as RespostaPhoton;
  return (dados.features ?? []).flatMap<Resultado>((f, i) => {
    const c = f.geometry?.coordinates;
    const p = f.properties ?? {};
    if (!c) return [];
    const rua = p.street ? `${p.street}${p.housenumber ? `, ${p.housenumber}` : ''}` : '';
    const nome = p.name ?? rua;
    if (!nome) return [];
    const detalhe = [p.name ? rua : '', p.city, p.state].filter(Boolean).join(' · ');
    const posicao = { lat: c[1], lng: c[0] };
    return [
      {
        id: `osm-${p.osm_id ?? i}-${i}`,
        nome,
        detalhe,
        posicao,
        origem: 'endereco',
        distanciaKm: perto ? distanciaKm(perto, posicao) : undefined,
      },
    ];
  });
}
