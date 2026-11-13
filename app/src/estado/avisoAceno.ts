import type { TFunction } from 'i18next';

import { acenar, type MotivoErroAceno } from '@/servidor/chat';
import { avisar } from '@/ui/dialogo';

/** Mostra o resultado de um aceno enviado ao servidor (limite do dia, repetido, falha ou sucesso). */
export function avisarResultadoAceno(resultado: 'ok' | MotivoErroAceno, nome: string, t: TFunction) {
  if (resultado === 'ok') avisar(t('ficha.acenoEnviado', { nome }), t('ficha.acenoExplica'));
  else if (resultado === 'limite') avisar(t('ficha.limiteAcenos'));
  else if (resultado === 'repetido') avisar(t('chat.jaAcenou', { nome }));
  else avisar(t('chat.acenoFalhou'));
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
