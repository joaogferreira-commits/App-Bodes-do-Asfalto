import type { TipoPino } from '@/ui';

/**
 * Guia de Negócios de irmãos (docs/COMERCIAL.md). EXEMPLO até o cadastro no painel.
 * Todo negócio informa um BENEFÍCIO para irmãos (obrigatório). O plano pago é ativado no painel,
 * com data de validade, e cobrado fora do app (Pix/boleto). Nada de dado do irmão vai ao anunciante.
 */
export type PlanoNegocio = 'gratis' | 'cidade' | 'estrada' | 'parceiro';
export type CategoriaNegocio = 'oficina' | 'comida' | 'pouso' | 'pecas' | 'servicos';

export type Negocio = {
  id: string;
  nome: string;
  categoria: CategoriaNegocio;
  pino: TipoPino;
  cidade: string;
  dono: string;
  beneficio: string;
  descricao: string;
  horario?: string;
  comodidades: ('cobertura' | 'garagem' | 'cafeCedo' | 'ferramentas' | 'guincho')[];
  /** imagens do app (require) ou do servidor ({ uri }) */
  fotos: (number | { uri: string })[];
  whatsapp?: string;
  telefone?: string;
  posicao?: { lat: number; lng: number };
  plano: PlanoNegocio;
  /** AAAA-MM-DD; depois disso o destaque some sozinho. */
  validade?: string;
  recomendacoes: number;
  /** vindo do servidor (Guia real) */
  servidor?: boolean;
  /** o irmão logado é o dono */
  meu?: boolean;
  status?: 'pendente' | 'aprovado' | 'recusado';
  motivoRecusa?: string | null;
  destaqueAte?: string | null;
  site?: string;
};

export const categoriasNegocio: CategoriaNegocio[] = ['oficina', 'comida', 'pouso', 'pecas', 'servicos'];

const f = {
  oficina: require('../../assets/gerados/motos/moto-trail.webp'),
  custom: require('../../assets/gerados/motos/moto-custom.webp'),
  touring: require('../../assets/gerados/motos/moto-touring.webp'),
  estrada: require('../../assets/exemplos/moto-estrada.webp'),
  porDoSol: require('../../assets/exemplos/por-do-sol.webp'),
  pantanal: require('../../assets/exemplos/pantanal.webp'),
  comboio: require('../../assets/exemplos/comboio.webp'),
};
const W = '65999990000';

export const negociosExemplo: Negocio[] = [
  {
    id: 'oficina-bode',
    nome: 'Oficina do Bode',
    categoria: 'oficina',
    pino: 'oficina',
    cidade: 'Cuiabá',
    dono: 'Zé Ferreira',
    beneficio: '10% na revisão e diagnóstico grátis',
    descricao: 'Revisão, suspensão e elétrica de motos grandes. Atendemos comboio com hora marcada.',
    horario: 'Seg a sáb, 8h às 18h',
    comodidades: ['cobertura', 'ferramentas', 'guincho'],
    fotos: [f.oficina, f.custom],
    whatsapp: W,
    telefone: W,
    posicao: { lat: -15.62, lng: -56.06 },
    plano: 'parceiro',
    validade: '2027-12-31',
    recomendacoes: 14,
  },
  {
    id: 'churrascaria',
    nome: 'Churrascaria Estradeiro',
    categoria: 'comida',
    pino: 'restaurante',
    cidade: 'Cuiabá',
    dono: 'Edu Prado',
    beneficio: 'Sobremesa por conta da casa para irmãos',
    descricao: 'Rodízio na BR-364 com estacionamento coberto só para motos.',
    horario: 'Todos os dias, 11h às 23h',
    comodidades: ['cobertura'],
    fotos: [f.porDoSol, f.comboio],
    whatsapp: W,
    posicao: { lat: -15.6, lng: -56.08 },
    plano: 'estrada',
    validade: '2027-06-30',
    recomendacoes: 9,
  },
  {
    id: 'pousada',
    nome: 'Pousada Chapadão',
    categoria: 'pouso',
    pino: 'sede',
    cidade: 'Chapada dos Guimarães',
    dono: 'Ivan Coruja',
    beneficio: '15% na diária e garagem fechada grátis',
    descricao: 'Pousada rústica a 5 min do centro. Café às 6h para quem sai cedo.',
    horario: 'Check-in a partir das 14h',
    comodidades: ['garagem', 'cafeCedo'],
    fotos: [f.pantanal, f.estrada],
    whatsapp: W,
    posicao: { lat: -15.46, lng: -55.75 },
    plano: 'cidade',
    validade: '2026-01-31',
    recomendacoes: 6,
  },
  {
    id: 'pecas',
    nome: 'MotoPeças Fraterna',
    categoria: 'pecas',
    pino: 'oficina',
    cidade: 'Cuiabá',
    dono: 'Marcos Ferrugem',
    beneficio: '8% em pneus e capacetes',
    descricao: 'Pneus, capacetes, baús e acessórios. Encomendas em 48 h.',
    horario: 'Seg a sex, 8h às 18h',
    comodidades: ['cobertura'],
    fotos: [f.touring],
    whatsapp: W,
    plano: 'gratis',
    recomendacoes: 3,
  },
  {
    id: 'seguros',
    nome: 'Seguros do Irmão',
    categoria: 'servicos',
    pino: 'socorro',
    cidade: 'Várzea Grande',
    dono: 'Tião Garupa',
    beneficio: 'Cotação grátis e 1º mês de assistência 24 h',
    descricao: 'Seguro de moto e assistência 24 h com guincho em todo o MT.',
    horario: 'Seg a sex, 9h às 17h',
    comodidades: ['guincho'],
    fotos: [f.estrada],
    whatsapp: W,
    plano: 'gratis',
    recomendacoes: 2,
  },
];

/** O plano pago só vale até a validade. */
export function planoVigente(n: Negocio, hoje = new Date()): PlanoNegocio {
  if (n.plano === 'gratis' || !n.validade) return 'gratis';
  return new Date(`${n.validade}T23:59:59`) >= hoje ? n.plano : 'gratis';
}

const peso: Record<PlanoNegocio, number> = { parceiro: 3, estrada: 2, cidade: 1, gratis: 0 };

/**
 * Ordem do Guia: até 3 pagos vigentes em cima (os mais altos primeiro), depois os outros por nome.
 * Os grátis aparecem sempre (Marcelo: o pago não esconde o grátis).
 */
export function ordenarGuia(lista: Negocio[], hoje = new Date()): Negocio[] {
  const pagos = lista
    .filter((n) => planoVigente(n, hoje) !== 'gratis')
    .sort((a, b) => peso[planoVigente(b, hoje)] - peso[planoVigente(a, hoje)])
    .slice(0, 3);
  const resto = lista.filter((n) => !pagos.includes(n)).sort((a, b) => a.nome.localeCompare(b.nome));
  return [...pagos, ...resto];
}
