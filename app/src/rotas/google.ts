import type { Coordenada } from '@/navegacao/destinos';

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

/** Cada pergunta ao Google desiste depois deste tempo (antes travava a tela por muito tempo). */
export const LIMITE_GOOGLE_MS = 8000;

/** Tentativas, da mais fiel à mais solta. */
export const TENTATIVAS_PASSAGENS = [10, 5, 2];

/** "Fiel" quando a distância do Google fica a até 10 % da nossa. */
export const TOLERANCIA_FIEL = 0.1;

export async function rotaNoGoogle(
  chave: string,
  forma: Coordenada[],
  kmNosso: number,
  buscar: Buscar = fetch as unknown as Buscar,
): Promise<ResultadoGoogle> {
  if (!chave) return { aceita: false, motivo: 'semChave' };
  const origem = forma[0]!;
  const destino = forma[forma.length - 1]!;
  let ultimoMotivo: MotivoGoogle = 'semRota';
  for (const n of TENTATIVAS_PASSAGENS) {
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
          travelMode: 'TWO_WHEELER',
          routingPreference: 'TRAFFIC_AWARE',
        }),
      });
    } catch {
      return { aceita: false, motivo: 'semRede' };
    } finally {
      clearTimeout(relogio);
    }
    if (resp.status === 403 || resp.status === 401) return { aceita: false, motivo: 'chaveSemRoutes' };
    if (!resp.ok) {
      ultimoMotivo = resp.status && resp.status >= 500 ? 'semRede' : 'semRota';
      continue;
    }
    const dados = (await resp.json().catch(() => ({}))) as {
      routes?: { routeToken?: string; distanceMeters?: number }[];
    };
    const r = dados.routes?.[0];
    if (!r?.routeToken) {
      ultimoMotivo = 'semRota';
      continue;
    }
    const kmGoogle = Math.round((r.distanceMeters ?? 0) / 100) / 10;
    const fiel = kmNosso > 0 && Math.abs(kmGoogle - kmNosso) / kmNosso <= TOLERANCIA_FIEL;
    return { aceita: true, token: r.routeToken, passagens: n, kmGoogle, fiel };
  }
  return { aceita: false, motivo: ultimoMotivo };
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
