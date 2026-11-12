import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import {
  corDoFundo,
  diasAte,
  filtros,
  tamanhosTexto,
  type CamadaTexto,
  type ConteudoStory,
  type Interativo,
  yDaPosicao,
} from '@/stories/estilos';
import { fontes } from '@/theme';

const fonteDo = {
  classico: fontes.textoSemi,
  forte: fontes.textoForte,
  condensado: fontes.titulo,
  estrada: fontes.tituloSemi,
} as const;

function Video({ uri, tocar, velocidade }: { uri: string; tocar: boolean; velocidade: number }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.playbackRate = velocidade;
    if (tocar) p.play();
  });
  return (
    <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
  );
}

/** Texto do story; no editor dá para arrastar com o dedo (posição guardada de 0 a 1). */
function CamadaDeTexto({
  tx,
  tamanho,
  aoMover,
}: {
  tx: CamadaTexto;
  tamanho: { w: number; h: number };
  aoMover?: (id: string, dx: number, dy: number) => void;
}) {
  const x0 = tx.x ?? 0.5;
  const y0 = tx.y ?? yDaPosicao[tx.posicao];
  const [desloc, setDesloc] = useState<{ dx: number; dy: number } | null>(null);
  // Criado uma vez: no fim do gesto manda só o deslocamento (fração da tela); o editor soma à posição atual.
  const [resp] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => setDesloc({ dx: g.dx, dy: g.dy }),
      onPanResponderRelease: (_, g) => {
        setDesloc(null);
        if (tamanho.w) aoMover?.(tx.id, g.dx / tamanho.w, g.dy / tamanho.h);
      },
      onPanResponderTerminate: () => setDesloc(null),
    }),
  );
  return (
    <View
      {...(aoMover ? resp.panHandlers : {})}
      accessibilityLabel={tx.texto}
      style={{
        position: 'absolute',
        left: x0 * tamanho.w + (desloc?.dx ?? 0),
        top: y0 * tamanho.h + (desloc?.dy ?? 0),
        transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
        maxWidth: tamanho.w * 0.9,
      }}
    >
      <Text
        style={{
          color: tx.cor,
          fontFamily: fonteDo[tx.estilo],
          fontSize: tamanhosTexto[tx.tamanho],
          textAlign: 'center',
          textTransform: tx.estilo === 'estrada' ? 'uppercase' : 'none',
          letterSpacing: tx.estilo === 'estrada' ? 2 : 0,
          backgroundColor: corDoFundo(tx.cor, tx.fundo),
          paddingHorizontal: tx.fundo === 'nenhum' ? 0 : 12,
          paddingVertical: tx.fundo === 'nenhum' ? 0 : 4,
          borderRadius: tx.fundo === 'caixa' ? 10 : 0,
          textShadowColor: tx.fundo === 'nenhum' ? 'rgba(0,0,0,0.7)' : 'transparent',
          textShadowRadius: tx.fundo === 'nenhum' ? 6 : 0,
          overflow: 'hidden',
        }}
      >
        {tx.texto}
      </Text>
    </View>
  );
}

/** Enquete, pergunta e contagem regressiva. Na visualização, a enquete aceita um voto. */
function CartaoInterativo({ it, votavel }: { it: Interativo; votavel: boolean }) {
  const { t } = useTranslation();
  const [voto, setVoto] = useState<number | null>(null);
  if (it.tipo === 'enquete')
    return (
      <View style={estilos.cartao}>
        <Text style={estilos.cartaoTitulo}>{it.pergunta}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {it.opcoes.map((o, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={o}
              disabled={!votavel || voto != null}
              onPress={() => setVoto(i)}
              style={[estilos.opcao, voto === i && { backgroundColor: '#E8692A' }]}
            >
              <Text style={[estilos.opcaoTexto, voto === i && { color: '#FFFFFF' }]}>{o}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  if (it.tipo === 'pergunta')
    return (
      <View style={estilos.cartao}>
        <Text style={estilos.cartaoTitulo}>{it.texto}</Text>
        <Text style={estilos.cartaoSub}>{t('story.interativos.respondaNoChat')}</Text>
      </View>
    );
  return (
    <View style={estilos.cartao}>
      <Text style={estilos.cartaoSub}>{it.titulo}</Text>
      <Text style={[estilos.cartaoTitulo, { fontFamily: fontes.titulo, fontSize: 34 }]}>
        {t('story.interativos.faltamDias', { n: diasAte(it.data) })}
      </Text>
    </View>
  );
}

type Props = {
  c: ConteudoStory;
  tocar?: boolean;
  /** editor: permite arrastar os textos (deslocamento em fração da largura/altura) */
  aoMoverTexto?: (id: string, dx: number, dy: number) => void;
  /** visualizador: permite votar na enquete */
  votavel?: boolean;
};

/** Desenha o story: mídia + filtro + desenho + textos + selos. Usado no editor e no visualizador. */
export function StoryCena({ c, tocar = true, aoMoverTexto, votavel = false }: Props) {
  const { t } = useTranslation();
  const [tamanho, setTamanho] = useState({ w: 0, h: 0 });
  const f = filtros.find((x) => x.id === c.filtro) ?? filtros[0]!;
  return (
    <View
      style={estilos.cena}
      onLayout={(e) => setTamanho({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {c.tipo === 'video' ? (
        <Video uri={c.uri} tocar={tocar} velocidade={c.velocidade ?? 1} />
      ) : (
        <Image
          source={{ uri: c.uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          accessible={false}
        />
      )}
      {f.camadas.map((k, i) => (
        <View key={i} style={[StyleSheet.absoluteFill, { backgroundColor: k.cor, opacity: k.opacidade }]} />
      ))}
      {f.vinheta && <View style={[StyleSheet.absoluteFill, estilos.vinheta]} />}

      {!!c.tracos?.length && (
        <Svg
          style={StyleSheet.absoluteFill}
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          pointerEvents="none"
        >
          {c.tracos.map((tr, i) => (
            <Path
              key={i}
              d={tr.d}
              stroke={tr.cor}
              strokeWidth={tr.espessura}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
        </Svg>
      )}

      {tamanho.w > 0 &&
        c.textos.map((tx) => <CamadaDeTexto key={tx.id} tx={tx} tamanho={tamanho} aoMover={aoMoverTexto} />)}

      {!!c.interativos?.length && (
        <View style={estilos.interativos} pointerEvents="box-none">
          {c.interativos.map((it, i) => (
            <CartaoInterativo key={i} it={it} votavel={votavel} />
          ))}
        </View>
      )}

      <View style={estilos.selos} pointerEvents="none">
        {c.selos.mencao && <Text style={estilos.selo}>@{c.selos.mencao}</Text>}
        {c.selos.local && (
          <Text style={estilos.selo}>{t('story.selos.localValor', { local: c.selos.local })}</Text>
        )}
        {c.selos.km != null && (
          <Text style={estilos.selo}>{t('story.selos.kmValor', { km: c.selos.km })}</Text>
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  cena: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  vinheta: { borderWidth: 60, borderColor: 'rgba(0,0,0,0.35)', borderRadius: 40, margin: -30 },
  selos: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: '5%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selo: {
    color: '#0B0907',
    backgroundColor: '#F3EADB',
    fontFamily: fontes.textoForte,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  interativos: { position: 'absolute', left: 24, right: 24, top: '28%', gap: 12, alignItems: 'center' },
  cartao: {
    backgroundColor: 'rgba(243,234,219,0.95)',
    borderRadius: 18,
    padding: 14,
    gap: 10,
    minWidth: '70%',
    alignItems: 'center',
  },
  cartaoTitulo: { color: '#0B0907', fontFamily: fontes.textoForte, fontSize: 19, textAlign: 'center' },
  cartaoSub: { color: '#5A4A3A', fontFamily: fontes.textoSemi, fontSize: 15, textAlign: 'center' },
  opcao: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8692A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  opcaoTexto: { color: '#0B0907', fontFamily: fontes.textoForte, fontSize: 16 },
});
