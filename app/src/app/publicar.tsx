import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';

import { Campo, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { useMeusPosts, type VisibilidadePost } from '@/estado/meusPosts';
import { escolherFoto } from '@/feed/foto';
import { espaco, raios, useCores } from '@/theme';
import { Botao, Chip, Icone, Texto } from '@/ui';

const visibilidades: VisibilidadePost[] = ['todos', 'capitulo', 'amigos'];

/** Publicar ou editar um post: texto, foto (sem localização na foto) e quem pode ver. */
export default function Publicar() {
  const { t } = useTranslation();
  const cores = useCores();
  const { posts, publicar, editar } = useMeusPosts();
  const {
    id,
    foto: abrirFoto,
    enquete: modoEnquete,
  } = useLocalSearchParams<{
    id?: string;
    foto?: 'galeria' | 'camera';
    enquete?: string;
  }>();
  const existente = posts.find((p) => p.id === id);
  const [texto, setTexto] = useState(existente?.texto ?? '');
  const [foto, setFoto] = useState<string | undefined>(existente?.foto);
  const [vis, setVis] = useState<VisibilidadePost>(existente?.visibilidade ?? 'todos');
  const [carregando, setCarregando] = useState(false);
  const ehEnquete = !!existente?.enquete || modoEnquete === '1';
  const [opcoes, setOpcoes] = useState<string[]>(existente?.enquete ?? ['', '']);
  const opcoesValidas = opcoes.map((o) => o.trim()).filter(Boolean);

  const pegar = async (origem: 'galeria' | 'camera') => {
    setCarregando(true);
    const uri = await escolherFoto(origem).catch(() => null);
    setCarregando(false);
    if (uri) setFoto(uri);
  };

  useEffect(() => {
    if (abrirFoto) void Promise.resolve().then(() => pegar(abrirFoto));
    // abre a galeria/câmera uma vez se veio do atalho do feed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enviar = async () => {
    if (ehEnquete && (!texto.trim() || opcoesValidas.length < 2))
      return Alert.alert(t('publicar.enqueteFalta'));
    if (!texto.trim() && !foto) return Alert.alert(t('publicar.vazio'));
    const enquete = ehEnquete ? opcoesValidas : undefined;
    if (existente) editar(existente.id, { texto: texto.trim(), foto, visibilidade: vis, enquete });
    else {
      setCarregando(true);
      try {
        await publicar({ texto: texto.trim(), foto, visibilidade: vis, enquete });
      } catch {
        setCarregando(false);
        return Alert.alert(t('feed.erroAcao'));
      }
    }
    router.back();
  };

  return (
    <TelaFerramenta
      titulo={
        existente
          ? t('publicar.editarTitulo')
          : ehEnquete
            ? t('publicar.enqueteTitulo')
            : t('publicar.titulo')
      }
    >
      <Campo
        rotulo={ehEnquete ? t('publicar.pergunta') : t('publicar.texto')}
        valor={texto}
        aoMudar={setTexto}
        linhas={ehEnquete ? 2 : 5}
      />
      {ehEnquete && (
        <View style={{ gap: espaco.xs }}>
          {opcoes.map((o, i) => (
            <Campo
              key={i}
              rotulo={t('publicar.opcao', { n: i + 1 })}
              valor={o}
              aoMudar={(v) => setOpcoes((l) => l.map((x, j) => (j === i ? v : x)))}
            />
          ))}
          {opcoes.length < 4 && (
            <Botao
              titulo={t('publicar.maisOpcao')}
              icone="mais"
              variante="contorno"
              onPress={() => setOpcoes((l) => [...l, ''])}
            />
          )}
        </View>
      )}
      {ehEnquete ? null : foto ? (
        <View>
          <Image
            source={{ uri: foto }}
            style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: raios.cartao }}
            contentFit="cover"
            accessibilityLabel={t('feed.foto')}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('publicar.tirarFoto')}
            onPress={() => setFoto(undefined)}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: cores.superficie,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icone nome="fechar" />
          </Pressable>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: espaco.xs }}>
          <View style={{ flex: 1 }}>
            <Botao
              titulo={t('publicar.galeria')}
              icone="camadas"
              variante="secundario"
              desativado={carregando}
              onPress={() => void pegar('galeria')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Botao
              titulo={t('publicar.camera')}
              icone="camera"
              variante="secundario"
              desativado={carregando}
              onPress={() => void pegar('camera')}
            />
          </View>
        </View>
      )}
      <Texto variante="pequeno">{t('publicar.semLocal')}</Texto>
      <Texto variante="rotulo">{t('publicar.quemVe')}</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
        {visibilidades.map((v) => (
          <Chip key={v} rotulo={t(`publicar.vis.${v}`)} ativo={vis === v} onPress={() => setVis(v)} />
        ))}
      </View>
      <Botao
        titulo={existente ? t('publicar.salvar') : t('publicar.publicar')}
        grande
        icone="check"
        desativado={carregando}
        onPress={() => void enviar()}
      />
    </TelaFerramenta>
  );
}
