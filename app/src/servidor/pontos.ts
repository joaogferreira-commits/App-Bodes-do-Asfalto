import type { LugarExemplo, PrecoAnp, ProdutoAnp } from '@/dados/exemplos';
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

const PRODUTOS_ANP: ProdutoAnp[] = ['gasolina_comum', 'etanol', 'diesel_s10'];

/** {"gasolina_comum": {"valor": 6.29, "data_coleta": "2026-11-10"}, ...} → lista validada (só os 3 produtos do app). */
export function lerPrecosAnp(bruto: unknown): PrecoAnp[] {
  if (!bruto || typeof bruto !== 'object') return [];
  const lista: PrecoAnp[] = [];
  for (const produto of PRODUTOS_ANP) {
    const p = (bruto as Record<string, unknown>)[produto] as
      { valor?: unknown; data_coleta?: unknown } | undefined;
    const valor = typeof p?.valor === 'number' ? p.valor : Number(p?.valor);
    const data = typeof p?.data_coleta === 'string' ? p.data_coleta : '';
    if (p && Number.isFinite(valor) && valor >= 1 && valor <= 30 && /^\d{4}-\d{2}-\d{2}$/.test(data))
      lista.push({ produto, valor, data });
  }
  return lista;
}

const brl = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`;

export function linhaParaLugar(l: LinhaPonto): LugarExemplo | null {
  if (!TIPOS_DO_BANCO.includes(l.tipo as TipoPino) || !Number.isFinite(l.lon) || !Number.isFinite(l.lat))
    return null;
  const ex = l.extras ?? {};
  if (l.id.startsWith('anp/') || ex.fonte === 'ANP') {
    const precos = lerPrecosAnp(ex.precos);
    const gasolina = precos.find((p) => p.produto === 'gasolina_comum');
    return {
      id: l.id,
      tipo: 'posto',
      nome: l.nome,
      lng: l.lon,
      lat: l.lat,
      fonte: 'anp',
      rotulo: gasolina ? brl(gasolina.valor) : undefined,
      bandeira: texto(ex.marca ?? ex.bandeira),
      precosAnp: precos,
      localAproximado: ex.precisao === 'rua' || ex.precisao === 'bairro',
    };
  }
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

type LinhaPosto = {
  id: string;
  nome: string;
  bandeira: string | null;
  lon: number;
  lat: number;
  fonte: string;
  precisao: string | null;
  precos: Record<string, unknown> | null;
};

const kmEntre = (a: Area) => {
  const dLat = (a.maxLat - a.minLat) * 110.57;
  const dLng = (a.maxLon - a.minLon) * 111.32 * Math.cos((((a.maxLat + a.minLat) / 2) * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
};

/**
 * Postos perto de um ponto: ANP (com preço e fonte) e do OpenStreetMap que a ANP não cobre (RPC postos_proximos).
 * Devolve null se a função ainda não existe no servidor, se não há sessão ou se deu erro: quem chama volta ao
 * comportamento antigo (pontos_na_area).
 */
export async function carregarPostosPerto(
  centro: { lat: number; lng: number },
  raioKm = 100,
  limite = 100,
): Promise<LugarExemplo[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('postos_proximos', {
      p_lat: centro.lat,
      p_lng: centro.lng,
      raio_km: raioKm,
      limite,
    });
    if (error || !Array.isArray(data)) return null;
    return (data as LinhaPosto[])
      .map((p) =>
        linhaParaLugar({
          id: p.id,
          tipo: 'posto',
          nome: p.nome,
          lon: p.lon,
          lat: p.lat,
          extras:
            p.fonte === 'ANP'
              ? { fonte: 'ANP', marca: p.bandeira, precisao: p.precisao, precos: p.precos }
              : { marca: p.bandeira },
        }),
      )
      .filter((p): p is LugarExemplo => p !== null);
  } catch {
    return null;
  }
}

/**
 * Postos de uma área para "Posto mais próximo" e "Posto na rota": prefere postos_proximos (ANP + OSM); se a função não
 * existir ou falhar, usa os postos do OpenStreetMap de pontos_na_area, como antes.
 */
export async function carregarPostosDaArea(area: Area): Promise<LugarExemplo[]> {
  const centro = { lat: (area.minLat + area.maxLat) / 2, lng: (area.minLon + area.maxLon) / 2 };
  const raio = Math.max(1, Math.min(100, kmEntre(area) / 2));
  const doServidor = await carregarPostosPerto(centro, raio);
  if (doServidor) return doServidor;
  return carregarPontosDaArea(area, ['posto'], LIMITE_PONTOS);
}
