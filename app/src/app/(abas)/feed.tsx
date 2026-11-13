import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CartaoPasseio } from '@/componentes/CartaoPasseio';
import { agapeExemplo } from '@/dados/agape';
import { niveis, selos } from '@/dados/conquistas';
import { postsExemplo, stories, type Post } from '@/dados/feed';
import { passeiosExemplo } from '@/dados/passeios';
import { useAgapes } from '@/estado/agapes';
import { useMeusPosts } from '@/estado/meusPosts';
import { useModeracao } from '@/feed/moderacao';
import type { PostServidor } from '@/servidor/feed';
import { espaco, fontes, raios, useCores, useEstilos, type Paleta } from '@/theme';
import { Avatar, Botao, Cartao, EstadoVazio, Icone, pinos, Texto, type NomeIcone } from '@/ui';
import { abrirMenu, avisar } from '@/ui/dialogo';

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
  const emBreve = () => avisar(t('comum.emBreve'), t('feed.emBreve'));
  const { agapes } = useAgapes();
  const meus = useMeusPosts();
  const usarFerramenta = (chave: string) => {
    if (chave === 'foto') router.push('/publicar?foto=galeria');
    else if (chave === 'enquete') router.push('/publicar?enquete=1');
    else if (chave === 'rota') router.push('/rota');
    else if (chave === 'evento') router.push('/ferramentas/agape');
    else emBreve();
  };
  const real = meus.servidor;
  const posts: Post[] = real
    ? []
    : [
        ...meus.posts.map<Post>((m) => ({
          id: m.id,
          tipo: 'meu',
          autor: { nome: t('perfil.voce'), capitulo: 'Cuiabá', status: 'aberto' },
          quando: t('feed.agora'),
          meu: m,
        })),
        ...agapes
          .filter((a) => a.id !== agapeExemplo.id)
          .map<Post>((a) => ({
            id: a.id,
            tipo: 'agape',
            autor: { nome: a.organizador, capitulo: 'Cuiabá', status: 'aberto' },
            quando: t('feed.agora'),
            agape: a,
          })),
        ...postsExemplo,
      ];

  const cabecalho = (
    <View style={{ gap: espaco.md }}>
      {/* Sem o título "Feed" (pedido do dono): a aba já diz onde o irmão está. */}
      {!real && (
        <Texto variante="pequeno" style={{ paddingHorizontal: espaco.md }}>
          {t('feed.exemplo')}
        </Texto>
      )}
      {real && meus.falhaServidor && (
        <Texto variante="pequeno" style={{ paddingHorizontal: espaco.md }}>
          {t('feed.erroCarregar')}
        </Texto>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.stories}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={meus.stories.length ? t('feed.verSeuStory') : t('feed.seuStory')}
          onPress={() => router.push(meus.stories.length ? '/story?de=meu' : '/story-novo')}
          style={estilos.story}
        >
          <View
            style={[
              estilos.anelStory,
              meus.stories.length
                ? { borderColor: cores.acao }
                : { borderColor: cores.linhaForte, borderStyle: 'dashed' },
            ]}
          >
            {meus.stories.length ? (
              <Image
                source={{ uri: meus.stories[0]!.foto }}
                style={{ width: 58, height: 58, borderRadius: 29 }}
                contentFit="cover"
                accessible={false}
              />
            ) : (
              <Icone nome="mais" tamanho={28} cor={cores.acao} espessura={2.4} />
            )}
          </View>
          <Texto variante="pequeno" numberOfLines={1}>
            {t('feed.seuStory')}
          </Texto>
        </Pressable>
        {real &&
          meus.storiesDeOutros
            .filter((x, i, l) => l.findIndex((y) => y.autorId === x.autorId) === i)
            .map((s) => (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                accessibilityLabel={t('feed.storyDe', { nome: s.autor })}
                onPress={() => router.push(`/story?de=srv:${s.id}`)}
                style={estilos.story}
              >
                <View style={[estilos.anelStory, { borderColor: cores.acao }]}>
                  <Avatar nome={s.autor} status="nenhum" tamanho={58} />
                </View>
                <Texto variante="pequeno" numberOfLines={1}>
                  {s.autor.split(' ')[0]}
                </Texto>
              </Pressable>
            ))}
        {(real ? [] : stories).map((s, i) => (
          <Pressable
            key={s.nome}
            accessibilityRole="button"
            accessibilityLabel={t('feed.storyDe', { nome: s.nome })}
            onPress={() => router.push(`/story?de=${i}`)}
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('feed.compor')}
          onPress={() => router.push('/publicar')}
          style={estilos.linha}
        >
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
              onPress={() => usarFerramenta(f.chave)}
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
      <FlatList<Post | PostServidor>
        data={real ? meus.postsServidor : posts}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={cabecalho}
        contentContainerStyle={{ gap: espaco.md, paddingBottom: espaco.xxxl }}
        renderItem={({ item }) =>
          'tipo' in item ? <CartaoPost post={item} /> : <CartaoServidor post={item} />
        }
        refreshing={real && meus.carregandoServidor}
        onRefresh={real ? () => void meus.recarregar() : undefined}
        onEndReached={real ? () => void meus.carregarMais() : undefined}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          real && !meus.carregandoServidor && !meus.falhaServidor ? (
            <EstadoVazio ilustracao="estrada" titulo={t('feed.vazioTitulo')} texto={t('feed.vazioTexto')}>
              <Botao
                titulo={t('feed.vazioAcao')}
                icone="mais"
                grande
                onPress={() => router.push('/publicar')}
              />
            </EstadoVazio>
          ) : (
            <View />
          )
        }
      />
    </SafeAreaView>
  );
}

/** Quando o post foi feito: "agora" no primeiro minuto, depois a data no idioma do aparelho. */
function quandoDe(iso: string, agora: string) {
  const dif = Date.now() - Date.parse(iso);
  return dif < 60000 ? agora : new Date(iso).toLocaleDateString();
}

/** Post real do servidor (feed ligado ao Supabase). */
function CartaoServidor({ post }: { post: PostServidor }) {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const loja = useMeusPosts();
  const { confirmarDenuncia, confirmarBloqueio } = useModeracao();
  const opcoes = () =>
    post.meu
      ? abrirMenu({
          titulo: t('feed.opcoes'),
          opcoes: [
            {
              rotulo: t('publicar.excluir'),
              icone: 'lixeira',
              destrutivo: true,
              onPress: () =>
                avisar(t('publicar.excluirPergunta'), undefined, [
                  { text: t('comum.cancelar'), style: 'cancel' },
                  { text: t('publicar.excluir'), style: 'destructive', onPress: () => loja.excluir(post.id) },
                ]),
            },
          ],
        })
      : abrirMenu({
          titulo: t('feed.opcoes'),
          opcoes: [
            {
              rotulo: t('feed.denunciar'),
              icone: 'bandeira',
              onPress: () => confirmarDenuncia('post', post.id),
            },
            {
              rotulo: t('feed.bloquear', { nome: post.autorNome }),
              icone: 'bloquear',
              destrutivo: true,
              onPress: () => confirmarBloqueio(post.autorId, post.autorNome),
            },
          ],
        });
  return (
    <View style={estilos.post}>
      <View style={[estilos.linha, { paddingHorizontal: espaco.md }]}>
        <Avatar nome={post.autorNome} status="nenhum" tamanho={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Texto variante="corpoForte" numberOfLines={1}>
            {post.meu ? t('perfil.voce') : post.autorNome}
          </Texto>
          <Texto variante="pequeno" numberOfLines={1}>
            {t('feed.capituloQuando', {
              capitulo: post.capitulo ?? '',
              quando: quandoDe(post.criadoEm, t('feed.agora')),
            })}
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
      {!!post.texto && (
        <Texto style={[estilos.textoPost, post.enquete && { fontFamily: fontes.textoSemi }]}>
          {post.texto}
        </Texto>
      )}
      {post.enquete && (
        <View style={{ paddingHorizontal: espaco.md, gap: espaco.xs }}>
          {post.enquete.map((o) => (
            <View
              key={o}
              accessible
              accessibilityLabel={t('feed.enqueteOpcao', { texto: o })}
              style={[estilos.opcao, { borderColor: cores.linha }]}
            >
              <Texto style={{ flex: 1, fontFamily: fontes.textoMedio }}>{o}</Texto>
            </View>
          ))}
        </View>
      )}
      {post.fotos.map((uri) => (
        <Image
          key={uri}
          source={{ uri }}
          style={estilos.imagem}
          contentFit="cover"
          accessibilityLabel={t('feed.foto')}
        />
      ))}
      <Texto variante="pequeno" style={{ paddingHorizontal: espaco.md }}>
        {t(`publicar.vis.${post.visibilidade}`)}
      </Texto>
      <View style={estilos.acoes}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: post.euDeiTfa }}
          accessibilityLabel={t('feed.tfaRotulo', { n: post.tfa })}
          onPress={() => void loja.alternarTfa(post.id).catch(() => avisar(t('feed.erroAcao')))}
          style={[
            estilos.acao,
            post.euDeiTfa && { backgroundColor: cores.superficie3, borderColor: cores.acao },
          ]}
        >
          <Icone nome="aceno" tamanho={22} cor={post.euDeiTfa ? cores.acao : cores.texto} />
          <Texto style={[estilos.textoAcao, post.euDeiTfa && { color: cores.acao }]}>
            {t('feed.tfa', { n: post.tfa })}
          </Texto>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('feed.comentarios', { n: post.comentarios })}
          onPress={() => router.push(`/comentarios/${post.id}`)}
          style={estilos.acao}
        >
          <Icone nome="comentario" tamanho={22} />
          <Texto style={estilos.textoAcao}>{post.comentarios}</Texto>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={post.salvo ? t('feed.salvo') : t('feed.salvar')}
          accessibilityState={{ selected: post.salvo }}
          onPress={() => loja.alternarSalvo(post.id)}
          style={[estilos.acao, post.salvo && { borderColor: cores.ouro }]}
        >
          <Icone nome="salvar" tamanho={22} cor={post.salvo ? cores.ouro : cores.texto} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('feed.compartilhar')}
          onPress={() => void Share.share({ message: t('feed.compartilharTexto') })}
          style={estilos.acao}
        >
          <Icone nome="compartilhar" tamanho={22} />
        </Pressable>
      </View>
    </View>
  );
}

function CabecalhoPost({ post }: { post: Post }) {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const { excluir } = useMeusPosts();
  const opcoes = () =>
    post.tipo === 'meu'
      ? abrirMenu({
          titulo: t('feed.opcoes'),
          opcoes: [
            {
              rotulo: t('publicar.editar'),
              icone: 'editar',
              onPress: () => router.push(`/publicar?id=${post.id}`),
            },
            {
              rotulo: t('publicar.excluir'),
              icone: 'lixeira',
              destrutivo: true,
              onPress: () =>
                avisar(t('publicar.excluirPergunta'), undefined, [
                  { text: t('comum.cancelar'), style: 'cancel' },
                  { text: t('publicar.excluir'), style: 'destructive', onPress: () => excluir(post.id) },
                ]),
            },
          ],
        })
      : abrirMenu({
          titulo: t('feed.opcoes'),
          opcoes: [
            {
              rotulo: t('feed.denunciar'),
              icone: 'bandeira',
              onPress: () => avisar(t('feed.denunciar'), t('feed.denunciaRecebida')),
            },
            {
              rotulo: t('feed.bloquear', { nome: post.autor.nome }),
              icone: 'bloquear',
              destrutivo: true,
              onPress: () => undefined,
            },
          ],
        });
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

function Acoes({
  postId,
  tfa,
  comentarios,
  usarRota,
}: {
  postId: string;
  tfa: number;
  comentarios: number;
  usarRota?: boolean;
}) {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const [dei, setDei] = useState(false);
  const loja = useMeusPosts();
  const locais = loja.comentarios[postId]?.length ?? 0;
  const salvo = loja.salvos.includes(postId);
  comentarios += locais;
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
        onPress={() => router.push(`/comentarios/${postId}`)}
        style={estilos.acao}
      >
        <Icone nome="comentario" tamanho={22} />
        <Texto style={estilos.textoAcao}>{comentarios}</Texto>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={salvo ? t('feed.salvo') : t('feed.salvar')}
        accessibilityState={{ selected: salvo }}
        onPress={() => loja.alternarSalvo(postId)}
        style={[estilos.acao, salvo && { borderColor: cores.ouro }]}
      >
        <Icone nome="salvar" tamanho={22} cor={salvo ? cores.ouro : cores.texto} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('feed.compartilhar')}
        onPress={() => void Share.share({ message: t('feed.compartilharTexto') })}
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
        <Acoes postId={post.id} tfa={post.tfa} comentarios={post.comentarios} usarRota />
      </View>
    );
  }

  if (post.tipo === 'passeio') {
    const passeio = passeiosExemplo.find((x) => x.id === post.passeioId);
    if (!passeio) return null;
    return (
      <View style={estilos.post}>
        <CabecalhoPost post={post} />
        <View style={{ paddingHorizontal: espaco.md }}>
          <CartaoPasseio passeio={passeio} />
        </View>
      </View>
    );
  }

  if (post.tipo === 'agape') {
    const ag = post.agape ?? agapeExemplo;
    return (
      <View style={estilos.post}>
        <CabecalhoPost post={post} />
        <Cartao
          style={{ marginHorizontal: espaco.md, borderColor: cores.ouro, borderWidth: 2, gap: espaco.sm }}
        >
          <View style={estilos.linha}>
            <Image
              source={pinos.agape.imagem}
              style={{ width: 52, height: 64 }}
              contentFit="contain"
              accessible={false}
            />
            <View style={{ flex: 1 }}>
              <Texto variante="rotulo" style={{ color: cores.ouro }}>
                {t('mapa.agapeRotulo', { tempo: ag.comecaEm })}
              </Texto>
              <Texto variante="subtitulo">{t('feed.agapeEm', { local: ag.local })}</Texto>
              <Texto variante="secundario">{t('feed.agapeHora', { hora: ag.horario })}</Texto>
            </View>
          </View>
          <Texto>{ag.texto}</Texto>
          <View style={estilos.linha}>
            <View style={{ flexDirection: 'row' }}>
              {ag.vao.map((n, i) => (
                <View key={n} style={{ marginLeft: i === 0 ? 0 : -10 }}>
                  <Avatar nome={n} tamanho={34} />
                </View>
              ))}
            </View>
            <Texto variante="secundario">
              {t('feed.vaoN', { n: ag.vao.length + (presenca === 'vou' ? 1 : 0) })}
            </Texto>
          </View>
          <View style={estilos.linha}>
            <View style={{ flex: 1 }}>
              <Botao
                titulo={t('mapa.vou')}
                variante={presenca === 'vou' ? 'principal' : 'secundario'}
                icone={presenca === 'vou' ? 'check' : 'agape'}
                grande
                onPress={() => setPresenca((v) => (v === 'vou' ? null : 'vou'))}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Botao
                titulo={t('feed.verNoMapa')}
                variante="contorno"
                icone="mapa"
                grande
                onPress={() => router.navigate('/')}
              />
            </View>
          </View>
        </Cartao>
      </View>
    );
  }

  if (post.tipo === 'conquista') {
    const nivel = niveis.find((n) => n.chave === post.nivel)!;
    return (
      <View style={estilos.post}>
        <CabecalhoPost post={post} />
        <View style={{ alignItems: 'center', gap: espaco.xs, paddingHorizontal: espaco.md }}>
          <Image
            source={nivel.imagem}
            style={{ width: 140, height: 156 }}
            contentFit="contain"
            accessible={false}
          />
          <Texto variante="subtitulo" style={{ textAlign: 'center' }}>
            {t('feed.subiuNivel', {
              nome: post.autor.nome.split(' ')[0],
              nivel: t(`conquistas.niveis.${post.nivel}`),
            })}
          </Texto>
        </View>
        <Acoes postId={post.id} tfa={12} comentarios={6} />
      </View>
    );
  }

  if (post.tipo === 'chegada') {
    return (
      <View style={estilos.post}>
        <CabecalhoPost post={post} />
        <Cartao style={{ marginHorizontal: espaco.md, gap: espaco.sm }}>
          <View style={estilos.linha}>
            <Icone nome="localizacao" tamanho={28} cor={cores.estrada} />
            <Texto variante="destaque" style={{ flex: 1 }}>
              {t('feed.chegou', { nome: post.autor.nome.split(' ')[0], cidade: post.cidade })}
            </Texto>
          </View>
          <Texto variante="secundario">{t('feed.irmaosPerto', { n: post.irmaosPerto })}</Texto>
          <Botao
            titulo={t('feed.acenar')}
            icone="aceno"
            variante="secundario"
            onPress={() => avisar(t('comum.emBreve'), t('feed.emBreve'))}
          />
        </Cartao>
      </View>
    );
  }

  if (post.tipo === 'meu') {
    const m = post.meu;
    return (
      <View style={estilos.post}>
        <CabecalhoPost post={post} />
        {!!m.texto && (
          <Texto style={[estilos.textoPost, m.enquete && { fontFamily: fontes.textoSemi }]}>{m.texto}</Texto>
        )}
        {m.enquete && (
          <View style={{ paddingHorizontal: espaco.md, gap: espaco.xs }}>
            {m.enquete.map((o, i) => (
              <Pressable
                key={o}
                accessibilityRole="radio"
                accessibilityState={{ checked: voto === i }}
                accessibilityLabel={o}
                onPress={() => setVoto(i)}
                style={[estilos.opcao, { borderColor: voto === i ? cores.acao : cores.linha }]}
              >
                <Texto style={{ flex: 1, fontFamily: voto === i ? fontes.textoForte : fontes.textoMedio }}>
                  {o}
                </Texto>
                {voto === i && <Icone nome="check" tamanho={20} cor={cores.acao} />}
              </Pressable>
            ))}
          </View>
        )}
        {m.foto && (
          <Image
            source={{ uri: m.foto }}
            style={estilos.imagem}
            contentFit="cover"
            accessibilityLabel={t('feed.foto')}
          />
        )}
        <Texto variante="pequeno" style={{ paddingHorizontal: espaco.md }}>
          {t(`publicar.vis.${m.visibilidade}`)}
          {m.editadoEm ? ` · ${t('publicar.editado')}` : ''}
        </Texto>
        <Acoes postId={post.id} tfa={0} comentarios={0} />
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
        <Acoes postId={post.id} tfa={post.tfa} comentarios={post.comentarios} />
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
