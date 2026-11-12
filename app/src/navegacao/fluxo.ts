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
};

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

    const sessao = await dep.controlador.init();
    if (sessao === 'notAuthorized') return 'chaveNaoAutorizada';
    if (sessao === 'termsNotAccepted') return 'termosRecusados';
    if (sessao === 'locationPermissionMissing') return 'semPermissao';
    if (sessao === 'networkError') return 'semRede';
    if (sessao !== 'ok') return 'erro';

    const atual = await dep.posicaoAtual();
    if (!atual) return 'semLocalizacao';

    const destino = [{ title: dep.tituloDestino, position: dep.destino(atual) }];
    let seguiuPlanejada = false;
    let rota = 'UNKNOWN';
    if (dep.tokenRota) {
      rota = await dep.controlador
        .setDestinations(destino, { routeTokenOptions: { routeToken: dep.tokenRota, travelMode: MODO_MOTO } })
        .catch(() => 'UNKNOWN');
      seguiuPlanejada = rota === 'OK';
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
    return dep.tokenRota && !seguiuPlanejada ? 'okRotaRapida' : 'ok';
  } catch {
    return 'erro';
  }
}
