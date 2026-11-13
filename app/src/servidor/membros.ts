import { supabase } from './supabase';

/**
 * Lista de membros (nome, apelido, capítulo: visível a todos os membros) e aniversários.
 * Aniversário (só dia e mês) fica escondido por padrão; o servidor só o devolve se o irmão escolheu mostrar.
 */
export type Aniversario = { dia: number; mes: number };
export type Membro = {
  id: string;
  nome: string;
  apelido: string;
  capitulo: string;
  aniversario: Aniversario | null;
};
export type MeuAniversario = Aniversario & { visivel: boolean };

function exigir() {
  if (!supabase) throw new Error('servidor não configurado');
  return supabase;
}

type LinhaMembro = {
  id: string;
  nome: string;
  apelido: string | null;
  capitulo: string | null;
  aniversario_dia: number | null;
  aniversario_mes: number | null;
};

export async function listarMembros(): Promise<Membro[]> {
  const { data, error } = await exigir().rpc('membros_lista');
  if (error) throw error;
  return ((data ?? []) as LinhaMembro[]).map((m) => ({
    id: m.id,
    nome: m.nome,
    apelido: m.apelido ?? '',
    capitulo: m.capitulo ?? '',
    aniversario:
      m.aniversario_dia != null && m.aniversario_mes != null
        ? { dia: m.aniversario_dia, mes: m.aniversario_mes }
        : null,
  }));
}

/** Dia e mês válidos (29/02 vale: o aniversário cai em 28/02 nos anos comuns). */
export function aniversarioValido(dia: number, mes: number): boolean {
  if (!Number.isInteger(dia) || !Number.isInteger(mes) || mes < 1 || mes > 12 || dia < 1) return false;
  const max = mes === 2 ? 29 : [4, 6, 9, 11].includes(mes) ? 30 : 31;
  return dia <= max;
}

export async function meuAniversario(): Promise<MeuAniversario | null> {
  const { data, error } = await exigir().from('perfis_aniversario').select('dia, mes, visivel').maybeSingle();
  if (error) throw error;
  return data ? { dia: data.dia, mes: data.mes, visivel: data.visivel } : null;
}

export async function salvarAniversario(a: MeuAniversario): Promise<void> {
  if (!aniversarioValido(a.dia, a.mes)) throw new Error('data inválida');
  const sb = exigir();
  const { data } = await sb.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('sem sessão');
  const { error } = await sb
    .from('perfis_aniversario')
    .upsert({ id, dia: a.dia, mes: a.mes, visivel: a.visivel });
  if (error) throw error;
}

export async function removerAniversario(): Promise<void> {
  const sb = exigir();
  const { data } = await sb.auth.getUser();
  const id = data.user?.id;
  if (!id) return;
  const { error } = await sb.from('perfis_aniversario').delete().eq('id', id);
  if (error) throw error;
}

/** Dias até o próximo aniversário (0 = hoje). */
export function diasAteAniversario(a: Aniversario, hoje = new Date()): number {
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  for (let ano = inicio.getFullYear(); ano <= inicio.getFullYear() + 1; ano++) {
    // 29/02 em ano comum vira 28/02
    const d = new Date(ano, a.mes - 1, a.dia);
    if (d.getMonth() !== a.mes - 1) d.setTime(new Date(ano, a.mes - 1, a.dia - 1).getTime());
    if (d >= inicio) return Math.round((d.getTime() - inicio.getTime()) / 86400000);
  }
  return 365;
}

/** Quem mostrou o aniversário, do mais próximo ao mais distante (ou só os dos próximos `dentroDeDias`). */
export function aniversariantes(membros: Membro[], hoje = new Date(), dentroDeDias = 366) {
  return membros
    .filter((m): m is Membro & { aniversario: Aniversario } => !!m.aniversario)
    .map((m) => ({ membro: m, dias: diasAteAniversario(m.aniversario, hoje) }))
    .filter((x) => x.dias <= dentroDeDias)
    .sort((a, b) => a.dias - b.dias || a.membro.nome.localeCompare(b.membro.nome));
}

/** Nome do capítulo do irmão logado (para a carteirinha "Sou membro"). */
export async function meuCapitulo(): Promise<string | null> {
  const sb = exigir();
  const { data: u } = await sb.auth.getUser();
  const id = u.user?.id;
  if (!id) return null;
  const { data } = await sb.from('perfis').select('capitulo:capitulos(nome)').eq('id', id).maybeSingle();
  const c = (data as { capitulo?: { nome: string } | { nome: string }[] | null } | null)?.capitulo;
  const nome = Array.isArray(c) ? c[0]?.nome : c?.nome;
  return nome ?? null;
}
