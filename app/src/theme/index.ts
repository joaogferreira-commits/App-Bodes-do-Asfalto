import { cores, espaco, fontes, movimento, profundidade, raios, tamanhoTexto, toque } from './tokens';

/**
 * Tema trocável: nome, logo, cores e fontes vêm daqui.
 * O nome e o escudo podem mudar conforme a licença da marca.
 */
export const tema = {
  marca: {
    nome: 'Bodes do Asfalto',
    nomeCurto: 'Bodes',
  },
  cores,
  fontes,
  tamanhoTexto,
  raios,
  espaco,
  toque,
  profundidade,
  movimento,
} as const;

export type Tema = typeof tema;
export * from './tokens';
export { contraste } from './contraste';
