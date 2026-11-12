import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { selos } from '@/dados/conquistas';
import { postsExemplo, stories, type Post } from '@/dados/feed';
import { espaco, fontes, raios, useCores, useEstilos, type Paleta } from '@/theme';
import { Avatar, Botao, Cartao, Icone, Texto, type NomeIcone } from '@/ui';

const ferramentas: { chave: string; icone: NomeIcone }[] = [
  { chave: 'foto', icone: 'camera' },
  { chave: 'video', icone: 'video' },
  { chave: 'rota', icone: 'rota' },
  { chave: 'enquete', icone: 'enquete' },
  { chave: 'evento', icone: 'calendario' },
];

/** Feed do clube (Interface): stories, compositor e cartões de viagem, passeio, foto, enquete e aviso. */
export default function Feed() {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const emBreve = () => Alert.alert(t('comum.emBreve'), t('feed.emBreve'));

  const cabecalho = (
    <View style={{ gap: espaco.md }}>
      <View style={estilos.topo}>
        <Texto variante="titulo">{t('abas.feed')}</Texto>
        <Texto variante="pequeno">{t('feed.exemplo')}</Texto>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.stories}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('feed.seuStory')}
          onPress={emBreve}
          style={estilos.story}
        >
          <View style={[estilos.anelStory, { borderColor: cores.linhaForte, borderStyle: 'dashed' }]}>
            <Icone nome="mais" tamanho={28} cor={cores.acao} espessura={2.4} />
          </View>
          <Texto variante="pequeno" numberOfLines={1}>
            {t('feed.seuStory')}
          </Texto>
        </Pressable>
        {stories.map((s) => (
          <Pressable
            key={s.nome}
            accessibilityRole="button"
            accessibilityLabel={t('feed.storyDe', { nome: s.nome })}
            onPress={emBreve}
            style={estilos.story}
          >
            <View style={[estilos.anelStory, { borderColor: s.novo ? cores.acao : cores.linha }]}>
              <Avatar nome={s.nome} status="nenhum" tamanho={58} />
            </View>
            <Texto
              variante="pequeno"
              numberOfLines={1}
              style={{ color: s.novo ? cores.texto : cores.textoSec }}
            >
              {s.nome.split(' ')[0]}
            </Texto>
          </Pressable>
        ))}
      </ScrollView>

      <Cartao style={{ gap: espaco.sm, marginHorizontal: espaco.md }}>
        <Pressable accessibilityRole="button" onPress={emBreve} style={estilos.linha}>
          <Avatar nome="Irmão Teste" status="aberto" tamanho={44} />
          <View style={[estilos.campoPost, { borderColor: cores.linha }]}>
            <Texto variante="secundario">{t('feed.compor')}</Texto>
          </View>
        </Pressable>
        <View style={estilos.ferramentas}>
          {ferramentas.map((f) => (
            <Pressable
              key={f.chave}
              accessibilityRole="button"
              accessibilityLabel={t(`feed.ferramentas.${f.chave}`)}
              onPress={emBreve}
              style={estilos.ferramenta}
            >
              <Icone nome={f.icone} tamanho={24} cor={cores.acao} />
              <Texto variante="pequeno" style={{ color: cores.texto }}>
                {t(`feed.ferramentas.${f.chave}`)}
              </Texto>
            </Pressable>
          ))}
        </View>
      </Cartao>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={[estilos.tela, { backgroundColor: cores.fundo }]}>
      <FlatList
        data={postsExemplo}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={cabecalho}
        contentContainerStyle={{ gap: espaco.md, paddingBottom: espaco.xxxl }}
        renderItem={({ item }) => <CartaoPost post={item} />}
      />
    </SafeAreaView>
  );
}

function CabecalhoPost({ post }: { post: Post }) {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const opcoes = () =>
    Alert.alert(t('feed.opcoes'), undefined, [
      {
        text: t('feed.denunciar'),
        onPress: () => Alert.alert(t('feed.denunciar'), t('feed.denunciaRecebida')),
      },
      { text: t('feed.bloquear', { nome: post.autor.nome }), style: 'destructive' },
      { text: t('comum.cancelar'), style: 'cancel' },
    ]);
  return (
    <View style={[estilos.linha, { paddingHorizontal: espaco.md }]}>
      <Avatar nome={post.autor.nome} status={post.autor.status ?? 'nenhum'} tamanho={44} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Texto variante="corpoForte" numberOfLines={1}>
          {post.autor.nome}
        </Texto>
        <Texto variante="pequeno" numberOfLines={1}>
          {t('feed.capituloQuando', { capitulo: post.autor.capitulo, quando: post.quando })}
        </Texto>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('feed.opcoes')}
        onPress={opcoes}
        hitSlop={8}
        style={estilos.botaoMais}
      >
        <Icone nome="opcoes" tamanho={26} cor={cores.textoSec} espessura={3} />
      </Pressable>
    </View>
  );
}

function Acoes({ tfa, comentarios, usarRota }: { tfa: number; comentarios: number; usarRota?: boolean }) {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const [dei, setDei] = useState(false);
  const emBreve = () => Alert.alert(t('comum.emBreve'), t('feed.emBreve'));
  return (
    <View style={estilos.acoes}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: dei }}
        accessibilityLabel={t('feed.tfaRotulo', { n: tfa + (dei ? 1 : 0) })}
        onPress={() => setDei((v) => !v)}
        style={[estilos.acao, dei && { backgroundColor: cores.superficie3, borderColor: cores.acao }]}
      >
        <Icone nome="aceno" tamanho={22} cor={dei ? cores.acao : cores.texto} />
        <Texto style={[estilos.textoAcao, dei && { color: cores.acao }]}>
          {t('feed.tfa', { n: tfa + (dei ? 1 : 0) })}
        </Texto>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('feed.comentarios', { n: comentarios })}
        onPress={emBreve}
        style={estilos.acao}
      >
        <Icone nome="comentario" tamanho={22} />
        <Texto style={estilos.textoAcao}>{comentarios}</Texto>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('feed.compartilhar')}
        onPress={emBreve}
        style={estilos.acao}
      >
        <Icone nome="compartilhar" tamanho={22} />
      </Pressable>
      {usarRota && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('feed.usarRota')}
          onPress={() => router.push('/rota')}
          style={[estilos.acao, { marginLeft: 'auto', borderColor: cores.acao }]}
        >
          <Icone nome="rota" tamanho={22} cor={cores.acao} />
          <Texto style={[estilos.textoAcao, { color: cores.acao }]}>{t('feed.usarRota')}</Texto>
        </Pressable>
      )}
    </View>
  );
}

function CartaoPost({ post }: { post: Post }) {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const [presenca, setPresenca] = useState<'vou' | 'talvez' | null>(null);
  const [voto, setVoto] = useState<number | null>(null);

  if (post.tipo === 'viagem') {
    const selo = selos.find((s) => s.chave === post.selo);
    return (
      <View style={estilos.post}>
        <CabecalhoPost post={post} />
        <Texto style={estilos.textoPost}>{post.texto}</Texto>
        <View>
          <Image
            source={post.imagem}
            style={estilos.imagem}
            contentFit="cover"
            accessibilityLabel={t('feed.fotoViagem')}
          />
          <View style={[estilos.faixaRota, { backgroundColor: cores.superficie }]}>
            <Icone nome="rota" tamanho={18} cor={cores.acao} />
            <Texto variante="pequeno" style={{ color: cores.texto }}>
              {t('feed.terraPct', { pct: post.terraPct })}
            </Texto>
          </View>
        </View>
        <View style={estilos.numeros}>
          {[
            [t('rota.km', { km: post.km }), t('feed.distancia')],
            [post.horas, t('feed.tempo')],
            [String(post.irmaos), t('feed.irmaos')],
            [`+${post.xp}`, t('feed.xp')],
          ].map(([valor, rotulo]) => (
            <View key={rotulo} style={estilos.numero}>
              <Texto variante="subtitulo" style={{ fontVariant: ['tabular-nums'] }}>
                {valor}
              </Texto>
              <Texto variante="pequeno">{rotulo}</Texto>
            </View>
          ))}
        </View>
        {selo && (
          <View style={[estilos.seloLinha, { borderColor: cores.ouro }]}>
            <Image
              source={selo.imagem}
              style={{ width: 40, height: 42 }}
              contentFit="contain"
              accessible={false}
            />
            <Texto variante="corpoForte" style={{ flex: 1 }}>
              {t('feed.ganhouSelo', { selo: t(`conquistas.selos.${selo.chave}.nome`) })}
            </Texto>
          </View>
        )}
        <Texto variante="secundario" style={{ paddingHorizontal: espaco.md }}>
          {t('feed.com', { nomes: post.marcados.join(', ') })}
        </Texto>
        <Acoes tfa={post.tfa} comentarios={post.comentarios} usarRota />
      </View>
    );
  }

  if (post.tipo === 'passeio') {
    return (
      <View style={estilos.post}>
        <CabecalhoPost post={post} />
        <Cartao destaque semPadding style={{ marginHorizontal: espaco.md, overflow: 'hidden' }}>
          <Image
            source={post.imagem}
            style={{ width: '100%', aspectRatio: 2.2 }}
            contentFit="cover"
            accessible={false}
          />
          <View style={{ padding: espaco.md, gap: espaco.xs }}>
            <Texto variante="rotulo" style={{ color: cores.acao }}>
              {t('feed.passeio')}
            </Texto>
            <Texto variante="subtitulo">{post.titulo}</Texto>
            <View style={estilos.linha}>
              <Icone nome="calendario" tamanho={20} cor={cores.textoSec} />
              <Texto variante="secundario">{post.data}</Texto>
            </View>
            <View style={estilos.linha}>
              <Icone nome="sede" tamanho={20} cor={cores.textoSec} />
              <Texto variante="secundario">{t('feed.saida', { lugar: post.saida, km: post.km })}</Texto>
            </View>
            <Texto variante="secundario">
              {t('feed.confirmados', {
                vou: post.vou + (presenca === 'vou' ? 1 : 0),
                talvez: post.talvez + (presenca === 'talvez' ? 1 : 0),
              })}
            </Texto>
            <View style={[estilos.linha, { marginTop: espaco.xs }]}>
              <View style={{ flex: 1 }}>
                <Botao
                  titulo={t('mapa.vou')}
                  variante={presenca === 'vou' ? 'principal' : 'secundario'}
                  icone={presenca === 'vou' ? 'check' : undefined}
                  grande
                  onPress={() => setPresenca((p) => (p === 'vou' ? null : 'vou'))}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Botao
                  titulo={t('feed.talvez')}
                  variante={presenca === 'talvez' ? 'principal' : 'contorno'}
                  grande
                  onPress={() => setPresenca((p) => (p === 'talvez' ? null : 'talvez'))}
                />
              </View>
            </View>
          </View>
        </Cartao>
      </View>
    );
  }

  if (post.tipo === 'foto') {
    return (
      <View style={estilos.post}>
        <CabecalhoPost post={post} />
        <Texto style={estilos.textoPost}>{post.texto}</Texto>
        <Image
          source={post.imagem}
          style={estilos.imagem}
          contentFit="cover"
          accessibilityLabel={t('feed.foto')}
        />
        <Acoes tfa={post.tfa} comentarios={post.comentarios} />
      </View>
    );
  }

  if (post.tipo === 'enquete') {
    const total = post.opcoes.reduce((s, o) => s + o.votos, 0) + (voto != null ? 1 : 0);
    return (
      <View style={estilos.post}>
        <CabecalhoPost post={post} />
        <View style={{ paddingHorizontal: espaco.md, gap: espaco.xs }}>
          <View style={estilos.linha}>
            <Icone nome="enquete" tamanho={22} cor={cores.acao} />
            <Texto variante="destaque" style={{ flex: 1 }}>
              {post.pergunta}
            </Texto>
          </View>
          {post.opcoes.map((o, i) => {
            const votos = o.votos + (voto === i ? 1 : 0);
            const pct = Math.round((votos / total) * 100);
            return (
              <Pressable
                key={o.texto}
                accessibilityRole="radio"
                accessibilityState={{ checked: voto === i }}
                accessibilityLabel={voto != null ? `${o.texto}, ${pct}%` : o.texto}
                onPress={() => setVoto(i)}
                style={[estilos.opcao, { borderColor: voto === i ? cores.acao : cores.linha }]}
              >
                {voto != null && (
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      { width: `${pct}%`, backgroundColor: cores.superficie3 },
                    ]}
                  />
                )}
                <Texto style={{ flex: 1, fontFamily: voto === i ? fontes.textoForte : fontes.textoMedio }}>
                  {o.texto}
                </Texto>
                {voto != null && <Texto variante="corpoForte">{pct}%</Texto>}
              </Pressable>
            );
          })}
          <Texto variante="pequeno">{t('feed.votos', { n: total })}</Texto>
        </View>
      </View>
    );
  }

  return (
    <View style={estilos.post}>
      <CabecalhoPost post={post} />
      <Cartao style={{ marginHorizontal: espaco.md, borderColor: cores.ouro, gap: espaco.xs }}>
        <View style={estilos.linha}>
          <Icone nome="alerta" tamanho={22} cor={cores.ouro} />
          <Texto variante="rotulo" style={{ color: cores.ouro }}>
            {t('feed.aviso')}
          </Texto>
        </View>
        <Texto variante="destaque">{post.titulo}</Texto>
        <Texto>{post.texto}</Texto>
      </Cartao>
    </View>
  );
}

const criarEstilos = (cores: Paleta) =>
  StyleSheet.create({
    tela: { flex: 1 },
    topo: { paddingHorizontal: espaco.lg, paddingTop: espaco.md, gap: 2 },
    stories: { gap: espaco.sm, paddingHorizontal: espaco.md },
    story: { width: 72, alignItems: 'center', gap: 4 },
    anelStory: {
      width: 68,
      height: 68,
      borderRadius: 34,
      borderWidth: 3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
    campoPost: {
      flex: 1,
      minHeight: 48,
      justifyContent: 'center',
      paddingHorizontal: espaco.md,
      borderRadius: raios.pilula,
      borderWidth: 1,
      backgroundColor: cores.superficie,
    },
    ferramentas: { flexDirection: 'row', justifyContent: 'space-between' },
    ferramenta: { alignItems: 'center', gap: 4, minWidth: 56, minHeight: 56, justifyContent: 'center' },
    post: {
      gap: espaco.sm,
      paddingVertical: espaco.md,
      backgroundColor: cores.superficie,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: cores.linha,
    },
    botaoMais: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    textoPost: { paddingHorizontal: espaco.md },
    imagem: { width: '100%', aspectRatio: 4 / 3, backgroundColor: cores.superficie3 },
    faixaRota: {
      position: 'absolute',
      left: espaco.sm,
      bottom: espaco.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: raios.pilula,
    },
    numeros: { flexDirection: 'row', paddingHorizontal: espaco.md },
    numero: { flex: 1, alignItems: 'center' },
    seloLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: espaco.sm,
      marginHorizontal: espaco.md,
      padding: espaco.xs,
      borderRadius: raios.botao,
      borderWidth: 1,
    },
    acoes: { flexDirection: 'row', gap: espaco.xs, paddingHorizontal: espaco.md, flexWrap: 'wrap' },
    acao: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 48,
      paddingHorizontal: 14,
      borderRadius: raios.pilula,
      borderWidth: 1,
      borderColor: cores.linha,
    },
    textoAcao: { fontFamily: fontes.textoSemi, fontSize: 15, color: cores.texto },
    opcao: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 52,
      paddingHorizontal: espaco.md,
      borderRadius: raios.botao,
      borderWidth: 1,
      overflow: 'hidden',
    },
  });
