import { createContext, useContext, useMemo, useState } from 'react';

import { destinosDaProva, type Destino } from '@/navegacao/destinos';
import type { RotaPlanejada, TipoEstrada } from '@/rotas/tipos';

/** O que a tela de planejar rota entrega para o modo pilotando. */
type Viagem = {
  destino: Destino;
  tipoEstrada: TipoEstrada;
  rota: RotaPlanejada | null;
  tokenRota: string | null;
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
  const valor = useMemo<Viagem>(
    () => ({
      destino,
      tipoEstrada,
      rota,
      tokenRota,
      definirDestino,
      definirTipoEstrada,
      definirRota: (r, token) => {
        setRota(r);
        setToken(token);
      },
    }),
    [destino, tipoEstrada, rota, tokenRota],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useViagem(): Viagem {
  const v = useContext(Contexto);
  if (!v) throw new Error('useViagem precisa do ProvedorViagem');
  return v;
}
