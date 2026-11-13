/**
 * Janelas do app (substituem o Alert nativo, cinza e difícil de fechar).
 * API imperativa: pode ser chamada de telas, serviços e de qualquer módulo fora do React.
 * A janela é desenhada por <DialogoHost /> (montado uma vez no layout raiz).
 */
export type BotaoAviso = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type OpcaoMenu = {
  rotulo: string;
  /** Nome de um ícone de traço (ui/icones). */
  icone?: string;
  destrutivo?: boolean;
  onPress: () => void;
};

export type PedidoAviso = { tipo: 'aviso'; titulo: string; mensagem?: string; botoes: BotaoAviso[] };
export type PedidoMenu = { tipo: 'menu'; titulo?: string; mensagem?: string; opcoes: OpcaoMenu[] };
export type Pedido = PedidoAviso | PedidoMenu;

type Ouvinte = () => void;

let fila: Pedido[] = [];
const ouvintes = new Set<Ouvinte>();

const avisarOuvintes = () => ouvintes.forEach((o) => o());

/** Mostra um aviso/confirmação. Sem botões, aparece um "OK". Várias chamadas entram na fila. */
export function avisar(titulo: string, mensagem?: string, botoes?: BotaoAviso[]) {
  fila = [...fila, { tipo: 'aviso', titulo, mensagem, botoes: botoes?.length ? botoes : [] }];
  avisarOuvintes();
}

/** Mostra um menu de ações (folha na base da tela, com linhas grandes e "Cancelar"). */
export function abrirMenu(menu: { titulo?: string; mensagem?: string; opcoes: OpcaoMenu[] }) {
  fila = [...fila, { tipo: 'menu', titulo: menu.titulo, mensagem: menu.mensagem, opcoes: menu.opcoes }];
  avisarOuvintes();
}

/** Janela atual (a primeira da fila). */
export function pedidoAtual(): Pedido | undefined {
  return fila[0];
}

/** Fecha a janela atual e passa para a próxima da fila. */
export function fecharAtual() {
  fila = fila.slice(1);
  avisarOuvintes();
}

export function assinarDialogos(ouvinte: Ouvinte) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

/** Para testes: esvazia a fila. */
export function limparDialogos() {
  fila = [];
  avisarOuvintes();
}
