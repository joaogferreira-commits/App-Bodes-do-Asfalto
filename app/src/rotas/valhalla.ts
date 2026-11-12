import type { Coordenada } from '@/navegacao/destinos';

import { decodificarPolyline } from './polyline';
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
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

type RespostaRota = { trip?: { legs?: { shape: string }[]; summary?: { length: number; time: number } } };
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
    const ultimo = trechos[trechos.length - 1];
    if (ultimo && ultimo.terra === terra) ultimo.pontos.push(...pontos.slice(1));
    else trechos.push({ pontos, terra });
  }
  return trechos.length ? trechos : [{ pontos: forma, terra: false }];
}

export async function planejarRota(
  origem: Coordenada,
  destino: Coordenada,
  tipo: TipoEstrada,
  buscar: Buscar = fetch as unknown as Buscar,
): Promise<RotaPlanejada> {
  const corpo = (semCorteDeTerra: boolean) => ({
    locations: [
      { lat: origem.lat, lon: origem.lng },
      { lat: destino.lat, lon: destino.lng },
    ],
    costing: 'motorcycle',
    costing_options: { motorcycle: opcoesDeCusto(tipo, semCorteDeTerra) },
    directions_options: { units: 'kilometers', language: 'pt-BR' },
  });
  const pedir = async (caminho: string, dados: object) => {
    let resp;
    try {
      resp = await buscar(`${SERVIDOR_VALHALLA}${caminho}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
    } catch {
      throw new ErroRota('semRede');
    }
    if (!resp.ok) throw new ErroRota(resp.status >= 500 ? 'semRede' : 'semRota');
    return resp.json();
  };

  let semCaminhoSoAsfalto = false;
  let rota: RespostaRota;
  try {
    rota = (await pedir('/route', corpo(false))) as RespostaRota;
  } catch (e) {
    if (tipo !== 'asfalto' || !(e instanceof ErroRota) || e.motivo !== 'semRota') throw e;
    // Não existe caminho só de asfalto: refaz evitando a terra ao máximo e avisa.
    rota = (await pedir('/route', corpo(true))) as RespostaRota;
    semCaminhoSoAsfalto = true;
  }
  const perna = rota.trip?.legs?.[0];
  const resumo = rota.trip?.summary;
  if (!perna || !resumo) throw new ErroRota('semRota');
  const forma = decodificarPolyline(perna.shape, 6);

  let trechos: Trecho[] = [{ pontos: forma, terra: false }];
  let kmTerra = 0;
  try {
    const atributos = (await pedir('/trace_attributes', {
      encoded_polyline: perna.shape,
      shape_match: 'edge_walk',
      costing: 'motorcycle',
      filters: {
        attributes: ['edge.unpaved', 'edge.length', 'edge.begin_shape_index', 'edge.end_shape_index'],
        action: 'include',
      },
    })) as RespostaAtributos;
    trechos = separarTrechos(forma, atributos.edges);
    kmTerra = (atributos.edges ?? []).filter((a) => a.unpaved).reduce((s, a) => s + (a.length ?? 0), 0);
  } catch {
    // Sem os atributos a rota continua válida; só não sabemos quanto é terra.
  }

  return {
    forma,
    trechos,
    km: resumo.length,
    kmTerra: Math.round(kmTerra * 10) / 10,
    minutos: Math.round(resumo.time / 60),
    tipo,
    ...(semCaminhoSoAsfalto ? { aviso: 'semCaminhoSoAsfalto' as const } : {}),
  };
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
