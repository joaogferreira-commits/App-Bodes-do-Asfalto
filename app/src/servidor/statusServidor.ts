import { servidorConfigurado, supabase } from '@/servidor/supabase';

export const LIMITE_PING_MS = 8000;

export type ResultadoPing = { ok: true; ms: number } | { ok: false; erro: string };

/** Só os 6 primeiros caracteres do endereço (nunca a chave). Vazio se o servidor não está configurado. */
export function enderecoCurto(url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''): string {
  const m = /^https:\/\/([a-z0-9]+)\.supabase\.co/.exec(url);
  return m?.[1] ? `${m[1].slice(0, 6)}…supabase.co` : '';
}

/** Mede uma chamada simples ao servidor (só conta linhas, sem baixar dados), com limite de 8 s. */
export async function testarConexao(): Promise<ResultadoPing> {
  if (!supabase) return { ok: false, erro: 'not configured' };
  const inicio = Date.now();
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  try {
    const limite = new Promise<never>((_, rejeitar) => {
      temporizador = setTimeout(() => rejeitar(new Error('timeout')), LIMITE_PING_MS);
    });
    const consulta = Promise.resolve(supabase.from('capitulos').select('id', { head: true, count: 'exact' }));
    const { error } = await Promise.race([consulta, limite]);
    if (error) return { ok: false, erro: String(error.message ?? error).slice(0, 120) };
    return { ok: true, ms: Date.now() - inicio };
  } catch (e) {
    return { ok: false, erro: (e instanceof Error ? e.message : String(e)).slice(0, 120) };
  } finally {
    if (temporizador) clearTimeout(temporizador);
  }
}

export { servidorConfigurado };
