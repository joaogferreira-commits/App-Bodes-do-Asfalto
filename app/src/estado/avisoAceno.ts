import type { TFunction } from 'i18next';
import { Alert } from 'react-native';

import { acenar, type MotivoErroAceno } from '@/servidor/chat';

/** Mostra o resultado de um aceno enviado ao servidor (limite do dia, repetido, falha ou sucesso). */
export function avisarResultadoAceno(resultado: 'ok' | MotivoErroAceno, nome: string, t: TFunction) {
  if (resultado === 'ok') Alert.alert(t('ficha.acenoEnviado', { nome }), t('ficha.acenoExplica'));
  else if (resultado === 'limite') Alert.alert(t('ficha.limiteAcenos'));
  else if (resultado === 'repetido') Alert.alert(t('chat.jaAcenou', { nome }));
  else Alert.alert(t('chat.acenoFalhou'));
}

/** Envia o aceno ao servidor e devolve 'ok' ou o motivo da falha. */
export async function enviarAceno(para: string): Promise<'ok' | MotivoErroAceno> {
  try {
    await acenar(para);
    return 'ok';
  } catch (e) {
    return (e as { motivo?: MotivoErroAceno } | null)?.motivo ?? 'erro';
  }
}
