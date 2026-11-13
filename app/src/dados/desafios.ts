/**
 * Desafios (decisões do dono em 12/11/2026):
 * - criados por irmãos (aprovados pela diretoria do capítulo OU por um moderador), pela diretoria
 *   (publica direto no capítulo) e por capítulos em conjunto (aceite das duas diretorias);
 * - XP dos desafios dos irmãos é FIXO pela tabela de km total do desafio;
 * - nunca velocidade, tempo de percurso ou "quem chega primeiro" (princípio 1);
 * - entre capítulos vale a MÉDIA de km por irmão ativo (o capítulo maior não ganha sempre);
 * - prazo máximo de 90 dias; 1 desafio criado por irmão por mês; até 3 desafios de irmãos ativos por capítulo.
 */
export type TipoDesafio = 'km' | 'sedes' | 'lojas' | 'passeios' | 'agape' | 'rotaBiker' | 'socorro';
export type OrigemDesafio = 'irmao' | 'diretoria' | 'capitulos';
export type SituacaoDesafio = 'aguardando' | 'ativo' | 'encerrado' | 'recusado';

export const tiposDesafio: TipoDesafio[] = [
  'km',
  'sedes',
  'lojas',
  'passeios',
  'agape',
  'rotaBiker',
  'socorro',
];

export type Desafio = {
  id: string;
  titulo: string;
  tipo: TipoDesafio;
  meta: number;
  origem: OrigemDesafio;
  criador: string;
  capitulos: string[];
  inicio: string; // AAAA-MM-DD
  fim: string;
  situacao: SituacaoDesafio;
  aprovadoPor?: 'diretoria' | 'moderador';
  participantes: number;
  /** Só no modo servidor: XP calculado pelo banco, km já registrados e se o irmão participa. */
  criadorId?: string;
  xpServidor?: number;
  kmFeitos?: number;
  participo?: boolean;
  concluido?: boolean;
};

/** Tabela de XP fixa por km total (desafios de irmãos). Faixas fechadas no limite superior. */
export const tabelaXpKm: { ate: number; xp: number }[] = [
  { ate: 100, xp: 50 },
  { ate: 300, xp: 120 },
  { ate: 600, xp: 250 },
  { ate: 1000, xp: 400 },
  { ate: 2000, xp: 700 },
  { ate: Infinity, xp: 1000 },
];

/** Equivalência para desafios que não são de km (1 sede/Loja/passeio/marco ≈ 100 km; Ágape ≈ 50 km). */
const kmEquivalente: Record<Exclude<TipoDesafio, 'km'>, number> = {
  sedes: 100,
  lojas: 100,
  passeios: 100,
  rotaBiker: 100,
  agape: 50,
  socorro: 150,
};

export function xpDoDesafio(d: Pick<Desafio, 'tipo' | 'meta' | 'origem'>) {
  const km = d.tipo === 'km' ? d.meta : d.meta * kmEquivalente[d.tipo];
  const base = tabelaXpKm.find((f) => km <= f.ate)!.xp;
  // Diretoria e capítulos em conjunto valem 50% a mais (são oficiais e mais raros).
  return d.origem === 'irmao' ? base : Math.round(base * 1.5);
}

export const PRAZO_MAXIMO_DIAS = 90;
export const MAX_ATIVOS_POR_CAPITULO = 3;

export type ErroDesafio = 'titulo' | 'meta' | 'prazo' | 'umPorMes' | 'limiteCapitulo';

/** Valida um desafio novo. */
export function validarDesafio(
  d: Pick<Desafio, 'titulo' | 'meta' | 'inicio' | 'fim' | 'origem' | 'capitulos' | 'criador'>,
  existentes: Desafio[],
  hoje = new Date(),
): ErroDesafio | null {
  if (d.titulo.trim().length < 4) return 'titulo';
  if (!Number.isFinite(d.meta) || d.meta < 1 || d.meta > 20000) return 'meta';
  const dias = (Date.parse(d.fim) - Date.parse(d.inicio)) / 86400000;
  if (!(dias >= 1 && dias <= PRAZO_MAXIMO_DIAS)) return 'prazo';
  const mes = hoje.toISOString().slice(0, 7);
  if (
    d.origem === 'irmao' &&
    existentes.some((e) => e.origem === 'irmao' && e.criador === d.criador && e.inicio.startsWith(mes))
  )
    return 'umPorMes';
  // limite vale para desafios de irmãos (os da diretoria e entre capítulos são oficiais)
  const ativosDoCapitulo = existentes.filter(
    (e) => e.origem === 'irmao' && e.situacao === 'ativo' && e.capitulos.some((c) => d.capitulos.includes(c)),
  ).length;
  if (ativosDoCapitulo >= MAX_ATIVOS_POR_CAPITULO) return 'limiteCapitulo';
  return null;
}

/** Placar entre capítulos: média de km por irmão ativo (nunca o total). */
export function placarEntreCapitulos(km: Record<string, { total: number; ativos: number }>) {
  return Object.entries(km)
    .map(([capitulo, v]) => ({ capitulo, media: v.ativos ? Math.round(v.total / v.ativos) : 0 }))
    .sort((a, b) => b.media - a.media);
}

const d = (dias: number) => new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);

export const desafiosExemplo: Desafio[] = [
  {
    id: 'des-mil',
    titulo: '1.000 km em novembro',
    tipo: 'km',
    meta: 1000,
    origem: 'diretoria',
    criador: 'Diretoria Cuiabá',
    capitulos: ['Cuiabá'],
    inicio: d(-12),
    fim: d(18),
    situacao: 'ativo',
    participantes: 31,
  },
  {
    id: 'des-sedes',
    titulo: 'Visitar 3 sedes de capítulo',
    tipo: 'sedes',
    meta: 3,
    origem: 'irmao',
    criador: 'Edu Prado',
    capitulos: ['Cuiabá'],
    inicio: d(-5),
    fim: d(55),
    situacao: 'ativo',
    aprovadoPor: 'moderador',
    participantes: 9,
  },
  {
    id: 'des-cxr',
    titulo: 'Cuiabá x Rondonópolis: média de km por irmão',
    tipo: 'km',
    meta: 300,
    origem: 'capitulos',
    criador: 'Diretorias Cuiabá e Rondonópolis',
    capitulos: ['Cuiabá', 'Rondonópolis'],
    inicio: d(-3),
    fim: d(27),
    situacao: 'ativo',
    participantes: 58,
  },
];

export const placarExemplo = {
  Cuiabá: { total: 9840, ativos: 41 },
  Rondonópolis: { total: 6120, ativos: 23 },
};
