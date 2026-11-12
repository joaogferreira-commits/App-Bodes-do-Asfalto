/**
 * Tokens da interface (Interface v2 + pesquisa de usabilidade de 12/11/2026,
 * reports/Usabilidade e interface Bodes do Asfalto.md, R14–R25).
 * Único lugar com cores, fontes, raios e espaçamentos do app.
 * Regra: cada cor tem uma função só (laranja = ação; vermelho = só SOS; amarelo = só alerta).
 *
 * Duas paletas com as mesmas chaves:
 * - "noite" (padrão e identidade do clube): fundo #141110, não preto puro, para evitar halação (R16);
 * - "sol" (alto contraste para luz do dia forte): fundo claro, texto quase preto (R17).
 */
export const paletaNoite = {
  // fundos
  fundo: '#141110',
  superficie: '#1C1714',
  superficie2: '#241E19',
  superficie3: '#2C251E',
  /** Superfície opaca para botões e chips sobre o mapa (nada translúcido, R25). */
  sobreMapa: '#1C1714',
  linha: '#3A3027',
  linhaSuave: '#2C251F',
  linhaForte: '#5A4A3A',
  // texto
  texto: '#EFE3C8',
  textoSec: '#C2B39B',
  textoApagado: '#A39480',
  // função
  acao: '#E8692A',
  acaoPressionada: '#C2531C',
  textoSobreAcao: '#141110',
  sos: '#C62D22',
  sosPressionado: '#A1241B',
  textoSobreSos: '#FFF6EC',
  /** Anel claro em volta do SOS para destacá-lo do fundo escuro (≥ 3:1). */
  contornoSos: '#FFF6EC',
  alerta: '#F5C518',
  textoSobreAlerta: '#141110',
  // categorias
  ouro: '#D8A93B',
  textoSobreOuro: '#141110',
  verdePosto: '#3FA27A',
  azulRio: '#7FA6C2',
  /** Anel "na estrada" (jeans clareado, 6:1 sobre o fundo). */
  estrada: '#6F95B8',
  // mapa
  asfalto: '#E9DCC4',
  viaLocal: '#7A6A54',
  terra: '#C68A45',
  terraEscura: '#5A3E1F',
  rotaTerra: '#F3D9B8',
  contornoRota: '#141110',
  pisoDesconhecido: '#8C857B',
  agua: '#22323D',
  rio: '#3D6E8F',
  vegetacao: '#1C2318',
  chao: '#1A1612',
} as const;

export type NomeCor = keyof typeof paletaNoite;
export type Paleta = Record<NomeCor, string>;

export const paletaSol: Paleta = {
  fundo: '#EFE9DF',
  superficie: '#FBF8F3',
  superficie2: '#FFFFFF',
  superficie3: '#E6DDCE',
  sobreMapa: '#FBF8F3',
  linha: '#A8957A',
  linhaSuave: '#D6CAB7',
  linhaForte: '#5A4632',
  texto: '#1A1410',
  textoSec: '#5A4632',
  textoApagado: '#6B5843',
  acao: '#A8441A',
  acaoPressionada: '#8A3612',
  textoSobreAcao: '#FFFFFF',
  sos: '#9E1B14',
  sosPressionado: '#7F150F',
  textoSobreSos: '#FFFFFF',
  contornoSos: '#1A1410',
  alerta: '#F5C518',
  textoSobreAlerta: '#1A1410',
  ouro: '#8A6510',
  textoSobreOuro: '#FFFFFF',
  verdePosto: '#1E6B4A',
  azulRio: '#2F5E86',
  estrada: '#2F5E86',
  asfalto: '#FFFFFF',
  viaLocal: '#857259',
  terra: '#8A5A1E',
  terraEscura: '#E3CBA6',
  rotaTerra: '#FFE9CC',
  contornoRota: '#FFFFFF',
  pisoDesconhecido: '#8F887E',
  agua: '#BCD3E0',
  rio: '#5B8DB0',
  vegetacao: '#E1E8D2',
  chao: '#EAE3D5',
};

/** Paleta padrão (noite). Componentes que trocam de tema usam `useCores()`. */
export const cores: Paleta = paletaNoite;

/**
 * Fontes (R19): Barlow Condensed só em títulos ≥ 24 px e números ≥ 32 px;
 * Inter em rótulos, botões e todo texto do modo pilotando e do carro.
 */
export const fontes = {
  titulo: 'BarlowCondensed_700Bold',
  tituloSemi: 'BarlowCondensed_600SemiBold',
  texto: 'Inter_400Regular',
  textoMedio: 'Inter_500Medium',
  textoSemi: 'Inter_600SemiBold',
  textoForte: 'Inter_700Bold',
} as const;

/** Tamanhos (R18): corpo 17; 15 é o mínimo para texto de ação; 13 só para metadados. */
export const tamanhoTexto = {
  minimo: 13,
  pequeno: 15,
  corpo: 17,
  destaque: 20,
  subtitulo: 24,
  titulo: 32,
  numero: 52,
} as const;

/** Limite de ampliação da fonte do sistema nas exceções (barra, chips, pilotando, carro) — R21. */
export const escalaMaxima = { barra: 1.3, chip: 1.3, pilotando: 1.3, padrao: undefined } as const;

export const raios = {
  pequeno: 8,
  botao: 14,
  cartao: 16,
  folha: 22,
  pilula: 999,
} as const;

export const espaco = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

/**
 * Alvos de toque (R20). pilotando: 92 dp de altura, 10 dp de espaço (decisão do dono em 12/11/2026,
 * abaixo dos 113 dp da pesquisa para sobrar mapa).
 */
export const toque = {
  minimo: 48,
  botao: 52,
  botaoGrande: 56,
  pilotando: 92,
  pilotandoEspaco: 10,
  carro: 66,
} as const;

/** Sombras (boxShadow nativo do React Native). */
export const sombra = {
  flutuante: '0px 8px 24px rgba(0,0,0,0.45)',
  folha: '0px -12px 32px rgba(0,0,0,0.5)',
  pino: '0px 4px 10px rgba(0,0,0,0.5)',
} as const;

export const movimento = { rapido: 160, normal: 200, lento: 240 } as const;

/** Bloqueio em movimento (R3): trava acima de 8 km/h; libera abaixo de 3 km/h por 5 s. */
export const limitesMovimento = { travaKmh: 8, liberaKmh: 3, liberaMs: 5000 } as const;
