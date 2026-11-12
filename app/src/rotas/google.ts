import type { Coordenada } from '@/navegacao/destinos';

/**
 * Pede ao Google (Routes API) uma rota de moto que passa pelos pontos do Valhalla
 * sem parar neles ("via"), e devolve o token que a navegação do Google segue.
 */
export const URL_ROUTES = 'https://routes.googleapis.com/directions/v2:computeRoutes';

type Buscar = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{
  ok: boolean;
  json(): Promise<unknown>;
}>;

const ponto = (c: Coordenada) => ({ location: { latLng: { latitude: c.lat, longitude: c.lng } } });

export async function tokenDaRota(
  chave: string,
  origem: Coordenada,
  destino: Coordenada,
  passagens: Coordenada[],
  buscar: Buscar = fetch as unknown as Buscar,
): Promise<string | null> {
  if (!chave) return null;
  try {
    const resp = await buscar(URL_ROUTES, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': chave,
        'X-Goog-FieldMask': 'routes.routeToken',
      },
      body: JSON.stringify({
        origin: ponto(origem),
        destination: ponto(destino),
        intermediates: passagens.slice(0, 25).map((p) => ({ ...ponto(p), via: true })),
        travelMode: 'TWO_WHEELER',
        routingPreference: 'TRAFFIC_AWARE',
      }),
    });
    if (!resp.ok) return null;
    const dados = (await resp.json()) as { routes?: { routeToken?: string }[] };
    return dados.routes?.[0]?.routeToken ?? null;
  } catch {
    return null;
  }
}
