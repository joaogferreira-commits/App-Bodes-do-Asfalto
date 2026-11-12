/**
 * Conversas (Etapa A, modo local — pedido do dono em 12/11/2026). Decisões em docs/PLANO_V2.md:
 * 1:1 só depois de aceno aceito; grupos automáticos do capítulo, do passeio/evento (quem marcou "Vou"),
 * do comboio e do Ágape (temporários); canal de Avisos da diretoria (só diretoria publica).
 * Sem servidor ainda: as mensagens ficam neste celular e não chegam aos outros irmãos.
 */
export type TipoConversa = 'avisos' | 'capitulo' | 'passeio' | 'comboio' | 'agape' | 'direto';

export type Conversa = {
  id: string;
  tipo: TipoConversa;
  titulo: string;
  /** para 1:1: nome do irmão */
  com?: string;
  /** 1:1 ainda esperando o outro aceitar o aceno */
  aguardandoAceno?: boolean;
  participantes: number;
  /** grupos temporários fecham sozinhos (comboio/Ágape: ao fim; passeio: 48 h depois) */
  terminaEm?: string;
  /** grupos do capítulo/passeio já vêm silenciados (só resumo); SOS nunca silencia */
  silenciadoPadrao?: boolean;
};

export type Mensagem = {
  id: string;
  conversa: string;
  autor: string;
  texto: string;
  /** ISO */
  quando: string;
  minha?: boolean;
  /** mensagem rápida de estrada (botões prontos) */
  rapida?: boolean;
  tfa?: number;
};

const hoje = (h: number, m: number) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const conversasExemplo: Conversa[] = [
  { id: 'avisos-cuiaba', tipo: 'avisos', titulo: 'Avisos da diretoria · Cuiabá', participantes: 86 },
  {
    id: 'capitulo-cuiaba',
    tipo: 'capitulo',
    titulo: 'Capítulo Cuiabá',
    participantes: 86,
    silenciadoPadrao: true,
  },
  {
    id: 'passeio-chapada',
    tipo: 'passeio',
    titulo: 'Passeio Chapada dos Guimarães',
    participantes: 14,
    silenciadoPadrao: true,
  },
  {
    id: 'comboio-sabado',
    tipo: 'comboio',
    titulo: 'Comboio de sábado',
    participantes: 6,
    terminaEm: 'sábado 18h',
  },
  {
    id: 'agape-trevo',
    tipo: 'agape',
    titulo: 'Ágape no Posto Trevo',
    participantes: 4,
    terminaEm: 'hoje 21h',
  },
  { id: 'direto-ze', tipo: 'direto', titulo: 'Zé Ferreira', com: 'Zé Ferreira', participantes: 2 },
  {
    id: 'direto-edu',
    tipo: 'direto',
    titulo: 'Edu Prado',
    com: 'Edu Prado',
    participantes: 2,
    aguardandoAceno: true,
  },
];

export const mensagensExemplo: Mensagem[] = [
  {
    id: 'm1',
    conversa: 'avisos-cuiaba',
    autor: 'Diretoria Cuiabá',
    texto: 'Reunião do capítulo quarta, 19h30, na sede. Pauta: passeio de dezembro e Ágape de fim de ano.',
    quando: hoje(8, 10),
    tfa: 23,
  },
  {
    id: 'm2',
    conversa: 'capitulo-cuiaba',
    autor: 'Ivan Coruja',
    texto: 'Bom dia, irmãos! Alguém pra um café no Trevo?',
    quando: hoje(7, 2),
  },
  {
    id: 'm3',
    conversa: 'capitulo-cuiaba',
    autor: 'Tião Garupa',
    texto: 'Tô dentro, chego 8h.',
    quando: hoje(7, 15),
  },
  {
    id: 'm4',
    conversa: 'passeio-chapada',
    autor: 'Edu Prado',
    texto: 'Saída 7h do posto da Av. do CPA. Tanque cheio!',
    quando: hoje(9, 30),
  },
  {
    id: 'm5',
    conversa: 'comboio-sabado',
    autor: 'Zé Ferreira',
    texto: 'Parei para abastecer.',
    quando: hoje(10, 5),
    rapida: true,
  },
  {
    id: 'm6',
    conversa: 'agape-trevo',
    autor: 'Zé Ferreira',
    texto: 'Mesa grande no fundo, encosta aí!',
    quando: hoje(18, 40),
  },
  {
    id: 'm7',
    conversa: 'direto-ze',
    autor: 'Zé Ferreira',
    texto: 'Irmão, aceitei seu aceno. Bora rodar sábado?',
    quando: hoje(11, 20),
  },
];

/** Respostas rápidas de estrada (um toque, sem digitar). */
export const respostasRapidas = ['chegando10', 'abastecendo', 'tudoCerto', 'atrasado', 'tfa'] as const;
export type RespostaRapida = (typeof respostasRapidas)[number];

/** Quem pode escrever: no canal de avisos só a diretoria; 1:1 só com aceno aceito; ninguém bloqueado. */
export function podeEscrever(
  c: Conversa,
  papel: 'membro' | 'diretoria_capitulo' | 'moderador' | 'admin' | string,
  bloqueados: string[],
) {
  if (c.tipo === 'avisos') return papel === 'diretoria_capitulo' || papel === 'admin';
  if (c.tipo === 'direto') return !c.aguardandoAceno && !(c.com && bloqueados.includes(c.com));
  return true;
}

/** Lista ordenada pela última mensagem (mais recente primeiro); Avisos sempre no topo. */
export function ordenarConversas(lista: Conversa[], mensagens: Mensagem[]) {
  const ultima = (id: string) =>
    mensagens.filter((m) => m.conversa === id).reduce((a, m) => (m.quando > a ? m.quando : a), '');
  return [...lista].sort((a, b) => {
    if (a.tipo === 'avisos' && b.tipo !== 'avisos') return -1;
    if (b.tipo === 'avisos' && a.tipo !== 'avisos') return 1;
    return ultima(b.id).localeCompare(ultima(a.id));
  });
}
