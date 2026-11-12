/**
 * Tokens da Interface v2 (docs/telas/v2/Sistema.dc.html).
 * Único lugar com cores, fontes, raios e espaçamentos do app.
 * Regra: cada cor tem uma função só (laranja = ação; vermelho = só SOS; amarelo = só alerta).
 */
export const cores = {
  // fundos
  fundo: '#0B0907',
  superficie: '#16120E',
  superficie2: '#201A15',
  superficie3: '#241D17',
  linha: '#322920',
  linhaSuave: '#262019',
  linhaForte: '#3A2F25',
  // texto
  texto: '#F3EADB',
  textoSec: '#B8A890',
  textoApagado: '#9C8D77',
  // função
  acao: '#E8692A',
  acaoPressionada: '#C2531C',
  sos: '#C62D22',
  textoSobreSos: '#FFF6EC',
  alerta: '#F5C518',
  // categorias
  ouro: '#D8A93B',
  verdePosto: '#3FA27A',
  azulRio: '#7FA6C2',
  // mapa
  asfalto: '#E9DCC4',
  terra: '#C68A45',
  terraEscura: '#5A3E1F',
  rotaTerra: '#F3D9B8',
  agua: '#22323D',
  rio: '#3D6E8F',
  vegetacao: '#191F16',
  chao: '#15120E',
} as const;

export type NomeCor = keyof typeof cores;

export const fontes = {
  titulo: 'BarlowCondensed_700Bold',
  tituloSemi: 'BarlowCondensed_600SemiBold',
  texto: 'Inter_400Regular',
  textoMedio: 'Inter_500Medium',
  textoSemi: 'Inter_600SemiBold',
  textoForte: 'Inter_700Bold',
} as const;

export const tamanhoTexto = {
  minimo: 13,
  pequeno: 15,
  corpo: 17,
  destaque: 20,
  subtitulo: 24,
  titulo: 32,
  numero: 52,
} as const;

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

export const toque = {
  minimo: 48,
  botao: 52,
  botaoGrande: 56,
  pilotando: 112,
  carro: 66,
} as const;

/** Sombras (boxShadow nativo do React Native). */
export const sombra = {
  flutuante: '0px 8px 24px rgba(0,0,0,0.45)',
  folha: '0px -12px 32px rgba(0,0,0,0.5)',
  pino: '0px 4px 10px rgba(0,0,0,0.5)',
} as const;

export const movimento = { rapido: 160, normal: 200, lento: 240 } as const;
