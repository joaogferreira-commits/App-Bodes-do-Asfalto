import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { classificadosExemplo, type Classificado } from '@/dados/classificados';
import { apagarClassificado, marcarVendidoServidor, motivoDoErro } from '@/servidor/classificados';
import { recarregarClube, useClassificadosServidor, useClubeNoServidor } from '@/servidor/useClube';
import { avisar } from '@/ui/dialogo';

import { useGuardado } from './guardado';

/**
 * Com o servidor ligado: anúncios reais (vigentes), vendido/excluir no banco. Sem servidor (desenvolvimento e testes):
 * anúncios do irmão no aparelho + os de exemplo. Favoritos ficam sempre no aparelho.
 */
type Valor = {
  todos: Classificado[];
  anunciar: (c: Omit<Classificado, 'id' | 'meu' | 'quando'>) => void;
  marcarVendido: (id: string, vendido: boolean) => void;
  excluir: (id: string) => void;
  servidor: boolean;
  carregando: boolean;
  erro: boolean;
  favoritos: string[];
  alternarFavorito: (id: string) => void;
};

const Contexto = createContext<Valor | null>(null);

export function ProvedorClassificados({ children }: { children: ReactNode }) {
  const [meus, setMeus] = useGuardado<Classificado[]>('classificados', []);
  const [favoritos, setFavoritos] = useGuardado<string[]>('classificadosFavoritos', []);
  const { t } = useTranslation();
  const servidor = useClubeNoServidor();
  const sv = useClassificadosServidor();
  const valor = useMemo<Valor>(
    () => ({
      todos: servidor ? sv.anuncios : [...meus, ...classificadosExemplo],
      anunciar: (c) => setMeus((l) => [{ ...c, id: `meu-${Date.now()}`, meu: true, quando: '' }, ...l]),
      marcarVendido: (id, vendido) => {
        if (!servidor) return setMeus((l) => l.map((x) => (x.id === id ? { ...x, vendido } : x)));
        void marcarVendidoServidor(id, vendido).then(recarregarClube, (e) =>
          avisar(t(motivoDoErro(e) === 'limite' ? 'classificados.limite' : 'classificados.erroAcao')),
        );
      },
      excluir: (id) => {
        if (!servidor) return setMeus((l) => l.filter((x) => x.id !== id));
        void apagarClassificado(id).then(recarregarClube, () => avisar(t('classificados.erroAcao')));
      },
      servidor,
      carregando: sv.carregando,
      erro: sv.erro,
      favoritos,
      alternarFavorito: (id) =>
        setFavoritos((l) => (l.includes(id) ? l.filter((x) => x !== id) : [id, ...l])),
    }),
    [meus, favoritos, setMeus, setFavoritos, servidor, sv.anuncios, sv.carregando, sv.erro, t],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useClassificados(): Valor {
  const v = useContext(Contexto);
  if (!v) throw new Error('useClassificados precisa do ProvedorClassificados');
  return v;
}
