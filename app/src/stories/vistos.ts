/** Stories já vistos nesta sessão (para o visualizador seguir só para quem tem story novo). */
const vistos = new Set<string>();

export const marcarVisto = (id: string) => void vistos.add(id);
export const foiVisto = (id: string) => vistos.has(id);
export const limparVistos = () => vistos.clear();

export type Gesto = 'proximo-irmao' | 'irmao-anterior' | 'fechar' | null;

/** Interpreta o arrastar do dedo: lado a lado troca de irmão, para baixo fecha. */
export function gestoDoArrasto(dx: number, dy: number): Gesto {
  if (dy > 80 && dy > Math.abs(dx)) return 'fechar';
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'proximo-irmao' : 'irmao-anterior';
  return null;
}
