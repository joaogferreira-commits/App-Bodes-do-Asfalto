import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente do Supabase (Etapa B). Usa só a chave PÚBLICA (anon/publishable) vinda das variáveis do EAS;
 * a proteção dos dados é a RLS do banco. Nunca a service_role no app.
 * Sem as variáveis (testes, versões antigas), o app continua no modo local.
 */
/** Limpa o endereço colado pelo dono: espaços, quebras de linha, aspas, maiúsculas e caminhos extras (/rest/v1…). */
export function normalizarUrl(bruto: string): string {
  const limpo = bruto
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();
  const achado = /^(?:https?:\/\/)?([a-z0-9-]+)\.supabase\.co(?:[/?#].*)?$/i.exec(limpo);
  return achado?.[1] ? `https://${achado[1].toLowerCase()}.supabase.co` : '';
}

/** A chave pública não tem espaços nem aspas; tira o que vier colado junto. */
export function normalizarChave(bruta: string): string {
  return bruta
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();
}

const url = normalizarUrl(process.env.EXPO_PUBLIC_SUPABASE_URL ?? '');
const chave = normalizarChave(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '');

/** Diagnóstico de cada peça, para a tela "Status do servidor". */
export const pecasServidor = {
  urlBruta: (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').length > 0,
  urlValida: url.length > 0,
  chavePresente: chave.length > 0,
  chaveValida: chave.length > 20 && !/\s/.test(chave),
};

export const servidorConfigurado = pecasServidor.urlValida && pecasServidor.chaveValida;

export const supabase: SupabaseClient | null = servidorConfigurado
  ? createClient(url, chave, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    })
  : null;
