import type { RotaPlanejada, TipoEstrada } from '@/rotas/tipos';

import type { Coordenada } from './destinos';
import type { Evitar } from './opcoes';

/** Partes do NavigationController do Google usadas pela prova (facilita os testes). */
export type ControladorNavegacao = {
  showTermsAndConditionsDialog(): Promise<boolean>;
  areTermsAccepted(): Promise<boolean>;
  init(): Promise<string>;
  setDestinations(
    waypoints: { title?: string; position: Coordenada }[],
    options?: {
      routingOptions?: { travelMode?: number } & Partial<Evitar>;
      routeTokenOptions?: { routeToken: string; travelMode?: number };
    },
  ): Promise<string>;
  setAudioGuidanceType(tipo: number): Promise<void>;
  startGuidance(): Promise<void>;
  /** Liga o envio das curvas para a tela do carro (cartão de manobra do Android Auto). */
  setTurnByTurnLoggingEnabled?(ligado: boolean): void;
};

export type ResultadoNavegacao =
  | 'ok'
  | 'okRotaRapida'
  | 'semPermissao'
  | 'termosRecusados'
  | 'chaveNaoAutorizada'
  | 'semRede'
  | 'semRota'
  | 'semLocalizacao'
  | 'erro';

/** Valores dos enums do SDK (TravelMode.TWO_WHEELER e AudioGuidance). */
export const MODO_MOTO = 3;
/** A ponte do SDK só aceita DRIVING (0) com token de rota; o token também é pedido como DRIVE. */
export const MODO_CARRO = 0;
export const VOZ_COMPLETA_BLUETOOTH = 4 | 8;

type Dependencias = {
  controlador: ControladorNavegacao;
  pedirPermissaoLocalizacao: () => Promise<boolean>;
  posicaoAtual: () => Promise<Coordenada | null>;
  destino: (atual: Coordenada) => Coordenada;
  tituloDestino: string;
  /** Token da rota planejada (Valhalla → Google Routes). Sem token, o Google escolhe a rota. */
  tokenRota?: string | null;
  /**
   * Pede um token NOVO saindo de onde o irmão está agora. O token feito na tela de rota partia do
   * ponto do planejamento e podia ter expirado — era por isso que o Google "aceitava e depois recusava".
   */
  tokenNaHora?: (atual: Coordenada) => Promise<string | null>;
  /** Avisa o motivo quando o Google recusa a rota planejada (aparece pequeno na faixa de aviso). */
  aoRecusarRota?: (motivo: string) => void;
  /** Evitar pedágios, rodovias e balsas (vale quando o Google escolhe a rota, sem token). */
  evitar?: Evitar;
  /** Tipo de voz do SDK (padrão: completa pelo Bluetooth). */
  voz?: number;
};

/** Sem escolha do irmão, só as balsas são evitadas (como sempre foi). */
const evitarPadrao: Evitar = { avoidTolls: false, avoidHighways: false, avoidFerries: true };

/** Tempo máximo esperando o Google aceitar a rota planejada antes de seguir pela rota dele. */
export const LIMITE_ROTA_MS = 8000;

/** Espera máxima pelo token novo (ele corre junto com a abertura do SDK). */
export const LIMITE_TOKEN_MS = 6500;

function comLimite<T>(p: Promise<T>, ms: number, seEsgotar: T): Promise<T> {
  return new Promise((ok) => {
    const relogio = setTimeout(() => ok(seEsgotar), ms);
    p.then(
      (v) => {
        clearTimeout(relogio);
        ok(v);
      },
      () => {
        clearTimeout(relogio);
        ok(seEsgotar);
      },
    );
  });
}

/**
 * Passos da prova: permissão → termos do Google → iniciar sessão → rota de moto → voz → guiar.
 * A voz sai pelo Bluetooth (intercomunicador) quando houver.
 */
export async function iniciarNavegacao(dep: Dependencias): Promise<ResultadoNavegacao> {
  try {
    if (!(await dep.pedirPermissaoLocalizacao())) return 'semPermissao';

    const aceitos =
      (await dep.controlador.areTermsAccepted()) || (await dep.controlador.showTermsAndConditionsDialog());
    if (!aceitos) return 'termosRecusados';

    // Posição e token novo correm junto com a abertura da navegação (economiza segundos na partida).
    const posicao = dep.posicaoAtual().catch(() => null);
    const tokenNovo = posicao.then((a) =>
      a && dep.tokenNaHora ? comLimite(dep.tokenNaHora(a), LIMITE_TOKEN_MS, null) : null,
    );

    const sessao = await dep.controlador.init();
    if (sessao === 'notAuthorized') return 'chaveNaoAutorizada';
    if (sessao === 'termsNotAccepted') return 'termosRecusados';
    if (sessao === 'locationPermissionMissing') return 'semPermissao';
    if (sessao === 'networkError') return 'semRede';
    if (sessao !== 'ok') return 'erro';

    const atual = await posicao;
    if (!atual) return 'semLocalizacao';
    const token = (await tokenNovo) ?? dep.tokenRota ?? null;

    const destino = [{ title: dep.tituloDestino, position: dep.destino(atual) }];
    let seguiuPlanejada = false;
    let rota = 'UNKNOWN';
    if (token) {
      rota = await comLimite(
        dep.controlador
          .setDestinations(destino, { routeTokenOptions: { routeToken: token, travelMode: MODO_CARRO } })
          .catch((e: { code?: string; message?: string }) => e?.code ?? e?.message ?? 'ERRO'),
        LIMITE_ROTA_MS,
        'DEMOROU',
      );
      seguiuPlanejada = rota === 'OK';
      if (!seguiuPlanejada) dep.aoRecusarRota?.(rota);
    }
    if (!seguiuPlanejada) {
      try {
        rota = await dep.controlador.setDestinations(destino, {
          routingOptions: { travelMode: MODO_MOTO, ...(dep.evitar ?? evitarPadrao) },
        });
      } catch (e) {
        // Algumas versões da ponte não aceitam moto: tenta de novo como carro.
        if (!/unsupported travel mode/i.test(String((e as Error)?.message ?? e))) throw e;
        rota = await dep.controlador.setDestinations(destino, {
          routingOptions: { travelMode: MODO_CARRO, ...(dep.evitar ?? evitarPadrao) },
        });
      }
    }
    if (rota === 'LOCATION_DISABLED' || rota === 'LOCATION_UNKNOWN') return 'semLocalizacao';
    if (rota === 'NETWORK_ERROR') return 'semRede';
    if (rota !== 'OK') return 'semRota';

    await dep.controlador.setAudioGuidanceType(dep.voz ?? VOZ_COMPLETA_BLUETOOTH);
    await dep.controlador.startGuidance();
    try {
      dep.controlador.setTurnByTurnLoggingEnabled?.(true);
    } catch {
      // sem a tela do carro o celular guia do mesmo jeito
    }
    return token && !seguiuPlanejada ? 'okRotaRapida' : 'ok';
  } catch {
    return 'erro';
  }
}

/**
 * Troca o destino da navegação em andamento (ex.: posto escolhido no modo pilotando) e volta a guiar.
 * A rota planejada é substituída pela do Google até o novo destino. Devolve false se o Google recusar.
 */
export async function irParaDestino(
  controlador: Pick<ControladorNavegacao, 'setDestinations' | 'startGuidance'>,
  destino: { title: string; position: Coordenada },
  evitar: Evitar = evitarPadrao,
): Promise<boolean> {
  try {
    let rota: string;
    try {
      rota = await controlador.setDestinations([destino], {
        routingOptions: { travelMode: MODO_MOTO, ...evitar },
      });
    } catch (e) {
      if (!/unsupported travel mode/i.test(String((e as Error)?.message ?? e))) throw e;
      rota = await controlador.setDestinations([destino], {
        routingOptions: { travelMode: MODO_CARRO, ...evitar },
      });
    }
    if (rota !== 'OK') return false;
    await controlador.startGuidance();
    return true;
  } catch {
    return false;
  }
}

type PedidoReplanejar = {
  controlador: Pick<ControladorNavegacao, 'setDestinations' | 'startGuidance'>;
  posicaoAtual: () => Promise<Coordenada | null>;
  destino: { title: string; position: Coordenada };
  tipo: TipoEstrada;
  /** Planeja no Valhalla da posição atual até o destino, com o tipo de estrada escolhido. */
  planejar: (atual: Coordenada, tipo: TipoEstrada) => Promise<RotaPlanejada>;
  /** Pede ao Google o token da rota nova. */
  token: (rota: RotaPlanejada, atual: Coordenada) => Promise<string | null>;
};

export type ResultadoReplanejar = { ok: true; rota: RotaPlanejada; token: string } | { ok: false };

/**
 * Replaneja a rota em andamento (ex.: o irmão trocou o tipo de estrada): Valhalla da posição atual até
 * o mesmo destino, token novo e guia reiniciado. Se qualquer passo falhar, a rota antiga continua valendo
 * (o destino só é trocado quando o Google aceita o token novo).
 */
export async function replanejarRota(p: PedidoReplanejar): Promise<ResultadoReplanejar> {
  try {
    const atual = await p.posicaoAtual();
    if (!atual) return { ok: false };
    const rota = await p.planejar(atual, p.tipo);
    const token = await p.token(rota, atual);
    if (!token) return { ok: false };
    const resposta = await p.controlador.setDestinations([p.destino], {
      routeTokenOptions: { routeToken: token, travelMode: MODO_CARRO },
    });
    if (resposta !== 'OK') return { ok: false };
    await p.controlador.startGuidance();
    return { ok: true, rota, token };
  } catch {
    return { ok: false };
  }
}
