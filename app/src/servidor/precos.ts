import { supabase } from './supabase';

/**
 * Preços de combustível informados pelos irmãos (public.precos_colaborativos), sempre com data.
 * Complementam os da ANP. Qualquer falha devolve false/lista vazia: o app segue sem aviso técnico.
 */
export type ProdutoIrmao = 'gasolina_comum' | 'etanol' | 'diesel_s10';

export type PrecoIrmao = {
  postoId: string;
  produto: ProdutoIrmao | 'diesel';
  valor: number;
  criadoEm: string;
};

/** Só os postos que vêm do banco ('node/123', 'anp/<cnpj>') existem no servidor. */
export const ehPostoDoServidor = (id: string) => /^(anp\/\d{14}|(node|way|relation)\/\d+)$/.test(id);

/** valor em reais (ex.: 6.29). Devolve true se o servidor gravou. */
export async function informarPreco(postoId: string, produto: ProdutoIrmao, valor: number): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('precos_colaborativos')
      .insert({ posto_id: postoId, produto, valor });
    return !error;
  } catch {
    return false;
  }
}

type Linha = { posto_id: string; produto: string; valor: number | string; criado_em: string };

/** Último preço de cada produto por posto (últimos 30 dias). */
export async function ultimosPrecos(ids: string[]): Promise<PrecoIrmao[]> {
  const validos = ids.filter(ehPostoDoServidor);
  if (!supabase || !validos.length) return [];
  try {
    const { data, error } = await supabase.rpc('ultimos_precos', { p_posto_ids: validos });
    if (error || !Array.isArray(data)) return [];
    return (data as Linha[])
      .map((l) => ({
        postoId: l.posto_id,
        produto: l.produto as PrecoIrmao['produto'],
        valor: Number(l.valor),
        criadoEm: l.criado_em,
      }))
      .filter((p) => Number.isFinite(p.valor));
  } catch {
    return [];
  }
}
