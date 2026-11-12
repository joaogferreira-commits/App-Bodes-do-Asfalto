import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, ScrollView, Share, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatarPreco } from '@/dados/classificados';
import { useClassificados } from '@/estado/classificados';
import { linkWhatsApp } from '@/ferramentas/calculos';
import { espaco, raios, useCores } from '@/theme';
import { Avatar, Botao, BotaoIcone, Cartao, Chip, Texto } from '@/ui';

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
              icone="salvar"
              corIcone={fav ? cores.ouro : cores.texto}
              rotulo={fav ? t('classificados.desfavoritar') : t('classificados.favoritar')}
              onPress={() => alternarFavorito(c.id)}
            />
          </View>
          {c.fotos.length > 1 && (
            <View
              style={{
                position: 'absolute',
                bottom: espaco.sm,
                alignSelf: 'center',
                flexDirection: 'row',
                gap: 6,
              }}
            >
              {c.fotos.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: i === foto ? cores.acao : cores.superficie,
                  }}
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ padding: espaco.lg, gap: espaco.sm }}>
          <Texto
            variante="numero"
            style={{ fontSize: 40, lineHeight: 44, color: c.vendido ? cores.textoApagado : cores.acao }}
          >
            {formatarPreco(c.preco)}
          </Texto>
          <Texto variante="subtitulo">{c.titulo}</Texto>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
            <Chip rotulo={t(`classificados.estados.${c.estado}`)} onPress={() => undefined} />
            {c.ano && <Chip rotulo={t('classificados.ano', { ano: c.ano })} onPress={() => undefined} />}
            {c.km && <Chip rotulo={t('classificados.kmRodados', { km: c.km })} onPress={() => undefined} />}
            {c.aceitaTroca && <Chip rotulo={t('classificados.aceitaTroca')} onPress={() => undefined} />}
            {c.vendido && <Chip rotulo={t('classificados.vendido')} ativo onPress={() => undefined} />}
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
                  Alert.alert(t('classificados.excluirPergunta'), undefined, [
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
            !c.vendido &&
            c.whatsapp && (
              <Botao
                titulo={t('classificados.chamar')}
                icone="comentario"
                grande
                onPress={() =>
                  void Linking.openURL(
                    linkWhatsApp(t('classificados.mensagem', { titulo: c.titulo }), c.whatsapp),
                  )
                }
              />
            )
          )}
          <View style={{ flexDirection: 'row', gap: espaco.xs }}>
            <View style={{ flex: 1 }}>
              <Botao
                titulo={t('feed.compartilhar')}
                icone="compartilhar"
                variante="secundario"
                onPress={() =>
                  void Share.share({ message: `${c.titulo} — ${formatarPreco(c.preco)} (${c.cidade})` })
                }
              />
            </View>
            {!c.meu && (
              <View style={{ flex: 1 }}>
                <Botao
                  titulo={t('comentarios.denunciar')}
                  variante="contorno"
                  onPress={() => Alert.alert(t('feed.denunciar'), t('feed.denunciaRecebida'))}
                />
              </View>
            )}
          </View>
          <Texto variante="pequeno" style={{ borderRadius: raios.botao }}>
            {t('classificados.seguranca')}
          </Texto>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
