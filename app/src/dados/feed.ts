import type { agapeExemplo } from './agape';
import type { ChaveNivel, ChaveSelo } from './conquistas';
import type { StatusIrmao } from '@/ui';

/**
 * Posts de EXEMPLO para mostrar o feed até a etapa social (Etapa 4): conteúdo fictício,
 * marcado como exemplo na tela. Os textos dos posts são conteúdo do usuário (não traduzidos).
 */
type Autor = { nome: string; capitulo: string; status?: StatusIrmao };

export type Post =
  | {
      id: string;
      tipo: 'viagem';
      autor: Autor;
      quando: string;
      texto: string;
      imagem: number;
      km: number;
      horas: string;
      irmaos: number;
      xp: number;
      selo?: ChaveSelo;
      terraPct: number;
      marcados: string[];
      tfa: number;
      comentarios: number;
    }
  | { id: string; tipo: 'passeio'; autor: Autor; quando: string; passeioId: string }
  | { id: string; tipo: 'agape'; autor: Autor; quando: string; agape?: typeof agapeExemplo }
  | { id: string; tipo: 'conquista'; autor: Autor; quando: string; nivel: ChaveNivel }
  | { id: string; tipo: 'chegada'; autor: Autor; quando: string; cidade: string; irmaosPerto: number }
  | {
      id: string;
      tipo: 'foto';
      autor: Autor;
      quando: string;
      texto: string;
      imagem: number;
      tfa: number;
      comentarios: number;
    }
  | {
      id: string;
      tipo: 'enquete';
      autor: Autor;
      quando: string;
      pergunta: string;
      opcoes: { texto: string; votos: number }[];
    }
  | { id: string; tipo: 'aviso'; autor: Autor; quando: string; titulo: string; texto: string };

export const stories: { nome: string; status: StatusIrmao; novo: boolean }[] = [
  { nome: 'Edu Prado', status: 'estrada', novo: true },
  { nome: 'Zé Ferreira', status: 'cafe', novo: true },
  { nome: 'Ivan Coruja', status: 'aberto', novo: true },
  { nome: 'Marcos Ferrugem', status: 'aberto', novo: false },
  { nome: 'Tião Garupa', status: 'nenhum', novo: false },
];

const img = {
  viagem: require('../../assets/gerados/ilustracoes/ilustra-primeira-viagem.webp'),
  estrada: require('../../assets/gerados/ilustracoes/ilustra-vazio-estrada.webp'),
  custom: require('../../assets/gerados/motos/moto-custom.webp'),
  trail: require('../../assets/gerados/motos/moto-big-trail.webp'),
  touring: require('../../assets/gerados/motos/moto-touring.webp'),
  naked: require('../../assets/gerados/motos/moto-naked.webp'),
  triciclo: require('../../assets/gerados/motos/moto-triciclo.webp'),
};

const edu: Autor = { nome: 'Edu Prado', capitulo: 'Cuiabá', status: 'estrada' };
const ze: Autor = { nome: 'Zé Ferreira', capitulo: 'Cuiabá', status: 'cafe' };
const ivan: Autor = { nome: 'Ivan Coruja', capitulo: 'Várzea Grande', status: 'aberto' };
const marcos: Autor = { nome: 'Marcos Ferrugem', capitulo: 'Tangará da Serra', status: 'aberto' };
const tiao: Autor = { nome: 'Tião Garupa', capitulo: 'Cuiabá' };

export const postsExemplo: Post[] = [
  { id: 'ag1', tipo: 'agape', autor: ze, quando: 'agora' },
  {
    id: 'v1',
    tipo: 'viagem',
    autor: edu,
    quando: 'há 2 h',
    texto: 'Bate-volta na Chapada com a turma. Estrada de terra depois do Véu de Noiva tá uma beleza!',
    imagem: img.viagem,
    km: 148,
    horas: '3 h 40',
    irmaos: 6,
    xp: 350,
    selo: 'irmaoNaRota',
    terraPct: 22,
    marcados: ['Zé Ferreira', 'Ivan Coruja'],
    tfa: 23,
    comentarios: 7,
  },
  {
    id: 'p1',
    tipo: 'passeio',
    autor: { nome: 'Diretoria Cuiabá', capitulo: 'Cuiabá' },
    quando: 'há 4 h',
    passeioId: 'transpantaneira',
  },
  {
    id: 'f1',
    tipo: 'foto',
    autor: ze,
    quando: 'há 5 h',
    texto: 'Revisão feita, pneu novo. Pronta pra Transpantaneira!',
    imagem: img.custom,
    tfa: 31,
    comentarios: 4,
  },
  {
    id: 'c1',
    tipo: 'chegada',
    autor: marcos,
    quando: 'há 6 h',
    cidade: 'Campo Novo do Parecis',
    irmaosPerto: 3,
  },
  {
    id: 'e1',
    tipo: 'enquete',
    autor: ivan,
    quando: 'ontem',
    pergunta: 'Onde vai ser o próximo Ágape?',
    opcoes: [
      { texto: 'Posto Trevo', votos: 12 },
      { texto: 'Mirante da Chapada', votos: 19 },
      { texto: 'Sede de Várzea Grande', votos: 7 },
    ],
  },
  {
    id: 'v2',
    tipo: 'viagem',
    autor: marcos,
    quando: 'ontem',
    texto: 'Estradão de Tangará até Campo Novo. Poeira, chapadão e pôr do sol. Valeu cada km!',
    imagem: img.trail,
    km: 186,
    horas: '5 h 10',
    irmaos: 3,
    xp: 290,
    terraPct: 68,
    marcados: ['Edu Prado'],
    tfa: 18,
    comentarios: 5,
  },
  { id: 'q1', tipo: 'conquista', autor: tiao, quando: 'ontem', nivel: 'bodeVelho' },
  {
    id: 'f2',
    tipo: 'foto',
    autor: ivan,
    quando: 'há 2 dias',
    texto: 'Chegou a nova da casa. Quem topa estrear domingo?',
    imagem: img.touring,
    tfa: 44,
    comentarios: 12,
  },
  { id: 'p2', tipo: 'passeio', autor: edu, quando: 'há 2 dias', passeioId: 'chapada-bate-volta' },
  {
    id: 'v3',
    tipo: 'viagem',
    autor: ze,
    quando: 'há 3 dias',
    texto: 'Volta da Sede de Rondonópolis com chuva no fim. Todo mundo chegou bem, TFA a todos.',
    imagem: img.estrada,
    km: 432,
    horas: '7 h 20',
    irmaos: 9,
    xp: 640,
    selo: 'sedesMt',
    terraPct: 0,
    marcados: ['Edu Prado', 'Marcos Ferrugem', 'Tião Garupa'],
    tfa: 57,
    comentarios: 15,
  },
  {
    id: 'a1',
    tipo: 'aviso',
    autor: { nome: 'Diretoria Geral', capitulo: 'Bodes do Asfalto' },
    quando: 'há 3 dias',
    titulo: 'Encontro estadual',
    texto: 'Confirmem presença até sexta. Haverá ponto de apoio com combustível no km 40.',
  },
  {
    id: 'f3',
    tipo: 'foto',
    autor: tiao,
    quando: 'há 4 dias',
    texto: 'Triciclo também é moto, irmãos! Garupa garantida pra quem precisar.',
    imagem: img.triciclo,
    tfa: 26,
    comentarios: 9,
  },
  {
    id: 'f4',
    tipo: 'foto',
    autor: edu,
    quando: 'há 5 dias',
    texto: 'Primeira viagem da naked com o colete novo.',
    imagem: img.naked,
    tfa: 19,
    comentarios: 3,
  },
];
