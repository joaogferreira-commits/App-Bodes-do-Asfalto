import type { ChaveSelo } from './conquistas';
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
  | {
      id: string;
      tipo: 'passeio';
      autor: Autor;
      quando: string;
      titulo: string;
      data: string;
      saida: string;
      km: number;
      vou: number;
      talvez: number;
      imagem: number;
    }
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

export const postsExemplo: Post[] = [
  {
    id: 'v1',
    tipo: 'viagem',
    autor: { nome: 'Edu Prado', capitulo: 'Cuiabá', status: 'estrada' },
    quando: 'há 2 h',
    texto: 'Bate-volta na Chapada com a turma. Estrada de terra depois do Véu de Noiva tá uma beleza!',
    imagem: require('../../assets/gerados/ilustracoes/ilustra-primeira-viagem.webp'),
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
    quando: 'ontem',
    titulo: 'Passeio à Transpantaneira',
    data: 'sáb, 22/11 · 6h30',
    saida: 'Sede Cuiabá',
    km: 260,
    vou: 14,
    talvez: 5,
    imagem: require('../../assets/gerados/ilustracoes/ilustra-vazio-estrada.webp'),
  },
  {
    id: 'f1',
    tipo: 'foto',
    autor: { nome: 'Zé Ferreira', capitulo: 'Cuiabá', status: 'cafe' },
    quando: 'ontem',
    texto: 'Revisão feita, pneu novo. Pronta pra Transpantaneira!',
    imagem: require('../../assets/gerados/motos/moto-custom.webp'),
    tfa: 31,
    comentarios: 4,
  },
  {
    id: 'e1',
    tipo: 'enquete',
    autor: { nome: 'Ivan Coruja', capitulo: 'Várzea Grande', status: 'aberto' },
    quando: 'há 2 dias',
    pergunta: 'Onde vai ser o próximo Ágape?',
    opcoes: [
      { texto: 'Posto Trevo', votos: 12 },
      { texto: 'Mirante da Chapada', votos: 19 },
      { texto: 'Sede de Várzea Grande', votos: 7 },
    ],
  },
  {
    id: 'a1',
    tipo: 'aviso',
    autor: { nome: 'Diretoria Geral', capitulo: 'Bodes do Asfalto' },
    quando: 'há 3 dias',
    titulo: 'Encontro estadual',
    texto: 'Confirmem presença até sexta. Haverá ponto de apoio com combustível no km 40.',
  },
];
