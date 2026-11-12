import { espaco, toque } from '@/theme';

export type Acao = 'alerta' | 'reagrupar' | 'postoProximo' | 'postoNaRota' | 'sos' | 'encerrar';

/**
 * Ordem da grade (R6): 3 colunas × 2 linhas. Em cima Alerta · Reagrupar · SOS (SOS sempre no canto
 * de cima à direita); embaixo Posto próximo · Posto na rota · Encerrar.
 * Decisão do dono em 12/11/2026: botões menores (~100 × 92 dp) para sobrar mapa — a grade ocupa
 * menos de 30 % da tela. SOS e Encerrar continuam exigindo segurar.
 */
export const ordemAcoes: Acao[] = ['alerta', 'reagrupar', 'sos', 'postoProximo', 'postoNaRota', 'encerrar'];

/** Tamanho dos botões a partir da largura disponível (sempre 3 colunas). */
export function medidasGrade(larguraDisponivel: number, deitado: boolean) {
  const colunas = 3;
  void deitado;
  const margem = espaco.sm;
  const vao = toque.pilotandoEspaco;
  const largura = Math.floor((larguraDisponivel - 2 * margem - (colunas - 1) * vao) / colunas);
  return { colunas, largura, altura: toque.pilotando, vao, margem };
}
