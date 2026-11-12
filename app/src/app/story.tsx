import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StoryCena } from '@/componentes/StoryCena';
import { stories as exemplos } from '@/dados/feed';
import { useMeusPosts } from '@/estado/meusPosts';
import { espaco, fontes } from '@/theme';
import { Botao, BotaoIcone, Texto } from '@/ui';

const DURACAO = 5000;
const DURACAO_VIDEO = 60000;
// Visualizador de foto em tela cheia: fundo preto e texto branco nos dois temas (como qualquer galeria).

/** Ver um story: foto em tela cheia com barra de tempo de 5 s; tocar fecha. Os seus têm "apagar" e "outro". */
export default function Story() {
  const { t } = useTranslation();
  const { de } = useLocalSearchParams<{ de: string }>();
  const { stories, apagarStory } = useMeusPosts();
  const meu = de === 'meu' ? stories[0] : undefined;
  const ex = de !== 'meu' ? exemplos[Number(de)] : undefined;
  const [progresso] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const anim = Animated.timing(progresso, {
      toValue: 1,
      duration: meu?.conteudo?.tipo === 'video' ? DURACAO_VIDEO : DURACAO,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    anim.start(({ finished }) => finished && !meu && router.back());
    return () => anim.stop();
  }, [progresso, meu]);

  const foto = meu ? { uri: meu.foto } : ex?.imagem;
  const nome = meu ? t('perfil.voce') : (ex?.nome ?? '');
  const legenda = meu ? meu.legenda : (ex?.legenda ?? '');
  if (!foto) return null;

  return (
    <View style={estilos.tela}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('comum.fechar')}
        onPress={() => router.back()}
        style={StyleSheet.absoluteFill}
      >
        {meu?.conteudo ? (
          <View style={StyleSheet.absoluteFill} accessible accessibilityLabel={legenda || nome}>
            <StoryCena c={meu.conteudo} />
          </View>
        ) : (
          <Image
            source={foto}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            accessibilityLabel={legenda || nome}
          />
        )}
      </Pressable>
      <SafeAreaView edges={['top']} style={estilos.topo} pointerEvents="box-none">
        <View style={estilos.trilho}>
          <Animated.View
            style={[
              estilos.barra,
              { width: progresso.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
            ]}
          />
        </View>
        <View style={estilos.linha}>
          <Texto style={estilos.nome}>{nome}</Texto>
          <BotaoIcone icone="fechar" rotulo={t('comum.fechar')} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
      <SafeAreaView edges={['bottom']} style={estilos.base} pointerEvents="box-none">
        {!!legenda && !meu?.conteudo && <Texto style={estilos.legenda}>{legenda}</Texto>}
        {meu && (
          <View style={{ flexDirection: 'row', gap: espaco.xs }}>
            <View style={{ flex: 1 }}>
              <Botao titulo={t('story.outro')} icone="mais" onPress={() => router.replace('/story-novo')} />
            </View>
            <View style={{ flex: 1 }}>
              <Botao
                titulo={t('comentarios.apagar')}
                variante="secundario"
                onPress={() => {
                  apagarStory(meu.id);
                  router.back();
                }}
              />
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#000' },
  topo: { position: 'absolute', top: 0, left: 0, right: 0, padding: espaco.md, gap: espaco.sm },
  trilho: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
  barra: { height: 4, backgroundColor: '#FFFFFF' },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nome: { color: '#FFFFFF', fontFamily: fontes.textoForte, fontSize: 17 },
  base: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: espaco.md, gap: espaco.sm },
  legenda: { color: '#FFFFFF', fontFamily: fontes.textoSemi, fontSize: 20, textAlign: 'center' },
});
