import { distanciaKm, pontoADistancia, type Coordenada } from '@/navegacao/destinos';

import { codificarPolyline, decodificarPolyline } from './polyline';
import type { RotaPlanejada, TipoEstrada, Trecho } from './tipos';

/**
 * Servidor de rotas Valhalla.
 * Durante os testes usa o servidor público da FOSSGIS (uso leve, sem garantia);
 * antes do lançamento troca para o servidor próprio (Etapa 3, ver docs/CUSTOS.md).
 */
export const SERVIDOR_VALHALLA = 'https://valhalla1.openstreetmap.de';

/**
 * Preferências de moto por tipo de estrada (costing "motorcycle" do Valhalla), conforme R42:
 * - Só asfalto: primeiro tenta sem nenhuma terra (exclude_unpaved); se não houver caminho
 *   (sítio, fazenda), refaz com use_trails 0 — terra só onde não tem jeito — e avisa o irmão;
 * - Misto: use_trails 0,4 (piso neutro: o caminho mais curto, com ou sem terra);
 * - Prefiro terra: use_trails 1 e pouca rodovia.
 */
export function opcoesDeCusto(tipo: TipoEstrada, semCorteDeTerra = false) {
  switch (tipo) {
    case 'asfalto':
      return semCorteDeTerra
        ? { use_trails: 0, use_highways: 1 }
        : { use_trails: 0, exclude_unpaved: true, use_highways: 1 };
    case 'terra':
      return { use_trails: 1, use_highways: 0.2 };
    default:
      return { use_trails: 0.4, use_highways: 0.7 };
  }
}

type Buscar = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal },
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

type Viagem = { legs?: { shape: string }[]; summary?: { length: number; time: number } };
type RespostaRota = { trip?: Viagem; alternates?: { trip?: Viagem }[] };
type RespostaAtributos = {
  edges?: { unpaved?: boolean; length?: number; begin_shape_index?: number; end_shape_index?: number }[];
};

export class ErroRota extends Error {
  constructor(public readonly motivo: 'semRota' | 'semRede') {
    super(motivo);
  }
}

/** Separa a forma em trechos de terra/asfalto a partir das arestas do Valhalla. */
export function separarTrechos(forma: Coordenada[], arestas: RespostaAtributos['edges'] = []): Trecho[] {
  const trechos: Trecho[] = [];
  for (const a of arestas) {
    const inicio = a.begin_shape_index ?? 0;
    const fim = a.end_shape_index ?? inicio;
    const pontos = forma.slice(inicio, fim + 1);
    if (pontos.length < 2) continue;
    const terra = !!a.unpaved;
    const km = a.length ?? 0;
    const ultimo = trechos[trechos.length - 1];
    if (ultimo && ultimo.terra === terra) {
      ultimo.pontos.push(...pontos.slice(1));
      ultimo.km = (ultimo.km ?? 0) + km;
    } else trechos.push({ pontos, terra, km });
  }
  return trechos.length ? trechos : [{ pontos: forma, terra: false }];
}

/** Tempo máximo esperando o servidor de rotas. */
export const LIMITE_VALHALLA_MS = 12000;
/** Segunda chance (sem alternativas), mais curta. */
export const LIMITE_VALHALLA_RETENTATIVA_MS = 8000;
/** Acima disso (estimado: linha reta x 1,3) não pedimos alternativas: o servidor demora demais. */
export const LIMITE_KM_ALTERNATIVAS = 300;

export async function planejarRota(
  origem: Coordenada,
  destino: Coordenada,
  tipo: TipoEstrada,
  buscar: Buscar = fetch as unknown as Buscar,
  extras: { passagens?: Coordenada[]; curvas?: boolean; sinal?: AbortSignal } = {},
): Promise<RotaPlanejada> {
  const pontos = [origem, ...(extras.passagens ?? []), destino];
  const viagemCurta = distanciaKm(origem, destino) * 1.3 < LIMITE_KM_ALTERNATIVAS;
  const corpo = (semCorteDeTerra: boolean, alternativas = true) => ({
    locations: pontos.map((p, i) => ({
      lat: p.lat,
      lon: p.lng,
      // pontos intermediários são "passe por aqui" (sem parada), para formar o laço do bate-volta
      ...(i > 0 && i < pontos.length - 1 ? { type: 'through' } : {}),
    })),
    costing: 'motorcycle',
    costing_options: {
      motorcycle: { ...opcoesDeCusto(tipo, semCorteDeTerra), ...(extras.curvas ? { use_highways: 0 } : {}) },
    },
    directions_options: { units: 'kilometers', language: 'pt-BR' },
    // Até 2 caminhos alternativos (R43); o Valhalla só calcula alternativas entre 2 pontos.
    ...(pontos.length === 2 && viagemCurta && alternativas ? { alternates: 2 } : {}),
  });
  const pedir = async (caminho: string, dados: object, limite = LIMITE_VALHALLA_MS) => {
    let resp;
    // O servidor público às vezes demora; desistir cedo e avisar é melhor que a tela parada.
    const corte = new AbortController();
    const relogio = setTimeout(() => corte.abort(), limite);
    const cancelar = () => corte.abort();
    if (extras.sinal?.aborted) corte.abort();
    extras.sinal?.addEventListener('abort', cancelar);
    try {
      resp = await buscar(`${SERVIDOR_VALHALLA}${caminho}`, {
        signal: corte.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
    } catch {
      throw new ErroRota('semRede');
    } finally {
      clearTimeout(relogio);
      extras.sinal?.removeEventListener('abort', cancelar);
    }
    if (!resp.ok) throw new ErroRota(resp.status >= 500 ? 'semRede' : 'semRota');
    return resp.json();
  };

  let semCaminhoSoAsfalto = false;
  let rota: RespostaRota;
  const pediuAlternativas = pontos.length === 2 && viagemCurta;
  const rotaRapida = async (semCorte: boolean) => {
    try {
      return (await pedir('/route', corpo(semCorte))) as RespostaRota;
    } catch (e) {
      // Servidor lento ou fora com alternativas: uma segunda chance, mais curta e sem alternativas.
      if (!pediuAlternativas || !(e instanceof ErroRota) || e.motivo !== 'semRede' || extras.sinal?.aborted)
        throw e;
      return (await pedir('/route', corpo(semCorte, false), LIMITE_VALHALLA_RETENTATIVA_MS)) as RespostaRota;
    }
  };
  try {
    rota = await rotaRapida(false);
  } catch (e) {
    if (tipo !== 'asfalto' || !(e instanceof ErroRota) || e.motivo !== 'semRota') throw e;
    // Não existe caminho só de asfalto: refaz evitando a terra ao máximo e avisa.
    rota = await rotaRapida(true);
    semCaminhoSoAsfalto = true;
  }
  const montar = async (viagem: Viagem | undefined): Promise<RotaPlanejada> => {
    const pernas = viagem?.legs ?? [];
    const resumo = viagem?.summary;
    if (!pernas.length || !resumo) throw new ErroRota('semRota');
    // Junta as pernas (o ponto final de uma é o inicial da próxima).
    const forma = pernas.flatMap((pr, i) => decodificarPolyline(pr.shape, 6).slice(i === 0 ? 0 : 1));
    const formaCodificada = pernas.length === 1 ? pernas[0]!.shape : codificarPolyline(forma, 6);

    let trechos: Trecho[] = [{ pontos: forma, terra: false, km: resumo.length }];
    let kmTerra = 0;
    try {
      const atributos = (await pedir('/trace_attributes', {
        encoded_polyline: formaCodificada,
        shape_match: 'edge_walk',
        costing: 'motorcycle',
        filters: {
          attributes: ['edge.unpaved', 'edge.length', 'edge.begin_shape_index', 'edge.end_shape_index'],
          action: 'include',
        },
      })) as RespostaAtributos;
      trechos = separarTrechos(forma, atributos.edges);
      kmTerra = (atributos.edges ?? [])
        .filter((x) => x.unpaved)
        .reduce((soma, x) => soma + (x.length ?? 0), 0);
    } catch {
      // Sem os atributos a rota continua válida; só não sabemos quanto é terra.
    }
    return {
      forma,
      trechos,
      km: resumo.length,
      kmTerra: Math.round(kmTerra * 10) / 10,
      kmAteTerra: kmAteATerra(trechos),
      minutos: Math.round(resumo.time / 60),
      tipo,
      ...(semCaminhoSoAsfalto ? { aviso: 'semCaminhoSoAsfalto' as const } : {}),
    };
  };

  const principal = await montar(rota.trip);
  const alternativas: RotaPlanejada[] = [];
  for (const alt of rota.alternates ?? []) {
    const r = await montar(alt.trip).catch(() => null);
    if (r) alternativas.push(r);
  }
  return alternativas.length ? { ...principal, alternativas } : principal;
}

/** Km rodados até começar o primeiro trecho de terra (undefined se não há terra). */
export function kmAteATerra(trechos: Trecho[]): number | undefined {
  let km = 0;
  for (const t of trechos) {
    if (t.terra) return Math.round(km * 10) / 10;
    km += t.km ?? 0;
  }
  return undefined;
}

/** Pontos de passagem espalhados pela rota (sem início e fim), para o Google seguir o mesmo caminho. */
export function amostrarPassagens(forma: Coordenada[], quantidade = 12): Coordenada[] {
  if (forma.length < 3 || quantidade <= 0) return [];
  const passo = (forma.length - 1) / (quantidade + 1);
  const saida: Coordenada[] = [];
  for (let k = 1; k <= quantidade; k++) {
    const p = forma[Math.round(k * passo)];
    if (p) saida.push(p);
  }
  return saida;
}

/** Direções da rosa de 8 setores (R45): graus a partir do norte. */
export const rumos = { N: 0, NE: 45, L: 90, SE: 135, S: 180, SO: 225, O: 270, NO: 315 } as const;
export type Rumo = keyof typeof rumos;

/** As estradas fazem a viagem ~30 % mais longa que a linha reta. */
const FATOR_ESTRADA = 1.3;

/**
 * Pontos de passagem do bate-volta: um laço em forma de gota para o lado escolhido.
 * Origem → A → B → origem, com A e B a ±35° do rumo. Perímetro em linha reta ≈ r·(2 + 2·sen 35°),
 * então r = km / (FATOR_ESTRADA · (2 + 2·sen 35°)). "variacao" gira o laço para gerar outra opção.
 */
export function pontosBateVolta(
  origem: Coordenada,
  km: number,
  rumoGraus: number,
  variacao = 0,
): Coordenada[] {
  const abertura = 35;
  const r = km / (FATOR_ESTRADA * (2 + 2 * Math.sin((abertura * Math.PI) / 180)));
  const giros = [0, -25, 25, -50, 50];
  const giro = giros[variacao % giros.length]!;
  const centro = rumoGraus + giro;
  return [pontoADistancia(origem, r, centro - abertura), pontoADistancia(origem, r, centro + abertura)];
}

/** Rota de ida e volta pela distância e direção escolhidas, com a preferência de estrada e "mais curvas". */
export function planejarBateVolta(
  origem: Coordenada,
  opcoes: { km: number; rumo: Rumo; tipo: TipoEstrada; curvas: boolean; variacao?: number },
  buscar: Buscar = fetch as unknown as Buscar,
  sinal?: AbortSignal,
) {
  const passagens = pontosBateVolta(origem, opcoes.km, rumos[opcoes.rumo], opcoes.variacao ?? 0);
  return planejarRota(origem, origem, opcoes.tipo, buscar, { passagens, curvas: opcoes.curvas, sinal });
}
