import { distanciaKm, type Coordenada } from '@/navegacao/destinos';

import { amostrarPassagens } from './valhalla';

/**
 * Pede ao Google (Routes API) uma rota de moto que passa pelos pontos do Valhalla sem parar
 * neles ("via") e devolve o token que a navegação do Google segue.
 *
 * Por que o Google às vezes recusa a nossa rota:
 * 1. a chave não tem a "Routes API" ativada (resposta 403) — tarefa do dono no Google Cloud;
 * 2. algum ponto de passagem cai numa estrada de terra que o Google não tem no mapa dele
 *    (resposta sem rota) — comum no interior do MT;
 * 3. pontos demais apertam o caminho e o Google não consegue ligar todos.
 * Por isso: tentamos com 10, depois 5, depois 2 pontos de passagem, e comparamos a distância
 * do Google com a nossa para dizer ao irmão, ANTES de sair, se a navegação vai seguir a rota.
 * Até 10 pontos a chamada fica na faixa mais barata da Routes API.
 */
export const URL_ROUTES = 'https://routes.googleapis.com/directions/v2:computeRoutes';

type Buscar = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal },
) => Promise<{
  ok: boolean;
  status?: number;
  json(): Promise<unknown>;
}>;

export type MotivoGoogle = 'semChave' | 'chaveSemRoutes' | 'semRota' | 'semRede';

export type ResultadoGoogle =
  | { aceita: true; token: string; passagens: number; kmGoogle: number; fiel: boolean }
  | { aceita: false; motivo: MotivoGoogle };

const ponto = (c: Coordenada) => ({ location: { latLng: { latitude: c.lat, longitude: c.lng } } });

/**
 * Cada pergunta ao Google desiste depois deste tempo. As três tentativas correm em paralelo,
 * então este também é o teto da espera total (antes eram até 24 s em fila).
 */
export const LIMITE_GOOGLE_MS = 6000;

/** Tentativas, da mais fiel à mais solta (rodam em paralelo; vale a mais fiel que o Google aceitar). */
export const TENTATIVAS_PASSAGENS = [10, 5, 2];

/** "Fiel" quando a distância do Google fica a até 10 % da nossa. */
export const TOLERANCIA_FIEL = 0.1;

type Tentativa = ResultadoGoogle;

async function tentar(
  chave: string,
  forma: Coordenada[],
  kmNosso: number,
  n: number,
  buscar: Buscar,
): Promise<Tentativa> {
  const origem = forma[0]!;
  const destino = forma[forma.length - 1]!;
  const passagens = amostrarPassagens(forma, n);
  let resp;
  const corte = new AbortController();
  const relogio = setTimeout(() => corte.abort(), LIMITE_GOOGLE_MS);
  try {
    resp = await buscar(URL_ROUTES, {
      signal: corte.signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': chave,
        'X-Goog-FieldMask': 'routes.routeToken,routes.distanceMeters',
      },
      body: JSON.stringify({
        origin: ponto(origem),
        destination: ponto(destino),
        intermediates: passagens.map((p) => ({ ...ponto(p), via: true })),
        // O token só vale para o mesmo modo de viagem da navegação, e a ponte do SDK só aceita
        // DRIVING (0) ao seguir um token; por isso pedimos DRIVE aqui.
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
      }),
    });
  } catch {
    return { aceita: false, motivo: 'semRede' };
  } finally {
    clearTimeout(relogio);
  }
  if (resp.status === 403 || resp.status === 401) return { aceita: false, motivo: 'chaveSemRoutes' };
  if (!resp.ok) return { aceita: false, motivo: resp.status && resp.status >= 500 ? 'semRede' : 'semRota' };
  const dados = (await resp.json().catch(() => ({}))) as {
    routes?: { routeToken?: string; distanceMeters?: number }[];
  };
  const r = dados.routes?.[0];
  if (!r?.routeToken) return { aceita: false, motivo: 'semRota' };
  const kmGoogle = Math.round((r.distanceMeters ?? 0) / 100) / 10;
  const fiel = kmNosso > 0 && Math.abs(kmGoogle - kmNosso) / kmNosso <= TOLERANCIA_FIEL;
  return { aceita: true, token: r.routeToken, passagens: n, kmGoogle, fiel };
}

export async function rotaNoGoogle(
  chave: string,
  forma: Coordenada[],
  kmNosso: number,
  buscar: Buscar = fetch as unknown as Buscar,
): Promise<ResultadoGoogle> {
  if (!chave) return { aceita: false, motivo: 'semChave' };
  // Todas ao mesmo tempo; esperamos na ordem de preferência (10 > 5 > 2), então a mais detalhada
  // aceita ganha e a espera total é a da mais lenta, no máximo LIMITE_GOOGLE_MS.
  const disparadas = TENTATIVAS_PASSAGENS.map((n) => tentar(chave, forma, kmNosso, n, buscar));
  const resultados = await Promise.allSettled(disparadas);
  const lista: Tentativa[] = resultados.map((r) =>
    r.status === 'fulfilled' ? r.value : { aceita: false, motivo: 'semRede' },
  );
  const aceita = lista.find((r) => r.aceita);
  if (aceita) return aceita;
  const motivos = lista.map((r) => (r.aceita ? null : r.motivo));
  if (motivos.includes('chaveSemRoutes')) return { aceita: false, motivo: 'chaveSemRoutes' };
  if (motivos.includes('semRota')) return { aceita: false, motivo: 'semRota' };
  return { aceita: false, motivo: 'semRede' };
}

/** Quanto tempo um token pré-buscado continua servindo para a partida. */
export const VALIDADE_PREFETCH_MS = 10 * 60 * 1000;
/** Se o irmão já está mais longe que isso do início planejado, o token antigo não serve. */
export const DISTANCIA_PREFETCH_KM = 0.5;

const cache = new Map<string, { promessa: Promise<ResultadoGoogle>; em: number }>();

/** Identifica a rota escolhida (cada opção da tela tem forma própria). */
export function idDaRota(forma: Coordenada[], km: number): string {
  const f = forma[0]!;
  const u = forma[forma.length - 1]!;
  const meio = forma[Math.floor(forma.length / 2)]!;
  return [forma.length, km, f.lat, f.lng, meio.lat, meio.lng, u.lat, u.lng].join('|');
}

/**
 * Começa a pedir o token ao Google em segundo plano assim que a rota é escolhida na tela de
 * planejamento. Chamadas repetidas para a mesma rota reaproveitam o mesmo pedido.
 */
export function prefetchGoogle(
  chave: string,
  forma: Coordenada[],
  kmNosso: number,
  buscar?: Buscar,
): Promise<ResultadoGoogle> {
  const id = idDaRota(forma, kmNosso);
  const atual = cache.get(id);
  if (atual && Date.now() - atual.em < VALIDADE_PREFETCH_MS) return atual.promessa;
  const promessa = rotaNoGoogle(chave, forma, kmNosso, buscar);
  cache.set(id, { promessa, em: Date.now() });
  // falha não fica guardada: a próxima tentativa pergunta de novo
  void promessa.then((r) => {
    if (!r.aceita && cache.get(id)?.promessa === promessa) cache.delete(id);
  });
  while (cache.size > 6) cache.delete(cache.keys().next().value as string);
  return promessa;
}

export function limparPrefetchGoogle() {
  cache.clear();
}

/**
 * Token para sair agora: reaproveita o pré-buscado (instantâneo) se ainda é recente e o irmão
 * está perto do início planejado; senão pede um novo saindo de onde ele está.
 */
export async function tokenParaSair(
  chave: string,
  forma: Coordenada[],
  kmNosso: number,
  atual: Coordenada,
  buscar?: Buscar,
): Promise<string | null> {
  const guardado = cache.get(idDaRota(forma, kmNosso));
  if (
    guardado &&
    Date.now() - guardado.em < VALIDADE_PREFETCH_MS &&
    distanciaKm(atual, forma[0]!) <= DISTANCIA_PREFETCH_KM
  ) {
    const r = await guardado.promessa;
    if (r.aceita) return r.token;
  }
  const r = await rotaNoGoogle(chave, [atual, ...forma.slice(1)], kmNosso, buscar);
  return r.aceita ? r.token : null;
}

/** Compatibilidade: só o token (ou null). */
export async function tokenDaRota(
  chave: string,
  origem: Coordenada,
  destino: Coordenada,
  passagens: Coordenada[],
  buscar: Buscar = fetch as unknown as Buscar,
): Promise<string | null> {
  const r = await rotaNoGoogle(chave, [origem, ...passagens, destino], 0, buscar);
  return r.aceita ? r.token : null;
}
