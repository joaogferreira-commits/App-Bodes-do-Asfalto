import { espaco, toque } from '@/theme';

export type Acao = 'alerta' | 'reagrupar' | 'postoProximo' | 'postoNaRota' | 'sos' | 'encerrar';

/**
 * Ordem da grade (R4, R6): ações de um toque em cima; SOS e Encerrar (segurar) juntos na última
 * linha, sempre no mesmo lugar. Em pé: 2 colunas × 3 linhas (botões de ~150 × 120 dp);
 * deitado: 3 × 2.
 */
export const ordemAcoes: Acao[] = ['alerta', 'reagrupar', 'postoProximo', 'postoNaRota', 'sos', 'encerrar'];

/** Tamanho dos botões a partir da largura disponível (lado menor ≥ 113 dp, espaço ≥ 24 dp). */
export function medidasGrade(larguraDisponivel: number, deitado: boolean) {
  const colunas = deitado ? 3 : 2;
  const margem = espaco.sm;
  const vao = toque.pilotandoEspaco;
  const largura = Math.floor((larguraDisponivel - 2 * margem - (colunas - 1) * vao) / colunas);
  return { colunas, largura, altura: toque.pilotando, vao, margem };
}
