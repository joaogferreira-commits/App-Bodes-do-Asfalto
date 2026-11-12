/**
 * Stories v2 (pedido do dono em 12/11/2026): vídeo até 60 s, filtros e legenda rica.
 * Filtros são camadas de cor aplicadas na hora de mostrar (foto e vídeo), guardadas pelo nome:
 * não alteram o arquivo original, funcionam igual em qualquer celular e não usam reconhecimento facial.
 */
export type Filtro = 'nenhum' | 'quente' | 'por-do-sol' | 'estrada' | 'noite' | 'poeira' | 'vinheta';

export const filtros: { id: Filtro; camadas: { cor: string; opacidade: number }[]; vinheta?: boolean }[] = [
  { id: 'nenhum', camadas: [] },
  { id: 'quente', camadas: [{ cor: '#FF8A3D', opacidade: 0.18 }] },
  {
    id: 'por-do-sol',
    camadas: [
      { cor: '#FF5E3A', opacidade: 0.16 },
      { cor: '#6B2BAE', opacidade: 0.1 },
    ],
  },
  { id: 'estrada', camadas: [{ cor: '#3A2A1A', opacidade: 0.22 }] },
  { id: 'noite', camadas: [{ cor: '#0B1E3A', opacidade: 0.35 }] },
  { id: 'poeira', camadas: [{ cor: '#C9A66B', opacidade: 0.25 }] },
  { id: 'vinheta', camadas: [], vinheta: true },
];

export type EstiloTexto = 'classico' | 'forte' | 'condensado' | 'estrada';
export type FundoTexto = 'nenhum' | 'faixa' | 'caixa';
export type PosicaoTexto = 'topo' | 'meio' | 'base';
export type TamanhoTexto = 'p' | 'm' | 'g';

export const estilosTexto: EstiloTexto[] = ['classico', 'forte', 'condensado', 'estrada'];
export const coresTexto = ['#F3EADB', '#FFFFFF', '#E8692A', '#F5C518', '#0B0907'] as const;
export const fundosTexto: FundoTexto[] = ['nenhum', 'faixa', 'caixa'];
export const posicoesTexto: PosicaoTexto[] = ['topo', 'meio', 'base'];
export const tamanhosTexto: Record<TamanhoTexto, number> = { p: 22, m: 30, g: 42 };

export type CamadaTexto = {
  id: string;
  texto: string;
  estilo: EstiloTexto;
  cor: string;
  fundo: FundoTexto;
  posicao: PosicaoTexto;
  tamanho: TamanhoTexto;
};

/** Selos que o irmão cola no story (sem GPS: local é digitado). */
export type Selos = { mencao?: string; local?: string; km?: number };

export type ConteudoStory = {
  uri: string;
  tipo: 'foto' | 'video';
  filtro: Filtro;
  textos: CamadaTexto[];
  selos: Selos;
};

export const DURACAO_MAX_VIDEO_S = 60;

/** Cor do texto que aparece sobre o fundo escolhido (contraste ≥ 4.5:1 na faixa/caixa). */
export function corDoFundo(cor: string, fundo: FundoTexto) {
  if (fundo === 'nenhum') return 'transparent';
  const escuro = cor === '#0B0907';
  return fundo === 'faixa'
    ? escuro
      ? 'rgba(243,234,219,0.85)'
      : 'rgba(11,9,7,0.6)'
    : escuro
      ? '#F3EADB'
      : '#0B0907';
}
