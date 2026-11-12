import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente do Supabase (Etapa B). Usa só a chave PÚBLICA (anon/publishable) vinda das variáveis do EAS;
 * a proteção dos dados é a RLS do banco. Nunca a service_role no app.
 * Sem as variáveis (testes, versões antigas), o app continua no modo local.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const chave = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const servidorConfigurado = /^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url) && chave.length > 20;

export const supabase: SupabaseClient | null = servidorConfigurado
  ? createClient(url, chave, {
      auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    })
  : null;
