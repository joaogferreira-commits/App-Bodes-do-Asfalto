import AsyncStorage from '@react-native-async-storage/async-storage';

import type { TipoEstrada } from '@/rotas/tipos';

/** Opções da tela de navegação ("Camadas e opções"), guardadas no aparelho. */
export const CHAVE_OPCOES = 'bodes.opcoesNavegacao';

export const TIPOS_MAPA = ['normal', 'satelite', 'hibrido'] as const;
export type TipoMapa = (typeof TIPOS_MAPA)[number];
export const VISOES = ['frente', 'norte'] as const;
export type Visao = (typeof VISOES)[number];
export const VOZES = ['completa', 'alertas', 'mudo'] as const;
export type Voz = (typeof VOZES)[number];
export const ESTRADAS: TipoEstrada[] = ['asfalto', 'misto', 'terra'];

export type Evitar = { avoidTolls: boolean; avoidHighways: boolean; avoidFerries: boolean };

export type OpcoesNavegacao = {
  transito: boolean;
  mapa: TipoMapa;
  visao: Visao;
  voz: Voz;
  evitarPedagios: boolean;
  evitarRodovias: boolean;
  evitarBalsas: boolean;
  estrada: TipoEstrada;
};

export const opcoesPadrao: OpcoesNavegacao = {
  transito: false,
  mapa: 'normal',
  visao: 'frente',
  voz: 'completa',
  evitarPedagios: false,
  evitarRodovias: false,
  // balsas já eram evitadas antes desta tela existir
  evitarBalsas: true,
  estrada: 'misto',
};

/** Valores dos enums do SDK (MapType e CameraPerspective). Relevo fica de fora: o Android o troca por Normal ao navegar. */
export const MAPA_SDK: Record<TipoMapa, number> = { normal: 1, satelite: 2, hibrido: 4 };
export const PERSPECTIVA_SDK: Record<Visao, number> = { frente: 0, norte: 1 };
/** AudioGuidance do SDK: 4 voz completa, 2 só alertas, 0 mudo; 8 = Bluetooth (intercomunicador). */
export const VOZ_SDK: Record<Voz, number> = { completa: 4 | 8, alertas: 2 | 8, mudo: 0 };

export const evitarDe = (o: OpcoesNavegacao): Evitar => ({
  avoidTolls: o.evitarPedagios,
  avoidHighways: o.evitarRodovias,
  avoidFerries: o.evitarBalsas,
});

const dentro = <T extends string>(lista: readonly T[], v: unknown, padrao: T): T =>
  lista.includes(v as T) ? (v as T) : padrao;
const booleano = (v: unknown, padrao: boolean) => (typeof v === 'boolean' ? v : padrao);

/** Lê as opções guardadas; qualquer valor ausente ou inválido volta ao padrão. */
export async function carregarOpcoes(): Promise<OpcoesNavegacao> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE_OPCOES);
    const o = (bruto ? JSON.parse(bruto) : {}) as Record<string, unknown>;
    return {
      transito: booleano(o.transito, opcoesPadrao.transito),
      mapa: dentro(TIPOS_MAPA, o.mapa, opcoesPadrao.mapa),
      visao: dentro(VISOES, o.visao, opcoesPadrao.visao),
      voz: dentro(VOZES, o.voz, opcoesPadrao.voz),
      evitarPedagios: booleano(o.evitarPedagios, opcoesPadrao.evitarPedagios),
      evitarRodovias: booleano(o.evitarRodovias, opcoesPadrao.evitarRodovias),
      evitarBalsas: booleano(o.evitarBalsas, opcoesPadrao.evitarBalsas),
      estrada: dentro(ESTRADAS, o.estrada, opcoesPadrao.estrada),
    };
  } catch {
    return opcoesPadrao;
  }
}

export async function salvarOpcoes(o: OpcoesNavegacao): Promise<void> {
  await AsyncStorage.setItem(CHAVE_OPCOES, JSON.stringify(o)).catch(() => undefined);
}
