import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

import { limparEvento, limparMigalha } from './limpeza';
import { guardarErro } from './registro';

let ativo = false;

export const erroAtivo = () => ativo;

/** Liga o envio de erros só se houver DSN (compilação de teste/produção). Devolve se ligou. */
export function iniciarErros(): boolean {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return false;
  const versao = Constants.expoConfig?.version ?? '0.0.0';
  Sentry.init({
    dsn,
    enableNative: true,
    enableNativeCrashHandling: true,
    environment: process.env.EXPO_PUBLIC_AMBIENTE ?? (__DEV__ ? 'development' : 'preview'),
    release: `bodes-do-asfalto@${versao}`,
    dist: versao,
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    tracesSampleRate: 0,
    beforeSend: (evento) => limparEvento(evento),
    beforeBreadcrumb: (migalha) => limparMigalha(migalha),
  });
  ativo = true;
  return true;
}

/** Registra o erro: envia (se ligado) e guarda os últimos 20 no aparelho. Devolve o id do envio. */
export function relatarErro(erro: unknown, extra?: Record<string, string>): string | undefined {
  void guardarErro(erro);
  if (!ativo) return undefined;
  return Sentry.captureException(erro, extra ? { tags: extra } : undefined);
}

/** Comentário opcional da pessoa, ligado ao erro (sem nome nem e-mail). */
export function enviarDetalhes(comentario: string, idErro?: string): void {
  const texto = comentario.trim();
  if (!ativo || !texto) return;
  if (idErro) Sentry.captureFeedback({ message: texto, associatedEventId: idErro });
  else Sentry.captureMessage(`Comentário do usuário: ${texto}`);
}
