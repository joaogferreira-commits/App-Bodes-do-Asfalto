/**
 * Stories v2 (pedido do dono em 12/11/2026): vídeo até 60 s, filtros e legenda rica.
 * Filtros são camadas de cor aplicadas na hora de mostrar (foto e vídeo), guardadas pelo nome:
 * não alteram o arquivo original, funcionam igual em qualquer celular e não usam reconhecimento facial.
 */
export type Filtro =
  | 'nenhum'
  | 'quente'
  | 'por-do-sol'
  | 'estrada'
  | 'noite'
  | 'poeira'
  | 'vinheta'
  | 'frio'
  | 'cinema'
  | 'retro'
  | 'verao'
  | 'chuva'
  | 'ouro';

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
  { id: 'frio', camadas: [{ cor: '#3A7BD5', opacidade: 0.16 }] },
  {
    id: 'cinema',
    camadas: [
      { cor: '#0E4D4A', opacidade: 0.18 },
      { cor: '#FF7A2F', opacidade: 0.08 },
    ],
    vinheta: true,
  },
  {
    id: 'retro',
    camadas: [
      { cor: '#D9A441', opacidade: 0.2 },
      { cor: '#6E4B2A', opacidade: 0.12 },
    ],
  },
  { id: 'verao', camadas: [{ cor: '#FFC93C', opacidade: 0.15 }] },
  { id: 'chuva', camadas: [{ cor: '#5B6B7A', opacidade: 0.3 }] },
  { id: 'ouro', camadas: [{ cor: '#E8B04A', opacidade: 0.22 }], vinheta: true },
];

export type EstiloTexto = 'classico' | 'forte' | 'condensado' | 'estrada';
export type FundoTexto = 'nenhum' | 'faixa' | 'caixa';
export type PosicaoTexto = 'topo' | 'meio' | 'base';
export type TamanhoTexto = 'p' | 'm' | 'g';

export const estilosTexto: EstiloTexto[] = ['classico', 'forte', 'condensado', 'estrada'];
export const coresTexto = ['#F3EADB', '#FFFFFF', '#E8692A', '#F5C518', '#0B0907'] as const;
export const fundosTexto: FundoTexto[] = ['nenhum', 'faixa', 'caixa'];
export const posicoesTexto: PosicaoTexto[] = ['topo', 'meio', 'base'];
/** Altura (0–1) de cada posição pronta do texto. */
export const yDaPosicao = { topo: 0.15, meio: 0.45, base: 0.78 } as const;

/** Soma o arraste à posição atual, sem deixar o texto sair da tela. */
export function moverTexto(t: CamadaTexto, dx: number, dy: number): CamadaTexto {
  const lim = (v: number) => Math.min(0.95, Math.max(0.05, v));
  return { ...t, x: lim((t.x ?? 0.5) + dx), y: lim((t.y ?? yDaPosicao[t.posicao]) + dy) };
}

export const tamanhosTexto: Record<TamanhoTexto, number> = { p: 22, m: 30, g: 42 };

export type CamadaTexto = {
  id: string;
  texto: string;
  estilo: EstiloTexto;
  cor: string;
  fundo: FundoTexto;
  posicao: PosicaoTexto;
  tamanho: TamanhoTexto;
  /** posição livre depois de arrastar (0–1 da largura/altura); sem ela vale "posicao" */
  x?: number;
  y?: number;
};

/** Desenho com o dedo: caminho SVG em coordenadas 0–1000 (independe do tamanho da tela). */
export type Traco = { d: string; cor: string; espessura: number };

/** Selos interativos (como nos apps de stories): enquete, pergunta e contagem regressiva. */
export type Interativo =
  | { tipo: 'enquete'; pergunta: string; opcoes: [string, string] }
  | { tipo: 'pergunta'; texto: string }
  | { tipo: 'contagem'; titulo: string; data: string };

export const velocidades = [0.5, 1, 2] as const;
export type Velocidade = (typeof velocidades)[number];

/** Selos que o irmão cola no story (sem GPS: local é digitado). */
export type Selos = { mencao?: string; local?: string; km?: number };

export type ConteudoStory = {
  uri: string;
  tipo: 'foto' | 'video';
  filtro: Filtro;
  textos: CamadaTexto[];
  selos: Selos;
  tracos?: Traco[];
  interativos?: Interativo[];
  /** só vídeo: lento (0,5×), normal ou rápido (2×) */
  velocidade?: Velocidade;
};

/** Converte pontos da tela em caminho SVG normalizado 0–1000. */
export function caminhoDe(pontos: { x: number; y: number }[], largura: number, altura: number) {
  if (pontos.length < 2 || largura <= 0 || altura <= 0) return '';
  const n = (p: { x: number; y: number }) =>
    `${Math.round((p.x / largura) * 1000)} ${Math.round((p.y / altura) * 1000)}`;
  return (
    `M${n(pontos[0]!)}` +
    pontos
      .slice(1)
      .map((p) => ` L${n(p)}`)
      .join('')
  );
}

/** Dias que faltam para a contagem regressiva (nunca negativo). */
export function diasAte(data: string, hoje = new Date()) {
  return Math.max(0, Math.ceil((Date.parse(data) - hoje.getTime()) / 86400000));
}

/** Zoom da câmera em "vezes" (1×, 2×, 4×) para o valor 0–1 do expo-camera. */
export const zoomDasVezes: Record<1 | 2 | 4, number> = { 1: 0, 2: 0.2, 4: 0.45 };

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
