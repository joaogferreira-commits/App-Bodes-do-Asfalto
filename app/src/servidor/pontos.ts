import type { LugarExemplo } from '@/dados/exemplos';
import type { TipoPino } from '@/ui';

import { supabase } from './supabase';

/**
 * Pontos do mapa vindos do banco (public.pontos_osm, dados do OpenStreetMap, ODbL). Só membros aprovados leem (RLS).
 * Qualquer falha (tabela ainda não criada no servidor, rede, sem sessão) devolve lista vazia: o mapa segue com os
 * pontos que já vêm no app, sem aviso de erro.
 */
export type Area = { minLon: number; minLat: number; maxLon: number; maxLat: number };

/** Tipos que o banco guarda (os mesmos nomes dos pinos). */
export const TIPOS_DO_BANCO: TipoPino[] = [
  'posto',
  'oficina_moto',
  'borracharia',
  'cachoeira',
  'mirante',
  'museu',
  'monumento',
  'atracao',
  'praia',
  'parque',
  'igreja_historica',
  'hospedagem',
  'camping',
  'hospital',
  'policia_rodoviaria',
];

export const LIMITE_PONTOS = 500;

type LinhaPonto = {
  id: string;
  tipo: string;
  nome: string;
  lon: number;
  lat: number;
  extras: Record<string, unknown> | null;
};

const texto = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
/** Só abre http(s): o campo vem de terceiros (OpenStreetMap). */
const urlSegura = (v: unknown) => {
  const t = texto(v);
  if (!t) return undefined;
  if (/^[a-z][a-z0-9+.-]*:/i.test(t) && !/^https?:\/\//i.test(t)) return undefined; // javascript:, intent:, tel:...
  const url = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  return /^https?:\/\/[^\s]+$/i.test(url) ? url : undefined;
};

export function linhaParaLugar(l: LinhaPonto): LugarExemplo | null {
  if (!TIPOS_DO_BANCO.includes(l.tipo as TipoPino) || !Number.isFinite(l.lon) || !Number.isFinite(l.lat))
    return null;
  const ex = l.extras ?? {};
  return {
    id: l.id,
    tipo: l.tipo as TipoPino,
    nome: l.nome,
    lng: l.lon,
    lat: l.lat,
    fonte: 'osm',
    link: `https://www.openstreetmap.org/${l.id}`,
    site: urlSegura(ex.website ?? ex.site),
    telefone: texto(ex.phone ?? ex.telefone),
  };
}

export async function carregarPontosDaArea(
  area: Area,
  tipos: TipoPino[] | null = null,
  limite = LIMITE_PONTOS,
): Promise<LugarExemplo[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc('pontos_na_area', {
      min_lon: area.minLon,
      min_lat: area.minLat,
      max_lon: area.maxLon,
      max_lat: area.maxLat,
      tipos,
      limite,
    });
    if (error || !Array.isArray(data)) return [];
    return (data as LinhaPonto[]).map(linhaParaLugar).filter((p): p is LugarExemplo => p !== null);
  } catch {
    return [];
  }
}
