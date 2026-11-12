import { createContext, useContext, useMemo, useState } from 'react';

import { destinosDaProva, type Destino } from '@/navegacao/destinos';
import type { RotaPlanejada, TipoEstrada } from '@/rotas/tipos';
import type { Rumo } from '@/rotas/valhalla';

/** Bate-volta: sair e voltar ao mesmo lugar rodando ~km para o lado escolhido. */
export type OpcoesBateVolta = { km: number; rumo: Rumo; curvas: boolean; variacao: number };
export const bateVoltaPadrao: OpcoesBateVolta = { km: 100, rumo: 'N', curvas: true, variacao: 0 };

/** O que a tela de planejar rota entrega para o modo pilotando. */
type Viagem = {
  destino: Destino;
  tipoEstrada: TipoEstrada;
  rota: RotaPlanejada | null;
  tokenRota: string | null;
  /** null = rota até um destino; preenchido = bate-volta. */
  bateVolta: OpcoesBateVolta | null;
  definirBateVolta: (b: OpcoesBateVolta | null) => void;
  definirDestino: (d: Destino) => void;
  definirTipoEstrada: (t: TipoEstrada) => void;
  definirRota: (r: RotaPlanejada | null, token: string | null) => void;
};

const Contexto = createContext<Viagem | null>(null);

export function ProvedorViagem({ children }: { children: React.ReactNode }) {
  const [destino, definirDestino] = useState<Destino>(destinosDaProva[0]!);
  const [tipoEstrada, definirTipoEstrada] = useState<TipoEstrada>('misto');
  const [rota, setRota] = useState<RotaPlanejada | null>(null);
  const [tokenRota, setToken] = useState<string | null>(null);
  const [bateVolta, definirBateVolta] = useState<OpcoesBateVolta | null>(null);
  const valor = useMemo<Viagem>(
    () => ({
      destino,
      tipoEstrada,
      rota,
      tokenRota,
      bateVolta,
      definirBateVolta,
      definirDestino,
      definirTipoEstrada,
      definirRota: (r, token) => {
        setRota(r);
        setToken(token);
      },
    }),
    [destino, tipoEstrada, rota, tokenRota, bateVolta],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useViagem(): Viagem {
  const v = useContext(Contexto);
  if (!v) throw new Error('useViagem precisa do ProvedorViagem');
  return v;
}
