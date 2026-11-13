import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, TextInput, View } from 'react-native';

import { useAcessoOpcional } from '@/acesso/acesso';
import { AprovarLojas, AprovarNegocios } from '@/componentes/AprovarClube';
import { AprovarDesafios } from '@/componentes/AprovarDesafios';
import { AprovarSuporte } from '@/componentes/AprovarSuporte';
import { TelaFerramenta } from '@/componentes/TelaFerramenta';
import { decidirPedido, pedidosParaAprovar, type PedidoParaAprovar } from '@/servidor/auth';
import { espaco, fontes, raios, useCores } from '@/theme';
import { Botao, Cartao, Chip, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

/**
 * Fila de pedidos de entrada para diretoria do capítulo, moderadores e admin (a RLS do banco
 * só devolve o que cada um pode decidir). Fotos do colete e da carteirinha por link temporário.
 */
export default function Aprovacoes() {
  const { t } = useTranslation();
  const cores = useCores();
  const [pedidos, setPedidos] = useState<PedidoParaAprovar[] | null>(null);
  const [motivo, setMotivo] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState<string | null>(null);
  const papel = useAcessoOpcional()?.papel;
  const moderacao = papel === 'moderador' || papel === 'admin';
  const [aba, setAba] = useState<'irmaos' | 'desafios' | 'suporte' | 'lojas' | 'negocios'>('irmaos');

  const carregar = useCallback(async () => {
    try {
      setPedidos(await pedidosParaAprovar());
    } catch {
      setPedidos([]);
      avisar(t('aprovacoes.erroCarregar'));
    }
  }, [t]);

  useEffect(() => {
    let vivo = true;
    void pedidosParaAprovar()
      .then((p) => vivo && setPedidos(p))
      .catch(() => vivo && setPedidos([]));
    return () => {
      vivo = false;
    };
  }, []);

  const decidir = async (p: PedidoParaAprovar, aprovar: boolean) => {
    if (!aprovar && !(motivo[p.id] ?? '').trim()) return avisar(t('aprovacoes.motivoFalta'));
    setOcupado(p.id);
    try {
      await decidirPedido(p.id, aprovar, aprovar ? undefined : motivo[p.id]!.trim());
      await carregar();
    } catch {
      avisar(t('aprovacoes.erroDecidir'));
    } finally {
      setOcupado(null);
    }
  };

  return (
    <TelaFerramenta titulo={t('aprovacoes.titulo')} explicacao={t('aprovacoes.explica')}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
        <Chip rotulo={t('aprovacoes.abaIrmaos')} ativo={aba === 'irmaos'} onPress={() => setAba('irmaos')} />
        <Chip
          rotulo={t('aprovacoes.abaDesafios')}
          ativo={aba === 'desafios'}
          onPress={() => setAba('desafios')}
        />
        {moderacao && (
          <Chip rotulo={t('aprovacoes.abaLojas')} ativo={aba === 'lojas'} onPress={() => setAba('lojas')} />
        )}
        {moderacao && (
          <Chip
            rotulo={t('aprovacoes.abaNegocios')}
            ativo={aba === 'negocios'}
            onPress={() => setAba('negocios')}
          />
        )}
        {moderacao && (
          <Chip
            rotulo={t('aprovacoes.abaSuporte')}
            ativo={aba === 'suporte'}
            onPress={() => setAba('suporte')}
          />
        )}
      </View>
      {aba === 'desafios' && <AprovarDesafios />}
      {aba === 'suporte' && moderacao && <AprovarSuporte />}
      {aba === 'lojas' && moderacao && <AprovarLojas />}
      {aba === 'negocios' && moderacao && <AprovarNegocios />}
      {aba === 'irmaos' && pedidos === null && (
        <Texto variante="secundario">{t('aprovacoes.carregando')}</Texto>
      )}
      {aba === 'irmaos' && pedidos?.length === 0 && (
        <Cartao>
          <Texto>{t('aprovacoes.vazio')}</Texto>
        </Cartao>
      )}
      {aba === 'irmaos' &&
        pedidos?.map((p) => (
          <Cartao key={p.id} style={{ gap: espaco.sm }}>
            <Texto variante="destaque">
              {p.nome}
              {p.apelido ? ` “${p.apelido}”` : ''}
            </Texto>
            <Texto variante="secundario">
              {t('aprovacoes.linha', { capitulo: p.capitulo, cidade: p.cidade })}
            </Texto>
            {!!p.indicadoPorNome && <Texto>{t('aprovacoes.indicadoPor', { nome: p.indicadoPorNome })}</Texto>}
            <View style={{ flexDirection: 'row', gap: espaco.xs }}>
              {[p.fotoColete, p.fotoCarteirinha].map((u, i) =>
                u ? (
                  <Image
                    key={i}
                    source={{ uri: u }}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      borderRadius: raios.cartao,
                      backgroundColor: cores.superficie3,
                    }}
                    contentFit="cover"
                    accessibilityLabel={
                      i === 0 ? t('aprovacoes.fotoColete') : t('aprovacoes.fotoCarteirinha')
                    }
                  />
                ) : null,
              )}
            </View>
            <Botao
              titulo={t('aprovacoes.ligar', { telefone: p.telefone })}
              variante="secundario"
              icone="socorro"
              onPress={() => void Linking.openURL(`tel:${p.telefone.replace(/\D/g, '')}`)}
            />
            <TextInput
              value={motivo[p.id] ?? ''}
              onChangeText={(v) => setMotivo((m) => ({ ...m, [p.id]: v.slice(0, 200) }))}
              placeholder={t('aprovacoes.motivo')}
              placeholderTextColor={cores.textoSec}
              accessibilityLabel={t('aprovacoes.motivo')}
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
                  desativado={ocupado === p.id}
                  onPress={() => void decidir(p, true)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Botao
                  titulo={t('aprovacoes.recusar')}
                  variante="contorno"
                  desativado={ocupado === p.id}
                  onPress={() => void decidir(p, false)}
                />
              </View>
            </View>
          </Cartao>
        ))}
    </TelaFerramenta>
  );
}
