import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';

import { pedidosAbertos, responderPedido, urlDoPrint, type PedidoSuporte } from '@/servidor/suporte';
import { espaco, fontes, raios, useCores } from '@/theme';
import { Botao, Cartao, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

/** Fila de suporte para moderador e admin: pedidos abertos, com print por link temporário, e resposta. */
export function AprovarSuporte() {
  const { t } = useTranslation();
  const cores = useCores();
  const [lista, setLista] = useState<PedidoSuporte[] | null>(null);
  const [resposta, setResposta] = useState<Record<string, string>>({});
  const [prints, setPrints] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState<string | null>(null);

  const buscar = useCallback(async () => {
    try {
      const l = await pedidosAbertos();
      const pares = await Promise.all(
        l
          .filter((p) => p.printPath)
          .map(async (p) => [p.id, await urlDoPrint(p.printPath!).catch(() => null)] as const),
      );
      return { l, prints: Object.fromEntries(pares.filter(([, u]) => !!u)) as Record<string, string> };
    } catch {
      avisar(t('suporteAdmin.erroCarregar'));
      return { l: [] as PedidoSuporte[], prints: {} as Record<string, string> };
    }
  }, [t]);

  const aplicar = (r: { l: PedidoSuporte[]; prints: Record<string, string> }) => {
    setLista(r.l);
    setPrints(r.prints);
  };

  useEffect(() => {
    let vivo = true;
    void buscar().then((r) => vivo && aplicar(r));
    return () => {
      vivo = false;
    };
  }, [buscar]);

  const responder = async (p: PedidoSuporte, fechar: boolean) => {
    const r = (resposta[p.id] ?? '').trim();
    if (!fechar && !r) return avisar(t('suporteAdmin.respostaFalta'));
    setOcupado(p.id);
    try {
      await responderPedido(p.id, r, fechar ? 'fechado' : 'respondido');
      aplicar(await buscar());
    } catch {
      avisar(t('suporteAdmin.erroResponder'));
    } finally {
      setOcupado(null);
    }
  };

  return (
    <View style={{ gap: espaco.sm }}>
      {lista === null && <Texto variante="secundario">{t('aprovacoes.carregando')}</Texto>}
      {lista?.length === 0 && (
        <Cartao>
          <Texto>{t('suporteAdmin.vazio')}</Texto>
        </Cartao>
      )}
      {lista?.map((p) => (
        <Cartao key={p.id} style={{ gap: espaco.sm }}>
          <Texto variante="destaque">{p.autor ?? '-'}</Texto>
          <Texto variante="secundario">{t(`ajuda.categorias.${p.categoria}`)}</Texto>
          <Texto>{p.texto}</Texto>
          {!!prints[p.id] && (
            <Image
              source={{ uri: prints[p.id] }}
              style={{ width: '100%', height: 180, borderRadius: raios.cartao }}
              contentFit="contain"
              accessibilityLabel={t('suporteAdmin.print')}
            />
          )}
          <TextInput
            value={resposta[p.id] ?? ''}
            onChangeText={(v) => setResposta((m) => ({ ...m, [p.id]: v.slice(0, 2000) }))}
            placeholder={t('suporteAdmin.resposta')}
            placeholderTextColor={cores.textoSec}
            accessibilityLabel={t('suporteAdmin.resposta')}
            multiline
            style={{
              minHeight: 96,
              borderWidth: 1,
              borderColor: cores.linha,
              borderRadius: raios.botao,
              padding: espaco.md,
              color: cores.texto,
              fontFamily: fontes.texto,
              fontSize: 17,
              textAlignVertical: 'top',
            }}
          />
          <View style={{ flexDirection: 'row', gap: espaco.xs }}>
            <View style={{ flex: 1 }}>
              <Botao
                titulo={t('suporteAdmin.responder')}
                icone="check"
                desativado={ocupado === p.id}
                onPress={() => void responder(p, false)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Botao
                titulo={t('suporteAdmin.fechar')}
                variante="contorno"
                desativado={ocupado === p.id}
                onPress={() => void responder(p, true)}
              />
            </View>
          </View>
        </Cartao>
      ))}
    </View>
  );
}
