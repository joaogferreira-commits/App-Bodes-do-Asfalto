/**
 * Limpeza dos relatórios de erro (LGPD): nada de dado maçônico, localização, telefone,
 * contato, e-mail ou token sai do aparelho junto com um erro.
 */
const CHAVE_SENSIVEL =
  /loja|oriente|potencia|potência|\blat\b|\blng\b|\blon\b|latitude|longitude|telefone|phone|contato|email|e-mail|token|authorization|apikey|password|senha|cookie/i;

const MARCA = '[removido]';
const PROFUNDIDADE_MAX = 8;

export function limparValor(valor: unknown, nivel = 0): unknown {
  if (valor === null || typeof valor !== 'object') return valor;
  if (nivel >= PROFUNDIDADE_MAX) return MARCA;
  if (Array.isArray(valor)) return valor.map((v) => limparValor(v, nivel + 1));
  const saida: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
    saida[k] = CHAVE_SENSIVEL.test(k) ? MARCA : limparValor(v, nivel + 1);
  }
  return saida;
}

type Evento = Record<string, unknown> & {
  request?: Record<string, unknown>;
  user?: unknown;
  breadcrumbs?: unknown[];
};

/** Para `beforeSend`: remove corpo/cookies/cabeçalhos da requisição, usuário e chaves sensíveis. */
export function limparEvento<T extends object>(evento: T): T {
  const e = { ...(evento as Evento) };
  if (e.request) {
    const { data: _d, cookies: _c, headers: _h, query_string: _q, ...resto } = e.request;
    e.request = resto;
  }
  delete e.user;
  const limpo = limparValor(e) as Evento;
  if (Array.isArray(e.breadcrumbs)) {
    limpo.breadcrumbs = e.breadcrumbs.map((b) => limparMigalha(b as Migalha)).filter(Boolean);
  }
  return limpo as unknown as T;
}

type Migalha = { category?: string; data?: Record<string, unknown>; message?: string } & Record<
  string,
  unknown
>;

/** Para `beforeBreadcrumb`: chamadas ao servidor ficam sem corpo, resposta e endereço completo. */
export function limparMigalha<T extends object>(migalha: T): T {
  const m = migalha as Migalha;
  const ehRede = m.category === 'fetch' || m.category === 'xhr';
  const data = ehRede
    ? Object.fromEntries(
        Object.entries(m.data ?? {}).filter(([k]) => ['method', 'status_code', 'reason'].includes(k)),
      )
    : m.data;
  return {
    ...(limparValor({ ...m, data: undefined }) as Migalha),
    ...(data ? { data: limparValor(data) } : {}),
  } as T;
}
