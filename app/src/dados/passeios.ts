import type { TipoEstrada } from '@/rotas/tipos';

/** Passeios de EXEMPLO até a Etapa 2 (agenda real dos capítulos). Textos são conteúdo do usuário. */
export type Passeio = {
  id: string;
  titulo: string;
  capitulo: string;
  organizador: string;
  oficial: boolean;
  dia: string;
  hora: string;
  saida: string;
  destino: string;
  km: number;
  duracao: string;
  tipoEstrada: TipoEstrada;
  terraPct: number;
  vou: number;
  talvez: number;
  confirmados: string[];
  imagem: number;
  quando: 'proximos' | 'passados';
  descricao: string;
};

const img = {
  pantanal: require('../../assets/exemplos/pantanal.webp'),
  porDoSol: require('../../assets/exemplos/por-do-sol.webp'),
  terra: require('../../assets/exemplos/estrada-terra.webp'),
  estrada: require('../../assets/gerados/ilustracoes/ilustra-vazio-estrada.webp'),
  viagem: require('../../assets/gerados/ilustracoes/ilustra-primeira-viagem.webp'),
  boasVindas: require('../../assets/gerados/ilustracoes/ilustra-boas-vindas.webp'),
  touring: require('../../assets/gerados/motos/moto-touring.webp'),
  trail: require('../../assets/gerados/motos/moto-big-trail.webp'),
  custom: require('../../assets/gerados/motos/moto-custom.webp'),
};

export const passeiosExemplo: Passeio[] = [
  {
    id: 'transpantaneira',
    titulo: 'Passeio à Transpantaneira',
    capitulo: 'Cuiabá',
    organizador: 'Diretoria Cuiabá',
    oficial: true,
    dia: 'sáb, 22/11',
    hora: '6h30',
    saida: 'Sede Cuiabá',
    destino: 'Porto Jofre',
    km: 260,
    duracao: '≈ 9 h com paradas',
    tipoEstrada: 'misto',
    terraPct: 55,
    vou: 14,
    talvez: 5,
    confirmados: ['Edu Prado', 'Zé Ferreira', 'Ivan Coruja', 'Marcos Ferrugem'],
    imagem: img.pantanal,
    quando: 'proximos',
    descricao: 'Café na sede, abastecimento em Poconé e almoço no Pantanal. Pneu misto recomendado.',
  },
  {
    id: 'chapada-bate-volta',
    titulo: 'Bate-volta na Chapada',
    capitulo: 'Cuiabá',
    organizador: 'Edu Prado',
    oficial: false,
    dia: 'dom, 23/11',
    hora: '7h',
    saida: 'Posto Trevo',
    destino: 'Mirante da Chapada',
    km: 150,
    duracao: '≈ 5 h',
    tipoEstrada: 'asfalto',
    terraPct: 0,
    vou: 8,
    talvez: 3,
    confirmados: ['Edu Prado', 'Tião Garupa', 'Ivan Coruja'],
    imagem: img.porDoSol,
    quando: 'proximos',
    descricao: 'Só asfalto, ritmo tranquilo, ótimo para quem está começando.',
  },
  {
    id: 'encontro-estadual',
    titulo: 'Encontro Estadual dos Bodes',
    capitulo: 'Todos os capítulos',
    organizador: 'Diretoria Geral',
    oficial: true,
    dia: 'sex a dom, 5 a 7/12',
    hora: '8h',
    saida: 'Sede Cuiabá',
    destino: 'Rondonópolis',
    km: 215,
    duracao: '3 dias',
    tipoEstrada: 'asfalto',
    terraPct: 0,
    vou: 37,
    talvez: 12,
    confirmados: ['Zé Ferreira', 'Marcos Ferrugem', 'Edu Prado', 'Ivan Coruja', 'Tião Garupa'],
    imagem: img.boasVindas,
    quando: 'proximos',
    descricao: 'Três dias de encontro com todos os capítulos. Hospedagem combinada com a diretoria.',
  },
  {
    id: 'trilha-parecis',
    titulo: 'Estradão até Campo Novo do Parecis',
    capitulo: 'Tangará da Serra',
    organizador: 'Marcos Ferrugem',
    oficial: false,
    dia: 'sáb, 13/12',
    hora: '6h',
    saida: 'Sede Tangará da Serra',
    destino: 'Campo Novo do Parecis',
    km: 180,
    duracao: '≈ 6 h',
    tipoEstrada: 'terra',
    terraPct: 70,
    vou: 6,
    talvez: 2,
    confirmados: ['Marcos Ferrugem', 'Edu Prado'],
    imagem: img.terra,
    quando: 'proximos',
    descricao: 'Para big trail e motos com pneu misto. Levar água e câmara reserva.',
  },
  {
    id: 'aniversario-capitulo',
    titulo: 'Aniversário do Capítulo Cuiabá',
    capitulo: 'Cuiabá',
    organizador: 'Diretoria Cuiabá',
    oficial: true,
    dia: 'sáb, 8/11',
    hora: '18h',
    saida: 'Sede Cuiabá',
    destino: 'Sede Cuiabá',
    km: 0,
    duracao: 'noite',
    tipoEstrada: 'asfalto',
    terraPct: 0,
    vou: 52,
    talvez: 0,
    confirmados: ['Zé Ferreira', 'Edu Prado', 'Ivan Coruja'],
    imagem: img.custom,
    quando: 'passados',
    descricao: 'Churrasco e entrega de patches.',
  },
];
