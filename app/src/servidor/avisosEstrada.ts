import type { Coordenada } from '@/navegacao/destinos';
import {
  lerAviso,
  marcadorAlerta,
  marcadorReagrupar,
  type AvisoEstrada,
  type TipoAlerta,
} from '@/navegacao/avisosEstrada';

import * as chat from './chat';

/**
 * Grupo que recebe os avisos: o comboio ou, se não houver, o passeio em que o irmão confirmou presença
 * (a conversa do passeio só existe para quem disse "vou"). Pega o mais recente. Sem grupo, devolve null.
 */
export async function conversaDoComboio(): Promise<string | null> {
  try {
    const { conversas } = await chat.listarConversas();
    const grupos = conversas.filter((c) => c.tipo === 'comboio' || c.tipo === 'passeio');
    const recente = (l: typeof grupos) =>
      [...l].sort((a, b) => (b.ultimaEm ?? '').localeCompare(a.ultimaEm ?? ''))[0];
    return (recente(grupos.filter((c) => c.tipo === 'comboio')) ?? recente(grupos))?.id ?? null;
  } catch {
    return null;
  }
}

/** Envia o alerta ao grupo. Devolve false se não há grupo ou o envio falhou. */
export async function enviarAlerta(
  conversa: string | null,
  alerta: TipoAlerta,
  posicao: Coordenada | null,
): Promise<boolean> {
  if (!conversa) return false;
  try {
    await chat.enviar(conversa, marcadorAlerta(alerta, posicao), true);
    return true;
  } catch {
    return false;
  }
}

export async function enviarReagrupar(conversa: string | null, posicao: Coordenada | null): Promise<boolean> {
  if (!conversa) return false;
  try {
    await chat.enviar(conversa, marcadorReagrupar(posicao), true);
    return true;
  } catch {
    return false;
  }
}

/** Escuta avisos de outros irmãos no grupo (mensagens comuns e as minhas são ignoradas). */
export function ouvirAvisos(
  conversa: string,
  aoChegar: (a: AvisoEstrada, autor: string) => void,
): () => void {
  try {
    return chat.assinar(conversa, (m) => {
      if (m.minha) return;
      const a = lerAviso(m.texto);
      if (a) aoChegar(a, m.autor);
    });
  } catch {
    return () => undefined;
  }
}
