/**
 * Classificados de EXEMPLO (compra e venda entre irmãos). Nenhum pagamento passa pelo app
 * (CLAUDE.md: nenhum link de pagamento externo dentro do app); o contato é direto, pelo WhatsApp.
 */
export type CategoriaClassificado = 'motos' | 'pecas' | 'equipamentos' | 'vestuario' | 'servicos';
export type EstadoItem = 'novo' | 'seminovo' | 'usado';

export type Classificado = {
  id: string;
  categoria: CategoriaClassificado;
  titulo: string;
  preco: number;
  aceitaTroca: boolean;
  estado: EstadoItem;
  cidade: string;
  vendedor: string;
  capitulo: string;
  quando: string;
  descricao: string;
  fotos: (number | { uri: string })[];
  ano?: string;
  km?: string;
  destaque?: boolean;
  vendido?: boolean;
  meu?: boolean;
  whatsapp?: string;
};

export const categorias: CategoriaClassificado[] = [
  'motos',
  'pecas',
  'equipamentos',
  'vestuario',
  'servicos',
];

const f = {
  custom: require('../../assets/gerados/motos/moto-custom.webp'),
  touring: require('../../assets/gerados/motos/moto-touring.webp'),
  bigTrail: require('../../assets/gerados/motos/moto-big-trail.webp'),
  naked: require('../../assets/gerados/motos/moto-naked.webp'),
  trail: require('../../assets/gerados/motos/moto-trail.webp'),
  street: require('../../assets/gerados/motos/moto-street.webp'),
  esportiva: require('../../assets/gerados/motos/moto-esportiva.webp'),
  triciclo: require('../../assets/gerados/motos/moto-triciclo.webp'),
  fotoTrail: require('../../assets/exemplos/moto-trail.webp'),
  fotoEstrada: require('../../assets/exemplos/moto-estrada.webp'),
  fotoTerra: require('../../assets/exemplos/estrada-terra.webp'),
  fotoComboio: require('../../assets/exemplos/comboio.webp'),
};

const WHATS = '65999990000';

export const classificadosExemplo: Classificado[] = [
  {
    id: 'k1',
    categoria: 'motos',
    titulo: 'Harley-Davidson Fat Boy 114',
    preco: 98500,
    aceitaTroca: true,
    estado: 'seminovo',
    cidade: 'Cuiabá',
    vendedor: 'Zé Ferreira',
    capitulo: 'Cuiabá',
    quando: 'há 2 h',
    descricao:
      'Revisões na concessionária, pneus novos, escape Vance & Hines e banco de garupa. Moto de irmão, nunca caiu.',
    fotos: [f.custom, f.fotoEstrada],
    ano: '2021',
    km: '18.400',
    destaque: true,
    whatsapp: WHATS,
  },
  {
    id: 'k2',
    categoria: 'motos',
    titulo: 'Big trail 1250 com baús',
    preco: 79900,
    aceitaTroca: false,
    estado: 'usado',
    cidade: 'Tangará da Serra',
    vendedor: 'Marcos Ferrugem',
    capitulo: 'Tangará da Serra',
    quando: 'ontem',
    descricao: 'Pronta para estradão: protetor de motor, faróis auxiliares e kit de três baús.',
    fotos: [f.bigTrail, f.fotoTerra, f.fotoTrail],
    ano: '2019',
    km: '42.000',
    whatsapp: WHATS,
  },
  {
    id: 'k3',
    categoria: 'equipamentos',
    titulo: 'Intercomunicador par (2 capacetes)',
    preco: 1350,
    aceitaTroca: false,
    estado: 'seminovo',
    cidade: 'Várzea Grande',
    vendedor: 'Ivan Coruja',
    capitulo: 'Várzea Grande',
    quando: 'ontem',
    descricao: 'Alcance de 1,2 km, áudio para GPS e música. Com caixa e cabos.',
    fotos: [f.fotoComboio],
    whatsapp: WHATS,
  },
  {
    id: 'k4',
    categoria: 'pecas',
    titulo: 'Par de baús laterais com suporte',
    preco: 1200,
    aceitaTroca: true,
    estado: 'usado',
    cidade: 'Cuiabá',
    vendedor: 'Edu Prado',
    capitulo: 'Cuiabá',
    quando: 'há 2 dias',
    descricao: 'Serve em touring e custom. Chaves iguais, sem trincas.',
    fotos: [f.touring],
    whatsapp: WHATS,
  },
  {
    id: 'k5',
    categoria: 'motos',
    titulo: 'Naked 900 — primeira dona',
    preco: 52000,
    aceitaTroca: true,
    estado: 'seminovo',
    cidade: 'Rondonópolis',
    vendedor: 'Tião Garupa',
    capitulo: 'Cuiabá',
    quando: 'há 3 dias',
    descricao: 'Manual, chave reserva e nota. Ideal para quem está chegando no clube.',
    fotos: [f.naked, f.street],
    ano: '2022',
    km: '9.800',
    whatsapp: WHATS,
  },
  {
    id: 'k6',
    categoria: 'vestuario',
    titulo: 'Jaqueta de couro tam. G',
    preco: 650,
    aceitaTroca: false,
    estado: 'usado',
    cidade: 'Sinop',
    vendedor: 'Carlos (Sinop)',
    capitulo: 'Sinop',
    quando: 'há 4 dias',
    descricao: 'Couro legítimo com proteções removíveis.',
    fotos: [f.fotoEstrada],
    whatsapp: WHATS,
  },
  {
    id: 'k7',
    categoria: 'servicos',
    titulo: 'Revisão completa em casa',
    preco: 350,
    aceitaTroca: false,
    estado: 'novo',
    cidade: 'Cuiabá',
    vendedor: 'Oficina do Bode',
    capitulo: 'Cuiabá',
    quando: 'há 5 dias',
    descricao: 'Óleo, filtro, relação e freios, no seu endereço. Preço especial para irmãos.',
    fotos: [f.trail],
    whatsapp: WHATS,
  },
  {
    id: 'k8',
    categoria: 'motos',
    titulo: 'Triciclo para garupa tranquila',
    preco: 61000,
    aceitaTroca: true,
    estado: 'usado',
    cidade: 'Cuiabá',
    vendedor: 'Tião Garupa',
    capitulo: 'Cuiabá',
    quando: 'há 1 semana',
    descricao: 'Ré, piloto automático e encosto. Vendido.',
    fotos: [f.triciclo],
    ano: '2018',
    km: '31.000',
    vendido: true,
    whatsapp: WHATS,
  },
  {
    id: 'k9',
    categoria: 'motos',
    titulo: 'Esportiva 600 para pista',
    preco: 38000,
    aceitaTroca: false,
    estado: 'usado',
    cidade: 'Várzea Grande',
    vendedor: 'Ivan Coruja',
    capitulo: 'Várzea Grande',
    quando: 'há 1 semana',
    descricao: 'Só pista e estrada. Escapamento esportivo.',
    fotos: [f.esportiva],
    ano: '2017',
    km: '27.500',
    whatsapp: WHATS,
  },
];

export const formatarPreco = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
