import type { Passeio } from '@/dados/passeios';

import { supabase } from './supabase';

/**
 * Passeios reais (P8). Todos os membros leem; só a diretoria do capítulo (ou geral) e o admin criam (RLS).
 * "Vou" entra no grupo do passeio por gatilho do banco; "talvez" ou desmarcar sai. Qualquer falha de leitura vira lista vazia.
 */
export const CHAVE_PASSEIOS = ['passeios'] as const;
export type PresencaPasseio = 'vou' | 'talvez';

export const PAPEIS_QUE_CRIAM_PASSEIO = ['diretoria_capitulo', 'diretoria_geral', 'admin'];

export function podeCriarPasseio(papel: string | undefined): boolean {
  return !!papel && PAPEIS_QUE_CRIAM_PASSEIO.includes(papel);
}

type LinhaPresenca = {
  usuario_id: string;
  status: string;
  perfis: { nome: string } | { nome: string }[] | null;
};
export type LinhaPasseio = {
  id: string;
  titulo: string;
  descricao: string | null;
  data: string;
  ponto_encontro: string | null;
  rota: { destino?: string; km?: number } | null;
  capitulos: { nome: string } | { nome: string }[] | null;
  perfis: { nome: string; papel: string } | { nome: string; papel: string }[] | null;
  presencas: LinhaPresenca[] | null;
};

const um = <T>(v: T | T[] | null | undefined): T | undefined => (Array.isArray(v) ? v[0] : (v ?? undefined));
const imagemPadrao = require('../../assets/gerados/ilustracoes/ilustra-vazio-estrada.webp') as number;
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const doisDigitos = (n: number) => String(n).padStart(2, '0');

/** Linha do banco → cartão. `agora` separa próximos de já foram (passeio de ontem à noite ainda conta como próximo por 12 h). */
export function linhaParaPasseio(l: LinhaPasseio, meuId: string | null, agora: number = Date.now()): Passeio {
  const d = new Date(l.data);
  const presencas = l.presencas ?? [];
  const vou = presencas.filter((p) => p.status === 'vou');
  const criador = um(l.perfis);
  return {
    id: l.id,
    titulo: l.titulo,
    capitulo: um(l.capitulos)?.nome ?? '',
    organizador: criador?.nome ?? '',
    oficial: !!criador && criador.papel !== 'membro',
    dia: `${DIAS[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`,
    hora: d.getMinutes() ? `${d.getHours()}h${doisDigitos(d.getMinutes())}` : `${d.getHours()}h`,
    saida: l.ponto_encontro ?? '',
    destino: l.rota?.destino ?? '',
    km: Number(l.rota?.km) || 0,
    duracao: '',
    tipoEstrada: 'asfalto',
    terraPct: 0,
    vou: vou.length,
    talvez: presencas.filter((p) => p.status === 'talvez').length,
    confirmados: vou.map((p) => um(p.perfis)?.nome ?? '').filter(Boolean),
    imagem: imagemPadrao,
    quando: d.getTime() >= agora - 12 * 3600_000 ? 'proximos' : 'passados',
    descricao: l.descricao ?? '',
    servidor: true,
    minhaPresenca:
      (presencas.find((p) => p.usuario_id === meuId)?.status as PresencaPasseio | undefined) ?? null,
  };
}

async function meuId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Passeios do meu capítulo e gerais (a RLS deixa todos os membros lerem), do mais próximo ao mais distante. */
export async function listarPasseios(agora: number = Date.now()): Promise<Passeio[]> {
  if (!supabase) return [];
  try {
    const id = await meuId();
    const { data, error } = await supabase
      .from('passeios')
      .select(
        'id, titulo, descricao, data, ponto_encontro, rota, capitulos(nome), perfis!criador(nome, papel), presencas(usuario_id, status, perfis!usuario_id(nome))',
      )
      .order('data', { ascending: true })
      .limit(100);
    if (error || !Array.isArray(data)) return [];
    const todos = (data as unknown as LinhaPasseio[]).map((l) => linhaParaPasseio(l, id, agora));
    return [
      ...todos.filter((p) => p.quando === 'proximos'),
      ...todos.filter((p) => p.quando === 'passados').reverse(),
    ];
  } catch {
    return [];
  }
}

export type NovoPasseio = {
  titulo: string;
  descricao?: string;
  data: Date;
  pontoEncontro?: string;
  destino?: string;
};

/** "dd/mm/aaaa" + "hh:mm" (ou "19h30") → data futura; null se inválida ou no passado. */
export function montarData(dia: string, hora: string, agora: number = Date.now()): Date | null {
  const d = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dia.trim());
  const h = /^(\d{1,2})\s*[:h]\s*(\d{2})?$/.exec(hora.trim());
  if (!d || !h) return null;
  const [dd, mm, aaaa, hh, mi] = [Number(d[1]), Number(d[2]), Number(d[3]), Number(h[1]), Number(h[2] ?? 0)];
  const data = new Date(aaaa, mm - 1, dd, hh, mi);
  if (data.getDate() !== dd || data.getMonth() !== mm - 1 || hh > 23 || mi > 59) return null;
  return data.getTime() > agora ? data : null;
}

/** Cria o passeio no meu capítulo. A RLS recusa quem não é diretoria/admin (devolve false). */
export async function criarPasseio(p: NovoPasseio): Promise<boolean> {
  if (!supabase) return false;
  try {
    const id = await meuId();
    if (!id) return false;
    const { data: perfil, error: e1 } = await supabase
      .from('perfis')
      .select('capitulo_id')
      .eq('id', id)
      .maybeSingle();
    const capitulo = (perfil as { capitulo_id: string | null } | null)?.capitulo_id;
    if (e1 || !capitulo) return false;
    const { error } = await supabase.from('passeios').insert({
      capitulo_id: capitulo,
      criador: id,
      titulo: p.titulo.trim(),
      descricao: p.descricao?.trim() || null,
      data: p.data.toISOString(),
      ponto_encontro: p.pontoEncontro?.trim() || null,
      rota: p.destino?.trim() ? { destino: p.destino.trim() } : null,
    });
    return !error;
  } catch {
    return false;
  }
}

/** Marca "vou"/"talvez" ou desmarca (null). O grupo do passeio é ajustado pelo banco. */
export async function responderPasseio(passeioId: string, status: PresencaPasseio | null): Promise<boolean> {
  if (!supabase) return false;
  try {
    const id = await meuId();
    if (!id) return false;
    if (status === null) {
      const { error } = await supabase
        .from('presencas')
        .delete()
        .eq('passeio_id', passeioId)
        .eq('usuario_id', id);
      return !error;
    }
    // Só a coluna status pode ser atualizada: tenta atualizar e, se não havia linha, insere.
    const { data, error } = await supabase
      .from('presencas')
      .update({ status })
      .eq('passeio_id', passeioId)
      .eq('usuario_id', id)
      .select('passeio_id');
    if (error) return false;
    if (Array.isArray(data) && data.length > 0) return true;
    const { error: e2 } = await supabase
      .from('presencas')
      .insert({ passeio_id: passeioId, usuario_id: id, status });
    return !e2;
  } catch {
    return false;
  }
}
