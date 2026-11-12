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
};
export type IrmaoExemplo = { id: string; nome: string; status: StatusIrmao; lng: number; lat: number };

export const lugaresExemplo: LugarExemplo[] = [
  { id: 'sede-cuiaba', tipo: 'sede', nome: 'Sede Cuiabá', lng: -56.0861, lat: -15.5895 },
  { id: 'posto-trevo', tipo: 'posto', nome: 'Posto Trevo', rotulo: 'R$ 6,29', lng: -56.0751, lat: -15.5712 },
  { id: 'posto-chapada', tipo: 'posto', nome: 'Posto da Serra', rotulo: 'R$ 6,49', lng: -55.81, lat: -15.47 },
  { id: 'loja-exemplo', tipo: 'loja', nome: 'Loja (exemplo)', lng: -56.1032, lat: -15.6081 },
  { id: 'oficina-exemplo', tipo: 'oficina', nome: 'Oficina de irmão', lng: -56.06, lat: -15.62 },
  { id: 'agape-trevo', tipo: 'agape', nome: 'Ágape no Posto Trevo', lng: -56.0731, lat: -15.5699 },
];

export const irmaosExemplo: IrmaoExemplo[] = [
  { id: 'ze', nome: 'Zé Ferreira', status: 'cafe', lng: -56.0745, lat: -15.5722 },
  { id: 'edu', nome: 'Edu Prado', status: 'estrada', lng: -55.95, lat: -15.52 },
  { id: 'ivan', nome: 'Ivan Coruja', status: 'aberto', lng: -56.11, lat: -15.59 },
];

export type Filtro = 'tudo' | 'irmaos' | 'postos' | 'sedes' | 'lojas';

export function filtrar(filtro: Filtro) {
  const tipos: Record<Filtro, TipoPino[] | 'todos' | 'nenhum'> = {
    tudo: 'todos',
    irmaos: 'nenhum',
    postos: ['posto'],
    sedes: ['sede'],
    lojas: ['loja'],
  };
  const t = tipos[filtro];
  return {
    lugares:
      t === 'todos' ? lugaresExemplo : t === 'nenhum' ? [] : lugaresExemplo.filter((l) => t.includes(l.tipo)),
    irmaos: filtro === 'tudo' || filtro === 'irmaos' ? irmaosExemplo : [],
  };
}
