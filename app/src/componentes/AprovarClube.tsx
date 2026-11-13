import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';

import { decidirLoja, lojasPendentes, type LojaPendente } from '@/servidor/lojas';
import { decidirNegocio, negociosPendentes, type NegocioPendente } from '@/servidor/negocios';
import { recarregarClube } from '@/servidor/useClube';
import { espaco, fontes, raios, useCores } from '@/theme';
import { Botao, Cartao, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

type Item = { id: string; titulo: string; linhas: string[] };

/** Fila genérica de aprovação (Lojas e negócios): moderador e admin aprovam ou recusam com motivo. */
function Fila<T extends { id: string }>({
  carregar,
  decidir,
  paraItem,
  textoVazio,
}: {
  carregar: () => Promise<T[]>;
  decidir: (id: string, aprovar: boolean, motivo?: string) => Promise<void>;
  paraItem: (x: T) => Item;
  textoVazio: string;
}) {
  const { t } = useTranslation();
  const cores = useCores();
  const [lista, setLista] = useState<T[] | null>(null);
  const [motivo, setMotivo] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState<string | null>(null);

  const buscar = useCallback(async () => {
    try {
      return await carregar();
    } catch {
      avisar(t('aprovacoes.erroCarregarItens'));
      return [] as T[];
    }
  }, [carregar, t]);

  useEffect(() => {
    let vivo = true;
    void buscar().then((l) => vivo && setLista(l));
    return () => {
      vivo = false;
    };
  }, [buscar]);

  const agir = async (x: T, aprovar: boolean) => {
    const m = (motivo[x.id] ?? '').trim();
    if (!aprovar && !m) return avisar(t('aprovacoes.motivoFalta'));
    setOcupado(x.id);
    try {
      await decidir(x.id, aprovar, aprovar ? undefined : m);
      recarregarClube();
      setLista(await buscar());
    } catch {
      avisar(t('aprovacoes.erroDecidir'));
    } finally {
      setOcupado(null);
    }
  };

  return (
    <View style={{ gap: espaco.sm }}>
      {lista === null && <Texto variante="secundario">{t('aprovacoes.carregando')}</Texto>}
      {lista?.length === 0 && (
        <Cartao>
          <Texto>{textoVazio}</Texto>
        </Cartao>
      )}
      {lista?.map((x) => {
        const it = paraItem(x);
        return (
          <Cartao key={x.id} style={{ gap: espaco.sm }}>
            <Texto variante="destaque">{it.titulo}</Texto>
            {it.linhas.map((l, i) => (
              <Texto key={i} variante={i === 0 ? 'secundario' : undefined}>
                {l}
              </Texto>
            ))}
            <TextInput
              value={motivo[x.id] ?? ''}
              onChangeText={(v) => setMotivo((m) => ({ ...m, [x.id]: v.slice(0, 200) }))}
              placeholder={t('aprovacoes.motivoItem')}
              placeholderTextColor={cores.textoSec}
              accessibilityLabel={t('aprovacoes.motivoItem')}
              style={{
                minHeight: 52,
                borderWidth: 1,
                borderColor: cores.linha,
                borderRadius: raios.botao,
                paddingHorizontal: espaco.md,
                color: cores.texto,
                fontFamily: fontes.texto,
                fontSize: 17,
              }}
            />
            <View style={{ flexDirection: 'row', gap: espaco.xs }}>
              <View style={{ flex: 1 }}>
                <Botao
                  titulo={t('aprovacoes.aprovar')}
                  icone="check"
                  desativado={ocupado === x.id}
                  onPress={() => void agir(x, true)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Botao
                  titulo={t('aprovacoes.recusar')}
                  variante="contorno"
                  desativado={ocupado === x.id}
                  onPress={() => void agir(x, false)}
                />
              </View>
            </View>
          </Cartao>
        );
      })}
    </View>
  );
}

/** Lojas esperando decisão (só moderador e admin). Mostra quem cadastrou: o banco só entrega isso à moderação. */
export function AprovarLojas() {
  const { t } = useTranslation();
  return (
    <Fila<LojaPendente>
      carregar={lojasPendentes}
      decidir={decidirLoja}
      textoVazio={t('aprovacoes.lojasVazio')}
      paraItem={(l) => ({
        id: l.id,
        titulo: l.nome,
        linhas: [
          [l.oriente, l.potencia, l.cidade].filter(Boolean).join(' · '),
          ...(l.diasSessao ? [t('lojas.sessao', { dias: l.diasSessao })] : []),
          ...(l.endereco ? [l.endereco] : []),
          t('aprovacoes.lojaPor', { nome: l.autor }),
        ],
      })}
    />
  );
}

/** Negócios esperando decisão (só moderador e admin). */
export function AprovarNegocios() {
  const { t } = useTranslation();
  return (
    <Fila<NegocioPendente>
      carregar={negociosPendentes}
      decidir={decidirNegocio}
      textoVazio={t('aprovacoes.negociosVazio')}
      paraItem={(n) => ({
        id: n.id,
        titulo: n.nome,
        linhas: [
          `${t(`negocios.categorias.${n.categoria}`)} · ${n.cidade}`,
          t('negocios.beneficio') + ': ' + n.beneficio,
          ...(n.descricao ? [n.descricao] : []),
          t('aprovacoes.negocioPor', { nome: n.donoNome }),
        ],
      })}
    />
  );
}
