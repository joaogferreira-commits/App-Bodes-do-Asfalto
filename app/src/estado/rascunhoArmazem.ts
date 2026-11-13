import AsyncStorage from '@react-native-async-storage/async-storage';

/** Prefixo de todos os rascunhos (também começa com "bodes.", então sair/excluir conta já os apagam). */
export const PREFIXO_RASCUNHO = 'bodes.rascunho.';
export const VALIDADE_PADRAO_MS = 24 * 60 * 60 * 1000;

export const chaveRascunho = (chave: string, dono?: string) =>
  `${PREFIXO_RASCUNHO}${dono ?? 'anonimo'}.${chave}`;

/** Apaga todos os rascunhos do aparelho (ao sair da conta). */
export async function limparTodosRascunhos() {
  const chaves = (await AsyncStorage.getAllKeys().catch(() => [] as readonly string[])).filter((k) =>
    k.startsWith(PREFIXO_RASCUNHO),
  );
  if (chaves.length) await AsyncStorage.multiRemove(chaves).catch(() => undefined);
}
