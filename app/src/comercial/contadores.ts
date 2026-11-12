/**
 * Contadores ANÔNIMOS do Guia (docs/COMERCIAL.md, Renata): só negócio + dia + tipo, nunca o irmão.
 * Hoje ficam numa fila no aparelho; com o Supabase viram uma chamada a uma função que só soma +1.
 * Para não contar a mesma pessoa várias vezes no dia, o próprio celular lembra o que já contou.
 */
export type TipoEvento = 'visto' | 'vitrine' | 'whatsapp' | 'ligar' | 'rota' | 'beneficio' | 'recomendo';
export type Evento = { negocio: string; tipo: TipoEvento; dia: string };

const contadosHoje = new Set<string>();
const fila: Evento[] = [];

export function registrarEvento(negocio: string, tipo: TipoEvento, agora = new Date()): Evento | null {
  const dia = agora.toISOString().slice(0, 10);
  const chave = `${dia}|${negocio}|${tipo}`;
  if ((tipo === 'visto' || tipo === 'vitrine') && contadosHoje.has(chave)) return null;
  contadosHoje.add(chave);
  const e: Evento = { negocio, tipo, dia };
  fila.push(e);
  return e;
}

export const eventosPendentes = () => [...fila];

/** Relatório: números pequenos viram "menos de 5" (ninguém deduz quem foi). */
export const mostrarContagem = (n: number) => (n < 5 ? '<5' : String(n));
