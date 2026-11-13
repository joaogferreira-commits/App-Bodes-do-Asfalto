import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';

/**
 * Notificações push (P6). O app guarda o Expo push token em tokens_push (só o dono lê/escreve, RLS)
 * e as preferências em preferencias_notificacao. O envio é feito pela Edge Function "notificar".
 * LGPD: a prévia nunca mostra o conteúdo da mensagem (o servidor manda só "Nova mensagem").
 */
export const TIPOS_NOTIFICACAO = [
  'mensagem',
  'aceno',
  'aprovacao',
  'passeio',
  'confraternizacao',
  'sos',
] as const;
export type TipoNotificacao = (typeof TIPOS_NOTIFICACAO)[number];

/** O SOS é segurança: sempre ligado, não pode ser desligado. */
export const TIPO_SEMPRE_LIGADO: TipoNotificacao = 'sos';

function exigir() {
  if (!supabase) throw new Error('servidor não configurado');
  return supabase;
}

/** Pede a permissão (só se ainda não foi decidida) e devolve se está concedida. */
export async function permissaoConcedida(pedir: boolean): Promise<boolean> {
  const atual = await Notifications.getPermissionsAsync();
  if (atual.granted) return true;
  if (!pedir || atual.canAskAgain === false) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function obterToken(): Promise<string | null> {
  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
    ?.projectId;
  if (!projectId) return null;
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data || null;
}

/** Canal Android (obrigatório para a notificação aparecer e usar a cor da marca). */
async function prepararCanal() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: AndroidImportance.DEFAULT,
    lightColor: '#E8692A',
  });
}

/** Grava (upsert) o token deste aparelho para o irmão logado. Devolve false se não foi possível. */
export async function registrarToken(opcoes: { pedirPermissao: boolean }): Promise<boolean> {
  const sb = exigir();
  const { data: sessao } = await sb.auth.getUser();
  const uid = sessao.user?.id;
  if (!uid) return false;
  await prepararCanal();
  if (!(await permissaoConcedida(opcoes.pedirPermissao))) return false;
  const token = await obterToken();
  if (!token) return false;
  const { error } = await sb.from('tokens_push').upsert(
    {
      usuario_id: uid,
      token,
      plataforma: Platform.OS === 'ios' ? 'ios' : 'android',
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: 'usuario_id,token' },
  );
  if (error) throw error;
  return true;
}

/** Apaga o token deste aparelho (chamar ANTES de encerrar a sessão). Nunca lança erro. */
export async function apagarToken(): Promise<void> {
  try {
    if (!supabase) return;
    const token = await obterToken();
    if (!token) return;
    await supabase.from('tokens_push').delete().eq('token', token);
  } catch {
    // sem rede ou sem permissão: o servidor também descarta tokens inválidos
  }
}

/** Preferências do irmão: ausência de linha = ligado. O SOS sempre aparece ligado. */
export async function carregarPreferencias(): Promise<Record<TipoNotificacao, boolean>> {
  const { data, error } = await exigir().from('preferencias_notificacao').select('tipo, ligado');
  if (error) throw error;
  const r = Object.fromEntries(TIPOS_NOTIFICACAO.map((t) => [t, true])) as Record<TipoNotificacao, boolean>;
  for (const l of (data ?? []) as { tipo: string; ligado: boolean }[]) {
    if ((TIPOS_NOTIFICACAO as readonly string[]).includes(l.tipo)) r[l.tipo as TipoNotificacao] = l.ligado;
  }
  r[TIPO_SEMPRE_LIGADO] = true;
  return r;
}

export async function salvarPreferencia(tipo: TipoNotificacao, ligado: boolean): Promise<void> {
  if (tipo === TIPO_SEMPRE_LIGADO) return; // SOS não desliga
  const sb = exigir();
  const { data } = await sb.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error('sem sessão');
  const { error } = await sb
    .from('preferencias_notificacao')
    .upsert({ usuario_id: uid, tipo, ligado }, { onConflict: 'usuario_id,tipo' });
  if (error) throw error;
}

/** Só telas conhecidas: a rota vem do servidor e nunca pode abrir algo inesperado. */
export function rotaSegura(rota: unknown): string | null {
  if (typeof rota !== 'string') return null;
  if (/^\/conversa\/[0-9a-f-]{8,40}$/i.test(rota)) return rota;
  if (/^\/sos-ativo\/[0-9a-f-]{8,40}$/i.test(rota)) return rota;
  if (
    rota === '/' ||
    rota === '/conversas' ||
    rota === '/aprovacoes' ||
    rota === '/sos' ||
    rota === '/passeios'
  )
    return rota;
  return null;
}

/** Rota a abrir ao tocar na notificação (campo data.rota), ou null. */
export function rotaDaNotificacao(resposta: Notifications.NotificationResponse | null): string | null {
  const dados = resposta?.notification.request.content.data as { rota?: unknown } | undefined;
  return rotaSegura(dados?.rota);
}
