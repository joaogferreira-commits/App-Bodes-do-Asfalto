import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StoryCena } from '@/componentes/StoryCena';
import { stories as exemplos } from '@/dados/feed';
import { useMeusPosts } from '@/estado/meusPosts';
import type { ConteudoStory } from '@/stories/estilos';
import { foiVisto, gestoDoArrasto, marcarVisto } from '@/stories/vistos';
import { espaco, fontes } from '@/theme';
import { Botao, BotaoIcone, Texto } from '@/ui';

const DURACAO = 5000;
const DURACAO_VIDEO = 60000;
// Visualizador em tela cheia: fundo preto e texto branco nos dois temas (como qualquer galeria).

type Item = {
  id: string;
  foto: ImageSourcePropType;
  conteudo?: ConteudoStory;
  legenda: string;
  /** já conta como visto antes de abrir (os meus e os de exemplo sem novidade) */
  base: boolean;
};
type Grupo = { chave: string; nome: string; meu: boolean; itens: Item[] };

const primeiroNaoVisto = (g: Grupo) => {
  const i = g.itens.findIndex((x) => !x.base && !foiVisto(x.id));
  return i < 0 ? 0 : i;
};
const temNovo = (g: Grupo) => g.itens.some((x) => !x.base && !foiVisto(x.id));

/**
 * Visualizador de stories (como o Instagram): toca todos os stories do irmão, em ordem, e segue sozinho
 * para o próximo irmão com story novo (na ordem da fileira do feed), até acabar; aí fecha.
 * Toque à direita avança, à esquerda volta; arrastar de lado troca de irmão; segurar pausa; arrastar para baixo fecha.
 */
export default function Story() {
  const { t } = useTranslation();
  const { de } = useLocalSearchParams<{ de: string }>();
  const { stories, apagarStory, storiesDeOutros, servidor } = useMeusPosts();
  const { width } = useWindowDimensions();

  const grupos = useMemo<Grupo[]>(() => {
    const lista: Grupo[] = [];
    if (stories.length)
      lista.push({
        chave: 'meu',
        nome: t('perfil.voce'),
        meu: true,
        itens: stories.map((m) => ({
          id: m.id,
          foto: { uri: m.foto },
          conteudo: m.conteudo,
          legenda: m.legenda,
          base: true,
        })),
      });
    // outros irmãos no servidor, na ordem em que aparecem na fileira do feed
    const porAutor = new Map<string, Grupo>();
    for (const s of [...storiesDeOutros].sort((a, b) => Date.parse(a.criadoEm) - Date.parse(b.criadoEm))) {
      let g = porAutor.get(s.autorId);
      if (!g) {
        g = { chave: `srv:${s.autorId}`, nome: s.autor, meu: false, itens: [] };
        porAutor.set(s.autorId, g);
      }
      g.itens.push({
        id: s.id,
        foto: { uri: s.conteudo.uri },
        conteudo: s.conteudo,
        legenda: s.conteudo.textos[0]?.texto ?? '',
        base: false,
      });
    }
    // a fileira mostra cada irmão na posição do seu primeiro story da lista original
    const ordem = [...new Set(storiesDeOutros.map((s) => s.autorId))];
    for (const a of ordem) lista.push(porAutor.get(a)!);
    if (!servidor)
      for (const e of exemplos)
        lista.push({
          chave: `ex:${e.nome}`,
          nome: e.nome,
          meu: false,
          itens: [{ id: `ex:${e.nome}`, foto: e.imagem, legenda: e.legenda, base: !e.novo }],
        });
    return lista;
  }, [stories, storiesDeOutros, servidor, t]);

  const inicial = useMemo(() => {
    let g = -1;
    if (de === 'meu') g = grupos.findIndex((x) => x.meu);
    else if (de?.startsWith('srv:')) {
      const id = de.slice(4);
      g = grupos.findIndex((x) => x.itens.some((y) => y.id === id));
    } else if (de != null) {
      const nome = exemplos[Number(de)]?.nome;
      g = grupos.findIndex((x) => x.chave === `ex:${nome}`);
    }
    if (g < 0) g = 0;
    const grupo = grupos[g];
    // abrindo pelo anel de um irmão do servidor, começa no story tocado se ele for o primeiro novo
    return { g, i: grupo ? primeiroNaoVisto(grupo) : 0 };
  }, [grupos, de]);

  const [pos, setPos] = useState(inicial);
  const [pausado, setPausado] = useState(false);
  const [reinicio, setReinicio] = useState(0);
  const [progresso] = useState(() => new Animated.Value(0));
  const [duracaoVideo, setDuracaoVideo] = useState<{ chave: string; ms: number } | null>(null);

  const grupo = grupos[pos.g];
  const item = grupo?.itens[pos.i];
  const chave = `${pos.g}:${pos.i}:${reinicio}`;
  const chaveRef = useRef(chave);
  const ultimaChave = useRef('');
  const valorRef = useRef(0);

  const fechar = useCallback(() => router.back(), []);

  const proximoIrmao = useCallback(() => {
    const prox = grupos.findIndex((x, k) => k > pos.g && temNovo(x));
    if (prox < 0) return fechar();
    setPos({ g: prox, i: primeiroNaoVisto(grupos[prox]!) });
  }, [grupos, pos.g, fechar]);

  const irmaoAnterior = useCallback(() => {
    if (pos.g === 0) return setReinicio((r) => r + 1);
    setPos({ g: pos.g - 1, i: 0 });
  }, [pos.g]);

  const proximoItem = useCallback(() => {
    if (grupo && pos.i < grupo.itens.length - 1) setPos({ g: pos.g, i: pos.i + 1 });
    else proximoIrmao();
  }, [grupo, pos, proximoIrmao]);

  const itemAnterior = useCallback(() => {
    if (pos.i > 0) setPos({ g: pos.g, i: pos.i - 1 });
    else irmaoAnterior();
  }, [pos, irmaoAnterior]);

  // marca como visto ao tocar
  useEffect(() => {
    if (item) marcarVisto(item.id);
  }, [item]);

  useEffect(() => {
    chaveRef.current = chave;
  }, [chave]);

  const ehVideo = item?.conteudo?.tipo === 'video';
  const aoTerminar = useCallback(() => {
    if (chaveRef.current === chave) proximoItem();
  }, [chave, proximoItem]);
  const aoDuracaoVideo = useCallback((ms: number) => setDuracaoVideo({ chave, ms }), [chave]);
  const duracao = !ehVideo
    ? DURACAO
    : Math.min(duracaoVideo?.chave === chave ? duracaoVideo.ms : DURACAO_VIDEO, DURACAO_VIDEO);

  useEffect(() => {
    const id = progresso.addListener(({ value }) => {
      valorRef.current = value;
    });
    return () => progresso.removeListener(id);
  }, [progresso]);

  // barra de tempo: foto 5 s; vídeo até o fim (máx. 60 s); segurar pausa e retoma de onde parou
  useEffect(() => {
    if (!item) return;
    if (ultimaChave.current !== chave) {
      ultimaChave.current = chave;
      progresso.setValue(0);
      valorRef.current = 0;
    }
    if (pausado) return;
    const anim = Animated.timing(progresso, {
      toValue: 1,
      duration: Math.max(1, duracao * (1 - valorRef.current)),
      easing: Easing.linear,
      useNativeDriver: false,
    });
    anim.start(({ finished }) => finished && aoTerminar());
    return () => anim.stop();
  }, [progresso, item, chave, duracao, pausado, aoTerminar]);

  // gestos de arrastar (lado = troca de irmão, baixo = fecha); toques ficam com o Pressable
  const arrasto = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 15 || g.dy > 15,
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_, g) => {
          const gesto = gestoDoArrasto(g.dx, g.dy);
          if (gesto === 'proximo-irmao') proximoIrmao();
          else if (gesto === 'irmao-anterior') irmaoAnterior();
          else if (gesto === 'fechar') fechar();
        },
      }),
    [proximoIrmao, irmaoAnterior, fechar],
  );

  if (!grupo || !item) return null;
  const meu = grupo.meu ? stories.find((x) => x.id === item.id) : undefined;

  return (
    <View style={estilos.tela} {...arrasto.panHandlers}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('story.passar')}
        onPress={(e) => (e.nativeEvent.pageX < width / 3 ? itemAnterior() : proximoItem())}
        onLongPress={() => setPausado(true)}
        onPressOut={() => setPausado(false)}
        delayLongPress={250}
        style={StyleSheet.absoluteFill}
      >
        {item.conteudo ? (
          <View style={StyleSheet.absoluteFill} accessible accessibilityLabel={item.legenda || grupo.nome}>
            <StoryCena
              key={item.id}
              c={item.conteudo}
              votavel
              tocar={!pausado}
              aoTerminarVideo={aoTerminar}
              aoDuracaoVideo={aoDuracaoVideo}
            />
          </View>
        ) : (
          <Image
            source={item.foto as never}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            accessibilityLabel={item.legenda || grupo.nome}
          />
        )}
      </Pressable>
      <SafeAreaView edges={['top']} style={estilos.topo} pointerEvents="box-none">
        <View style={estilos.trilhos}>
          {grupo.itens.map((x, k) => (
            <View key={x.id} style={estilos.trilho}>
              <Animated.View
                style={[
                  estilos.barra,
                  {
                    width:
                      k < pos.i
                        ? '100%'
                        : k > pos.i
                          ? '0%'
                          : progresso.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  },
                ]}
              />
            </View>
          ))}
        </View>
        <View style={estilos.linha}>
          <Texto style={estilos.nome}>{grupo.nome}</Texto>
          <BotaoIcone icone="fechar" rotulo={t('comum.fechar')} onPress={fechar} />
        </View>
      </SafeAreaView>
      <SafeAreaView edges={['bottom']} style={estilos.base} pointerEvents="box-none">
        {!!item.legenda && !item.conteudo && <Texto style={estilos.legenda}>{item.legenda}</Texto>}
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
  trilhos: { flexDirection: 'row', gap: 4 },
  trilho: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  barra: { height: 4, backgroundColor: '#FFFFFF' },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nome: { color: '#FFFFFF', fontFamily: fontes.textoForte, fontSize: 17 },
  base: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: espaco.md, gap: espaco.sm },
  legenda: { color: '#FFFFFF', fontFamily: fontes.textoSemi, fontSize: 20, textAlign: 'center' },
});
