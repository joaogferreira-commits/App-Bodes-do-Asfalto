import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, Share, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatarPreco } from '@/dados/classificados';
import { enviarAceno, avisarResultadoAceno } from '@/estado/avisoAceno';
import { useClassificados } from '@/estado/classificados';
import { denunciar } from '@/servidor/feed';
import { linkWhatsApp } from '@/ferramentas/calculos';
import { espaco, raios, useCores } from '@/theme';
import { Avatar, Botao, BotaoIcone, Cartao, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

/** Detalhe do anúncio: fotos deslizáveis, preço, ficha, vendedor e contato pelo WhatsApp. */
export default function Anuncio() {
  const { t } = useTranslation();
  const cores = useCores();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { todos, favoritos, alternarFavorito, marcarVendido, excluir } = useClassificados();
  const c = todos.find((x) => x.id === id);
  const [foto, setFoto] = useState(0);
  if (!c) return null;
  const fav = favoritos.includes(c.id);
  const preco = c.preco > 0 ? formatarPreco(c.preco) : t('classificados.aCombinar');
  const denunciarAnuncio = () =>
    avisar(t('feed.denunciarPergunta'), t('classificados.denunciarExplica'), [
      { text: t('comum.cancelar'), style: 'cancel' },
      {
        text: t('feed.denunciarConfirmar'),
        style: 'destructive',
        onPress: () =>
          void denunciar('classificado', c.id, t('feed.motivoPadrao')).then(
            () => avisar(t('feed.denunciar'), t('feed.denunciaRecebida')),
            () => avisar(t('feed.erroAcao')),
          ),
      },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <ScrollView contentContainerStyle={{ paddingBottom: espaco.xxxl }}>
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setFoto(Math.round(e.nativeEvent.contentOffset.x / width))}
          >
            {c.fotos.map((f, i) => (
              <Image
                key={i}
                source={f}
                style={{ width, aspectRatio: 1 }}
                contentFit="cover"
                accessibilityLabel={t('classificados.foto', { n: i + 1, total: c.fotos.length })}
              />
            ))}
          </ScrollView>
          <View
            style={{
              position: 'absolute',
              top: espaco.sm,
              left: espaco.sm,
              right: espaco.sm,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <BotaoIcone icone="voltar" rotulo={t('comum.voltar')} onPress={() => router.back()} />
            <BotaoIcone
              icone={fav ? 'check' : 'salvar'}
              corIcone={fav ? cores.ouro : cores.texto}
              legenda={fav ? t('classificados.guardado') : t('classificados.guardar')}
              rotulo={fav ? t('classificados.desfavoritar') : t('classificados.favoritar')}
              onPress={() => alternarFavorito(c.id)}
            />
          </View>
          {c.fotos.length > 1 && (
            <View
              style={{
                position: 'absolute',
                bottom: espaco.sm,
                right: espaco.sm,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: raios.pilula,
                backgroundColor: cores.sobreMapa,
              }}
            >
              <Texto style={{ fontSize: 15 }}>
                {t('classificados.contadorFotos', { n: foto + 1, total: c.fotos.length })}
              </Texto>
            </View>
          )}
          {c.vendido && (
            <View
              style={{
                position: 'absolute',
                top: 72,
                left: 0,
                right: 0,
                paddingVertical: 6,
                backgroundColor: cores.textoApagado,
              }}
            >
              <Texto style={{ textAlign: 'center', color: cores.fundo, fontSize: 17 }}>
                {t('classificados.vendido')}
              </Texto>
            </View>
          )}
        </View>

        <View style={{ padding: espaco.lg, gap: espaco.sm }}>
          <Texto
            variante="numero"
            style={{ fontSize: 40, lineHeight: 44, color: c.vendido ? cores.textoApagado : cores.texto }}
          >
            {preco}
          </Texto>
          <Texto variante="subtitulo">{c.titulo}</Texto>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: espaco.sm }}>
            {(c.semFicha
              ? []
              : [
                  [t('classificados.form.estado'), t(`classificados.estados.${c.estado}`)],
                  c.ano ? [t('garagem.ano'), c.ano] : null,
                  c.km ? [t('garagem.km'), `${c.km} km`] : null,
                  [
                    t('classificados.aceitaTroca'),
                    c.aceitaTroca ? t('classificados.sim') : t('classificados.nao'),
                  ],
                ]
            )
              .filter((x): x is string[] => !!x)
              .map(([rotulo, valor]) => (
                <View key={rotulo} style={{ width: '50%', gap: 2 }}>
                  <Texto variante="rotulo">{rotulo}</Texto>
                  <Texto variante="destaque">{valor}</Texto>
                </View>
              ))}
          </View>
          <Texto>{c.descricao}</Texto>
          <Texto variante="secundario">{[c.cidade, c.quando].filter(Boolean).join(' · ')}</Texto>

          <Cartao style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}>
            <Avatar nome={c.vendedor} tamanho={52} />
            <View style={{ flex: 1 }}>
              <Texto variante="corpoForte">{c.meu ? t('perfil.voce') : c.vendedor}</Texto>
              <Texto variante="secundario">{t('classificados.irmaoDe', { capitulo: c.capitulo })}</Texto>
            </View>
          </Cartao>

          {c.meu ? (
            <>
              <Botao
                titulo={c.vendido ? t('classificados.reativar') : t('classificados.marcarVendido')}
                icone="check"
                grande
                onPress={() => marcarVendido(c.id, !c.vendido)}
              />
              <Botao
                titulo={t('publicar.excluir')}
                variante="contorno"
                onPress={() =>
                  avisar(t('classificados.excluirPergunta'), undefined, [
                    { text: t('comum.cancelar'), style: 'cancel' },
                    {
                      text: t('publicar.excluir'),
                      style: 'destructive',
                      onPress: () => (excluir(c.id), router.back()),
                    },
                  ])
                }
              />
            </>
          ) : (
            !c.vendido && (
              <>
                {!!c.autorId && (
                  <Botao
                    titulo={t('classificados.acenar')}
                    icone="aceno"
                    grande
                    onPress={() =>
                      void enviarAceno(c.autorId!).then((r) => avisarResultadoAceno(r, c.vendedor, t))
                    }
                  />
                )}
                {c.whatsapp ? (
                  <Botao
                    titulo={t('classificados.chamar')}
                    icone="comentario"
                    grande={!c.autorId}
                    variante={c.autorId ? 'secundario' : 'principal'}
                    onPress={() =>
                      void Linking.openURL(
                        linkWhatsApp(t('classificados.mensagem', { titulo: c.titulo }), c.whatsapp!),
                      )
                    }
                  />
                ) : (
                  !c.autorId && <Texto variante="secundario">{t('classificados.semContato')}</Texto>
                )}
              </>
            )
          )}
          <View style={{ flexDirection: 'row', gap: espaco.xs }}>
            <View style={{ flex: 1 }}>
              <Botao
                titulo={t('feed.compartilhar')}
                icone="compartilhar"
                variante="secundario"
                onPress={() => void Share.share({ message: `${c.titulo} — ${preco} (${c.cidade})` })}
              />
            </View>
            {!c.meu && (
              <View style={{ flex: 1 }}>
                <Botao
                  titulo={t('comentarios.denunciar')}
                  variante="contorno"
                  onPress={() =>
                    c.servidor ? denunciarAnuncio() : avisar(t('feed.denunciar'), t('feed.denunciaRecebida'))
                  }
                />
              </View>
            )}
          </View>
          <Texto variante="secundario">{t('classificados.seguranca')}</Texto>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
