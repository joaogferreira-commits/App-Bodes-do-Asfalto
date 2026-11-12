import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { corDoFundo, filtros, tamanhosTexto, type ConteudoStory } from '@/stories/estilos';
import { fontes } from '@/theme';

const fonteDo = {
  classico: fontes.textoSemi,
  forte: fontes.textoForte,
  condensado: fontes.titulo,
  estrada: fontes.tituloSemi,
} as const;

function Video({ uri, tocar }: { uri: string; tocar: boolean }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    if (tocar) p.play();
  });
  return (
    <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
  );
}

/** Desenha o story: mídia + filtro + textos + selos. Usado no editor e no visualizador (iguais). */
export function StoryCena({ c, tocar = true }: { c: ConteudoStory; tocar?: boolean }) {
  const { t } = useTranslation();
  const f = filtros.find((x) => x.id === c.filtro) ?? filtros[0]!;
  return (
    <View style={estilos.cena}>
      {c.tipo === 'video' ? (
        <Video uri={c.uri} tocar={tocar} />
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

      {c.textos.map((tx) => (
        <View
          key={tx.id}
          style={[
            estilos.camada,
            tx.posicao === 'topo'
              ? { top: '12%' }
              : tx.posicao === 'meio'
                ? { top: '42%' }
                : { bottom: '16%' },
          ]}
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
      ))}

      <View style={estilos.selos}>
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
  camada: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
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
});
