import { cores, espaco, fontes, movimento, raios, sombra, tamanhoTexto, toque } from './tokens';

/**
 * Tema trocável: nome, cores e fontes vêm daqui.
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
  sombra,
  movimento,
} as const;

export type Tema = typeof tema;
export * from './tokens';
export { contraste } from './contraste';
