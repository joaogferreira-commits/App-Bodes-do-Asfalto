import type { Coordenada } from './destinos';

/** Partes do NavigationController do Google usadas pela prova (facilita os testes). */
export type ControladorNavegacao = {
  showTermsAndConditionsDialog(): Promise<boolean>;
  areTermsAccepted(): Promise<boolean>;
  init(): Promise<string>;
  setDestinations(
    waypoints: { title?: string; position: Coordenada }[],
    options?: {
      routingOptions?: { travelMode?: number; avoidFerries?: boolean };
      routeTokenOptions?: { routeToken: string; travelMode?: number };
    },
  ): Promise<string>;
  setAudioGuidanceType(tipo: number): Promise<void>;
  startGuidance(): Promise<void>;
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
};

/** Tempo máximo esperando o Google aceitar a rota planejada antes de seguir pela rota dele. */
export const LIMITE_ROTA_MS = 12000;

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
      a && dep.tokenNaHora ? comLimite(dep.tokenNaHora(a), LIMITE_ROTA_MS, null) : null,
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
          .setDestinations(destino, { routeTokenOptions: { routeToken: token, travelMode: MODO_MOTO } })
          .catch((e: { code?: string; message?: string }) => e?.code ?? e?.message ?? 'ERRO'),
        LIMITE_ROTA_MS,
        'DEMOROU',
      );
      seguiuPlanejada = rota === 'OK';
      if (!seguiuPlanejada) dep.aoRecusarRota?.(rota);
    }
    if (!seguiuPlanejada) {
      rota = await dep.controlador.setDestinations(destino, {
        routingOptions: { travelMode: MODO_MOTO, avoidFerries: true },
      });
    }
    if (rota === 'LOCATION_DISABLED' || rota === 'LOCATION_UNKNOWN') return 'semLocalizacao';
    if (rota === 'NETWORK_ERROR') return 'semRede';
    if (rota !== 'OK') return 'semRota';

    await dep.controlador.setAudioGuidanceType(VOZ_COMPLETA_BLUETOOTH);
    await dep.controlador.startGuidance();
    return token && !seguiuPlanejada ? 'okRotaRapida' : 'ok';
  } catch {
    return 'erro';
  }
}
