/**
 * Tokens da identidade "Patch de Colete" (docs/DESIGN.md, seção 1).
 * Único lugar com cores, fontes, raios e espaçamentos do app.
 */
export const cores = {
  sarja: '#17130F',
  noite: '#0C0A08',
  linhaEscura: '#3A3028',
  laranja: '#D9622B',
  laranjaEscuro: '#5E230B',
  ferrugem: '#A3401A',
  creme: '#EFE3C8',
  caramelo: '#C9A46A',
  dourado: '#D8A93B',
  jeans: '#3E5C7A',
  oliva: '#6B7A3A',
  vermelho: '#B3261E',
  alerta: '#F5C518',
  verdePosto: '#2E7D5B',
} as const;

export type NomeCor = keyof typeof cores;

export const fontes = {
  titulo: 'BarlowCondensed_700Bold',
  tituloSemi: 'BarlowCondensed_600SemiBold',
  tituloForte: 'BarlowCondensed_800ExtraBold',
  texto: 'Inter_400Regular',
  textoSemi: 'Inter_600SemiBold',
  textoForte: 'Inter_700Bold',
} as const;

export const tamanhoTexto = {
  minimo: 13,
  pequeno: 15,
  corpo: 17,
  destaque: 20,
  titulo: 28,
  tituloGrande: 36,
} as const;

export const raios = {
  chip: 8,
  botao: 14,
  cartao: 18,
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
  pilotando: 100,
  carro: 66,
} as const;

/** Três níveis de profundidade (desenhados com Skia em ui/Profundidade). */
export const profundidade = {
  costurado: { y: 2, blur: 4, opacidade: 0.4, sombraInterna: true, brilho: false },
  patch: { y: 6, blur: 14, opacidade: 0.5, sombraInterna: false, brilho: false },
  flutuante: { y: 12, blur: 28, opacidade: 0.55, sombraInterna: false, brilho: true },
} as const;

export type NivelProfundidade = keyof typeof profundidade;

export const movimento = { rapido: 160, normal: 200, lento: 240 } as const;
