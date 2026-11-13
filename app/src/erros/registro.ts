import AsyncStorage from '@react-native-async-storage/async-storage';

/** Últimos erros guardados no aparelho (sem dados sensíveis), úteis quando não há envio configurado. */
export const CHAVE_ERROS = 'bodes.erros';
export const MAX_ERROS = 20;

export type ErroRegistrado = { quando: string; nome: string; mensagem: string; pilha?: string };

export async function lerErros(): Promise<ErroRegistrado[]> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE_ERROS);
    return bruto ? (JSON.parse(bruto) as ErroRegistrado[]) : [];
  } catch {
    return [];
  }
}

export async function guardarErro(erro: unknown): Promise<void> {
  const e = erro instanceof Error ? erro : new Error(String(erro));
  const item: ErroRegistrado = {
    quando: new Date().toISOString(),
    nome: e.name,
    mensagem: e.message.slice(0, 300),
    pilha: e.stack?.split('\n').slice(0, 8).join('\n'),
  };
  const lista = [...(await lerErros()), item].slice(-MAX_ERROS);
  await AsyncStorage.setItem(CHAVE_ERROS, JSON.stringify(lista)).catch(() => undefined);
}

export const textoDosErros = (lista: ErroRegistrado[]) =>
  lista.map((e) => `${e.quando} ${e.nome}: ${e.mensagem}${e.pilha ? `\n${e.pilha}` : ''}`).join('\n\n');
