import { irmaosExemplo } from './exemplos';
import type { NomeIcone, TipoPino } from '@/ui';

/**
 * Listas de EXEMPLO das ferramentas do clube (até o cadastro real no painel).
 * Nomes, telefones e endereços são fictícios. Telefones de emergência são reais.
 */
export type ItemDiretorio = {
  id: string;
  titulo: string;
  subtitulo: string;
  detalhe?: string;
  icone?: NomeIcone;
  pino?: TipoPino;
  telefone?: string;
  whatsapp?: string;
  posicao?: { lat: number; lng: number };
  etiqueta?: string;
};

export type TipoDiretorio =
  | 'negocios'
  | 'bodeAmigo'
  | 'lojas'
  | 'eventos'
  | 'classificados'
  | 'aniversarios'
  | 'membros'
  | 'irmaosPerto'
  | 'telefones';

const WHATS = '65999990000';

export const diretorios: Record<TipoDiretorio, ItemDiretorio[]> = {
  negocios: [
    {
      id: 'n1',
      titulo: 'Oficina do Bode',
      subtitulo: 'Oficina de motos · Cuiabá',
      detalhe: 'Desconto de 10% para irmãos. Revisão, suspensão e elétrica.',
      pino: 'oficina',
      whatsapp: WHATS,
      posicao: { lat: -15.62, lng: -56.06 },
      etiqueta: 'Destaque',
    },
    {
      id: 'n2',
      titulo: 'Churrascaria Estradeiro',
      subtitulo: 'Restaurante · BR-364',
      detalhe: 'Estacionamento coberto para motos.',
      pino: 'restaurante',
      whatsapp: WHATS,
      posicao: { lat: -15.6, lng: -56.08 },
    },
    {
      id: 'n3',
      titulo: 'Pousada Chapadão',
      subtitulo: 'Pousada · Chapada dos Guimarães',
      detalhe: 'Garagem fechada e café às 6h para quem sai cedo.',
      pino: 'sede',
      whatsapp: WHATS,
      posicao: { lat: -15.46, lng: -55.75 },
    },
    {
      id: 'n4',
      titulo: 'Seguros do Irmão',
      subtitulo: 'Corretora de seguros · Várzea Grande',
      detalhe: 'Seguro de moto e assistência 24 h.',
      icone: 'socorro',
      whatsapp: WHATS,
    },
    {
      id: 'n5',
      titulo: 'MotoPeças Fraterna',
      subtitulo: 'Peças e acessórios · Cuiabá',
      detalhe: 'Pneus, capacetes e baús.',
      icone: 'oficina',
      whatsapp: WHATS,
    },
  ],
  bodeAmigo: [
    {
      id: 'b1',
      titulo: 'Pouso para 2 motos',
      subtitulo: 'Sinop · com Irmão Carlos',
      detalhe: 'Garagem e banho quente. Avisar com 1 dia.',
      icone: 'sede',
      whatsapp: WHATS,
    },
    {
      id: 'b2',
      titulo: 'Guincho de irmão',
      subtitulo: 'Rondonópolis e região · 24 h',
      detalhe: 'Atende até 150 km de Rondonópolis.',
      icone: 'alerta',
      telefone: '6599990000',
    },
    {
      id: 'b3',
      titulo: 'Oficina de emergência',
      subtitulo: 'Cáceres',
      detalhe: 'Câmara, corrente e elétrica básica, inclusive domingo.',
      pino: 'oficina',
      whatsapp: WHATS,
    },
    {
      id: 'b4',
      titulo: 'Garagem para a moto',
      subtitulo: 'Campo Novo do Parecis',
      detalhe: 'Para quem segue de carro ou ônibus e volta depois.',
      icone: 'sede',
      whatsapp: WHATS,
    },
  ],
  lojas: [
    {
      id: 'l1',
      titulo: 'Loja Exemplo da Estrada nº 00',
      subtitulo: 'Oriente de Cuiabá',
      detalhe: 'Sessões às terças, 20h. Contato: Irmão Zé.',
      pino: 'loja',
      whatsapp: WHATS,
      posicao: { lat: -15.6081, lng: -56.1032 },
    },
    {
      id: 'l2',
      titulo: 'Loja Exemplo do Cerrado nº 00',
      subtitulo: 'Oriente de Sinop',
      detalhe: 'Sessões às quintas, 20h.',
      pino: 'loja',
      whatsapp: WHATS,
    },
    {
      id: 'l3',
      titulo: 'Loja Exemplo do Pantanal nº 00',
      subtitulo: 'Oriente de Poconé',
      detalhe: 'Sessões quinzenais às segundas.',
      pino: 'loja',
      whatsapp: WHATS,
    },
  ],
  eventos: [
    {
      id: 'e1',
      titulo: 'Encontro Estadual dos Bodes',
      subtitulo: '5 a 7/12 · Rondonópolis',
      detalhe: 'Todos os capítulos. Inscrição com a diretoria.',
      icone: 'calendario',
      etiqueta: 'Clube',
    },
    {
      id: 'e2',
      titulo: 'Moto Fest Chapada',
      subtitulo: '17/01 · Chapada dos Guimarães',
      detalhe: 'Evento aberto de motoclubes da região.',
      icone: 'moto',
      etiqueta: 'Motoclubes',
    },
    {
      id: 'e3',
      titulo: 'Sessão Magna (exemplo)',
      subtitulo: '29/11 · Oriente de Cuiabá',
      detalhe: 'Divulgação de Loja. Entrada conforme o procedimento da Loja.',
      pino: 'loja',
      etiqueta: 'Lojas',
    },
  ],
  classificados: [
    {
      id: 'c1',
      titulo: 'Baú lateral par — R$ 1.200',
      subtitulo: 'Edu Prado · Cuiabá',
      detalhe: 'Pouco uso, com suportes.',
      icone: 'salvar',
      whatsapp: WHATS,
    },
    {
      id: 'c2',
      titulo: 'Capacete aberto tam. 60 — R$ 450',
      subtitulo: 'Zé Ferreira · Cuiabá',
      detalhe: 'Com viseira e bolha.',
      icone: 'perfil',
      whatsapp: WHATS,
    },
    {
      id: 'c3',
      titulo: 'Big trail 2019 — consulte',
      subtitulo: 'Marcos Ferrugem · Tangará da Serra',
      detalhe: '42 mil km, revisões em dia.',
      icone: 'moto',
      whatsapp: WHATS,
    },
  ],
  aniversarios: [
    {
      id: 'a1',
      titulo: 'Ivan Coruja',
      subtitulo: 'Hoje · Várzea Grande',
      detalhe: 'Mande um TFA!',
      icone: 'aceno',
      whatsapp: WHATS,
      etiqueta: 'Hoje',
    },
    { id: 'a2', titulo: 'Tião Garupa', subtitulo: '18/11 · Cuiabá', icone: 'calendario', whatsapp: WHATS },
    {
      id: 'a3',
      titulo: 'Marcos Ferrugem',
      subtitulo: '27/11 · Tangará da Serra',
      icone: 'calendario',
      whatsapp: WHATS,
    },
  ],
  membros: [
    { id: 'm1', titulo: 'Zé Ferreira', subtitulo: '“Zé do Trevo” · Cuiabá · Diretor', icone: 'perfil' },
    { id: 'm2', titulo: 'Edu Prado', subtitulo: '“Poeira” · Cuiabá', icone: 'perfil' },
    { id: 'm3', titulo: 'Ivan Coruja', subtitulo: '“Coruja” · Várzea Grande', icone: 'perfil' },
    { id: 'm4', titulo: 'Marcos Ferrugem', subtitulo: '“Ferrugem” · Tangará da Serra', icone: 'perfil' },
    { id: 'm5', titulo: 'Tião Garupa', subtitulo: '“Garupa” · Cuiabá', icone: 'perfil' },
  ],
  irmaosPerto: irmaosExemplo.map((i) => ({
    id: i.id,
    titulo: i.nome,
    subtitulo: '',
    icone: 'aceno' as NomeIcone,
    posicao: { lat: i.lat, lng: i.lng },
    etiqueta: i.status,
  })),
  telefones: [
    { id: 't192', titulo: '192 · SAMU', subtitulo: 'Emergência médica', icone: 'socorro', telefone: '192' },
    {
      id: 't193',
      titulo: '193 · Bombeiros',
      subtitulo: 'Acidente, resgate e incêndio',
      icone: 'alerta',
      telefone: '193',
    },
    {
      id: 't191',
      titulo: '191 · PRF',
      subtitulo: 'Polícia Rodoviária Federal (rodovias federais)',
      icone: 'moto',
      telefone: '191',
    },
    {
      id: 't190',
      titulo: '190 · Polícia Militar',
      subtitulo: 'Roubo, ameaça, ocorrência',
      icone: 'visivel',
      telefone: '190',
    },
    {
      id: 't199',
      titulo: '199 · Defesa Civil',
      subtitulo: 'Enchente, queda de barreira',
      icone: 'alerta',
      telefone: '199',
    },
  ],
};
