import coletados from './pontos-coletados.json';
import type { StatusIrmao, TipoPino } from '@/ui';

/**
 * Dados de EXEMPLO para o mapa até existir o cadastro real (Etapas 1 e 2).
 * Sempre marcados como exemplo na interface.
 */
export type LugarExemplo = {
  id: string;
  tipo: TipoPino;
  nome: string;
  rotulo?: string;
  lng: number;
  lat: number;
  /** de onde veio o ponto (crédito na ficha) */
  fonte?: 'osm' | 'rotaBiker';
  link?: string;
  /** pontos vindos do banco (public.pontos_osm): contatos opcionais do OpenStreetMap */
  site?: string;
  telefone?: string;
  numero?: number | null;
  /** Lojas e negócios do servidor: id da linha e texto curto da ficha */
  lojaId?: string;
  negocioId?: string;
  detalhe?: string;
};

type PontoColetado = {
  id: string;
  tipo: 'cachoeira' | 'mirante' | 'monumento' | 'atracao' | 'rotaBiker';
  nome: string;
  lat: number;
  lng: number;
  fonte: 'osm' | 'rotaBiker';
  link: string;
  numero?: number | null;
};

/**
 * Pontos coletados de fontes abertas/públicas (tools/processar_coleta.py): OpenStreetMap de MT
 * (ODbL) e monumentos da Rota Biker (mapa público do site oficial; decisão do dono em 12/11/2026).
 */
export const pontosColetados: LugarExemplo[] = (coletados as PontoColetado[]).map((p) => ({
  id: p.id,
  tipo: p.tipo,
  nome: p.nome.replace(/^\d+\s*-\s*/, ''),
  lat: p.lat,
  lng: p.lng,
  fonte: p.fonte,
  link: p.link,
  numero: p.numero,
}));
export type IrmaoExemplo = { id: string; nome: string; status: StatusIrmao; lng: number; lat: number };

export const lugaresExemplo: LugarExemplo[] = [
  { id: 'sede-cuiaba', tipo: 'sede', nome: 'Sede Cuiabá', lng: -56.0861, lat: -15.5895 },
  { id: 'posto-trevo', tipo: 'posto', nome: 'Posto Trevo', rotulo: 'R$ 6,29', lng: -56.0751, lat: -15.5712 },
  { id: 'posto-chapada', tipo: 'posto', nome: 'Posto da Serra', rotulo: 'R$ 6,49', lng: -55.81, lat: -15.47 },
  { id: 'loja-exemplo', tipo: 'loja', nome: 'Loja (exemplo)', lng: -56.1032, lat: -15.6081 },
  { id: 'oficina-exemplo', tipo: 'oficina', nome: 'Oficina de irmão', lng: -56.06, lat: -15.62 },
  { id: 'agape-trevo', tipo: 'agape', nome: 'Ágape no Posto Trevo', lng: -56.0731, lat: -15.5699 },
  {
    id: 'centro-geodesico',
    tipo: 'monumento',
    nome: 'Centro Geodésico da América do Sul',
    lng: -56.0967,
    lat: -15.5989,
  },
  { id: 'veu-de-noiva', tipo: 'cachoeira', nome: 'Cachoeira Véu de Noiva', lng: -55.8339, lat: -15.4142 },
  { id: 'mirante-chapada', tipo: 'mirante', nome: 'Mirante da Chapada', lng: -55.7497, lat: -15.4604 },
  {
    id: 'restaurante-irmao',
    tipo: 'restaurante',
    nome: 'Restaurante de irmão (exemplo)',
    lng: -56.08,
    lat: -15.6,
  },
];

/** Pontos inventados (sede, postos com preço, Loja, oficina, restaurante e ágape de exemplo): nunca aparecem com o servidor ligado. */
export const idsSoExemplo = [
  'sede-cuiaba',
  'posto-trevo',
  'posto-chapada',
  'loja-exemplo',
  'oficina-exemplo',
  'agape-trevo',
  'restaurante-irmao',
];

/** Lugares de verdade (monumentos, cachoeiras, mirantes), sem os pontos inventados. */
export const lugaresReais: LugarExemplo[] = lugaresExemplo.filter((l) => !idsSoExemplo.includes(l.id));

export const irmaosExemplo: IrmaoExemplo[] = [
  { id: 'ze', nome: 'Zé Ferreira', status: 'cafe', lng: -56.0745, lat: -15.5722 },
  { id: 'edu', nome: 'Edu Prado', status: 'estrada', lng: -55.95, lat: -15.52 },
  { id: 'ivan', nome: 'Ivan Coruja', status: 'aberto', lng: -56.11, lat: -15.59 },
];

/** Grupos do filtro do mapa (poucos chips: público de 40 a 60 anos). */
export type Filtro = 'tudo' | 'irmaos' | 'clube' | 'postos' | 'natureza' | 'cultura' | 'apoio';

/** Chaves dos grupos, na ordem dos chips. */
export const filtros: Filtro[] = ['tudo', 'irmaos', 'clube', 'postos', 'natureza', 'cultura', 'apoio'];

export const tiposDoFiltro: Record<Filtro, TipoPino[] | 'todos' | 'nenhum'> = {
  tudo: 'todos',
  irmaos: 'nenhum',
  clube: ['sede', 'loja', 'oficina', 'restaurante'],
  postos: ['posto', 'oficina_moto', 'borracharia'],
  natureza: ['cachoeira', 'mirante', 'praia', 'parque', 'camping'],
  cultura: ['museu', 'monumento', 'atracao', 'igreja_historica', 'rotaBiker'],
  apoio: ['hospedagem', 'hospital', 'policia_rodoviaria'],
};

/** Lugares do clube (exemplo) + pontos coletados (+ pontos do banco, quando houver). */
export const todosOsLugares = (extras: LugarExemplo[] = [], servidor = false): LugarExemplo[] => [
  ...(servidor ? lugaresReais : lugaresExemplo),
  ...pontosColetados,
  ...extras,
];

/** Aplica o grupo do filtro a uma lista de lugares. */
export function filtrarLugares(lugares: LugarExemplo[], filtro: Filtro) {
  const t = tiposDoFiltro[filtro];
  return t === 'todos' ? lugares : t === 'nenhum' ? [] : lugares.filter((l) => t.includes(l.tipo));
}

export function filtrar(filtro: Filtro, extras: LugarExemplo[] = []) {
  return {
    lugares: filtrarLugares(todosOsLugares(extras), filtro),
    irmaos: filtro === 'tudo' || filtro === 'irmaos' ? irmaosExemplo : [],
  };
}
