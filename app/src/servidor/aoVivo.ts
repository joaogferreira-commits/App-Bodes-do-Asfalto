import type { Area } from '@/servidor/pontos';
import {
  modoEfetivo,
  temporarioAtivo,
  type EstadoVisibilidade,
  type ModoVisibilidade,
  type StatusMapa,
} from '@/estado/visibilidadeMapa';
import type { StatusIrmao } from '@/ui';

import { supabase } from './supabase';

/**
 * Mapa ao vivo com irmãos de verdade (P7). Só em primeiro plano. O irmão manda a própria posição para a
 * tabela posicoes_ao_vivo (só ele lê a própria linha); quem vê os outros é a função posicoes_visiveis, que
 * calcula no SERVIDOR a posição aproximada/da cidade, esconde zonas privadas, bloqueados e modos vencidos.
 * O app nunca recebe a coordenada exata de quem escolheu aproximado. Qualquer falha vira lista vazia.
 */
export const INTERVALO_PUBLICAR_MS = 60_000;
export const DISTANCIA_PUBLICAR_M = 500;
export const ATUALIZAR_IRMAOS_MS = 30_000;

export const modoParaServidor: Record<ModoVisibilidade, string> = {
  invisivel: 'invisivel',
  cidade: 'cidade',
  aproximado: 'aproximado',
  precisoAmigos: 'preciso_amigos',
  precisoComboio: 'preciso_comboio',
};

export const statusParaServidor: Record<StatusMapa, string> = {
  estrada: 'na_estrada',
  cafe: 'parado_cafe',
  aberto: 'aberto_encontro',
  naoPerturbe: 'nao_perturbe',
};

const statusDoServidor: Record<string, StatusIrmao> = {
  na_estrada: 'estrada',
  parado_cafe: 'cafe',
  aberto_encontro: 'aberto',
  nao_perturbe: 'naoPerturbe',
};

export type Fix = { lat: number; lon: number; em: number };

/** Distância em metros entre dois pontos (haversine). */
export function distanciaM(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const r = (g: number) => (g * Math.PI) / 180;
  const h =
    Math.sin(r(b.lat - a.lat) / 2) ** 2 +
    Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lon - a.lon) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

/** Freio de envio: publica na primeira vez, a cada 60 s (mantém o sinal vivo) ou ao andar 500 m. */
export function devePublicar(ultimo: Fix | null, atual: Fix): boolean {
  if (!ultimo) return true;
  return atual.em - ultimo.em >= INTERVALO_PUBLICAR_MS || distanciaM(ultimo, atual) >= DISTANCIA_PUBLICAR_M;
}

/** Só publica com modo diferente de invisível e permissão de localização já concedida. */
export function podePublicar(modo: ModoVisibilidade, permissao: boolean): boolean {
  return modo !== 'invisivel' && permissao;
}

export type IrmaoAoVivo = {
  id: string;
  nome: string;
  apelido: string | null;
  capitulo: string | null;
  status: StatusIrmao;
  lat: number;
  lng: number;
  precisao: 'exata' | 'aproximado' | 'cidade';
};

export type LinhaPosicao = {
  usuario_id: string;
  lat: number;
  lon: number;
  precisao: string;
  status: string;
};
export type PerfilResumo = { id: string; nome: string; apelido: string | null; capitulo: string | null };

/** Linha do servidor + perfil → irmão do mapa. Sem perfil visível ou coordenada inválida = fora. */
export function linhaParaIrmao(l: LinhaPosicao, perfis: Record<string, PerfilResumo>): IrmaoAoVivo | null {
  const p = perfis[l.usuario_id];
  if (!p || !Number.isFinite(l.lat) || !Number.isFinite(l.lon)) return null;
  return {
    id: l.usuario_id,
    nome: p.nome,
    apelido: p.apelido,
    capitulo: p.capitulo,
    status: statusDoServidor[l.status] ?? 'estrada',
    lat: l.lat,
    lng: l.lon,
    precisao: l.precisao === 'exata' ? 'exata' : l.precisao === 'cidade' ? 'cidade' : 'aproximado',
  };
}

async function meuId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Envia a minha posição com o modo/status/prazo do modo temporário. Devolve se enviou. */
export async function publicarPosicao(
  fix: Pick<Fix, 'lat' | 'lon'>,
  estado: EstadoVisibilidade,
  agora: number = Date.now(),
): Promise<boolean> {
  const modo = modoEfetivo(estado, agora);
  if (!supabase || modo === 'invisivel') return false;
  try {
    const id = await meuId();
    if (!id) return false;
    const { error } = await supabase.from('posicoes_ao_vivo').upsert(
      {
        usuario_id: id,
        ponto: `SRID=4326;POINT(${fix.lon} ${fix.lat})`,
        visibilidade: modoParaServidor[modo],
        status: statusParaServidor[estado.status],
        modo_ate: temporarioAtivo(estado, agora) ? new Date(estado.temporario!.ate).toISOString() : null,
        atualizado_em: new Date(agora).toISOString(),
      },
      { onConflict: 'usuario_id' },
    );
    return !error;
  } catch {
    return false;
  }
}

/** Apaga a minha posição ao vivo no servidor (modo invisível, sair, revogar permissão). */
export async function removerPosicao(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const id = await meuId();
    if (!id) return false;
    const { error } = await supabase.from('posicoes_ao_vivo').delete().eq('usuario_id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Sincroniza a escolha de visibilidade: invisível apaga a posição na hora; os outros modos só atualizam
 * modo/status/prazo da linha que já existe (a posição em si segue o freio de envio).
 */
export async function sincronizarVisibilidade(
  estado: EstadoVisibilidade,
  agora: number = Date.now(),
): Promise<boolean> {
  const modo = modoEfetivo(estado, agora);
  if (modo === 'invisivel') return removerPosicao();
  if (!supabase) return false;
  try {
    const id = await meuId();
    if (!id) return false;
    const { error } = await supabase
      .from('posicoes_ao_vivo')
      .update({
        visibilidade: modoParaServidor[modo],
        status: statusParaServidor[estado.status],
        modo_ate: temporarioAtivo(estado, agora) ? new Date(estado.temporario!.ate).toISOString() : null,
      })
      .eq('usuario_id', id);
    return !error;
  } catch {
    return false;
  }
}

/** Irmãos visíveis para mim dentro da área (o servidor decide o que cada um mostra). */
export async function irmaosNaArea(area: Area): Promise<IrmaoAoVivo[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc('posicoes_visiveis', {
      min_lon: area.minLon,
      min_lat: area.minLat,
      max_lon: area.maxLon,
      max_lat: area.maxLat,
    });
    if (error || !Array.isArray(data) || data.length === 0) return [];
    const linhas = data as LinhaPosicao[];
    const { data: ps, error: erroPerfis } = await supabase
      .from('perfis')
      .select('id, nome, apelido, capitulos(nome)')
      .in(
        'id',
        linhas.map((l) => l.usuario_id),
      );
    if (erroPerfis) return [];
    type P = {
      id: string;
      nome: string;
      apelido: string | null;
      capitulos: { nome: string } | { nome: string }[] | null;
    };
    const perfis: Record<string, PerfilResumo> = {};
    for (const p of (ps ?? []) as unknown as P[]) {
      const cap = Array.isArray(p.capitulos) ? p.capitulos[0] : p.capitulos;
      perfis[p.id] = { id: p.id, nome: p.nome, apelido: p.apelido, capitulo: cap?.nome ?? null };
    }
    return linhas.map((l) => linhaParaIrmao(l, perfis)).filter((i): i is IrmaoAoVivo => i !== null);
  } catch {
    return [];
  }
}
