import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StoryCena } from '@/componentes/StoryCena';
import { diretorios } from '@/dados/diretorios';
import { useMeusPosts } from '@/estado/meusPosts';
import { escolherMidia, prepararFoto } from '@/feed/foto';
import {
  coresTexto,
  DURACAO_MAX_VIDEO_S,
  estilosTexto,
  filtros,
  fundosTexto,
  posicoesTexto,
  type CamadaTexto,
  type ConteudoStory,
  type Filtro,
} from '@/stories/estilos';
import { espaco, fontes, raios, useCores } from '@/theme';
import { Botao, BotaoIcone, Chip, Texto } from '@/ui';

type Aba = 'filtros' | 'texto' | 'selos';

/**
 * Novo story (v2): câmera própria — toque = foto, segure = vídeo até 60 s —, trocar câmera, flash,
 * galeria (foto ou vídeo); depois filtros, textos com estilo/cor/fundo/tamanho/posição e selos
 * (@irmão, local digitado, km). Nunca grava localização no arquivo.
 */
export default function NovoStory() {
  const { t } = useTranslation();
  const cores = useCores();
  const { publicarStory } = useMeusPosts();
  const camera = useRef<CameraView>(null);
  const [permCam, pedirCam] = useCameraPermissions();
  const [permMic, pedirMic] = useMicrophonePermissions();
  const [frente, setFrente] = useState(false);
  const [flash, setFlash] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [modo, setModo] = useState<'picture' | 'video'>('picture');
  const [conteudo, setConteudo] = useState<ConteudoStory | null>(null);
  const [aba, setAba] = useState<Aba>('filtros');
  const [rascunho, setRascunho] = useState<Omit<CamadaTexto, 'id'>>({
    texto: '',
    estilo: 'forte',
    cor: '#F3EADB',
    fundo: 'faixa',
    posicao: 'base',
    tamanho: 'm',
  });

  const foto = async () => {
    const r = await camera.current?.takePictureAsync({ quality: 0.9, exif: false }).catch(() => null);
    if (r?.uri)
      setConteudo({ uri: await prepararFoto(r.uri), tipo: 'foto', filtro: 'nenhum', textos: [], selos: {} });
  };
  const comecarVideo = async () => {
    if (!permMic?.granted && !(await pedirMic()).granted) return Alert.alert(t('story.semMicrofone'));
    setModo('video');
    setGravando(true);
    // espera a câmera trocar para o modo vídeo
    await new Promise((r) => setTimeout(r, 250));
    const r = await camera.current?.recordAsync({ maxDuration: DURACAO_MAX_VIDEO_S }).catch(() => null);
    setGravando(false);
    setModo('picture');
    if (r?.uri) setConteudo({ uri: r.uri, tipo: 'video', filtro: 'nenhum', textos: [], selos: {} });
  };
  const pararVideo = () => camera.current?.stopRecording();

  const galeria = async () => {
    const m = await escolherMidia();
    if (m) setConteudo({ ...m, filtro: 'nenhum', textos: [], selos: {} });
  };

  // 1) Câmera
  if (!conteudo) {
    if (!permCam?.granted)
      return (
        <SafeAreaView
          style={[estilos.tela, { backgroundColor: cores.fundo, padding: espaco.lg, gap: espaco.md }]}
        >
          <BotaoIcone icone="fechar" rotulo={t('comum.fechar')} onPress={() => router.back()} />
          <Texto variante="titulo">{t('story.novo')}</Texto>
          <Texto>{t('story.pedirCamera')}</Texto>
          <Botao titulo={t('story.liberarCamera')} icone="camera" grande onPress={() => void pedirCam()} />
          <Botao
            titulo={t('story.galeria')}
            icone="camadas"
            variante="secundario"
            onPress={() => void galeria()}
          />
        </SafeAreaView>
      );
    return (
      <View style={estilos.tela}>
        <CameraView
          ref={camera}
          style={StyleSheet.absoluteFill}
          facing={frente ? 'front' : 'back'}
          flash={flash ? 'on' : 'off'}
          enableTorch={flash && modo === 'video'}
          mode={modo}
          videoQuality="720p"
        />
        <SafeAreaView style={estilos.sobreCamera} pointerEvents="box-none">
          <View style={estilos.linhaTopo}>
            <BotaoIcone icone="fechar" rotulo={t('comum.fechar')} flutuante onPress={() => router.back()} />
            <BotaoIcone
              icone="sol"
              rotulo={flash ? t('story.flashLigado') : t('story.flashDesligado')}
              flutuante
              corIcone={flash ? cores.alerta : undefined}
              onPress={() => setFlash((f) => !f)}
            />
          </View>
          <View style={{ alignItems: 'center', gap: espaco.md, paddingBottom: espaco.lg }}>
            <Texto style={estilos.dica}>{gravando ? t('story.gravando') : t('story.dicaCamera')}</Texto>
            <View style={estilos.linhaBase}>
              <BotaoIcone
                icone="camadas"
                rotulo={t('story.galeria')}
                flutuante
                onPress={() => void galeria()}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('story.disparar')}
                accessibilityHint={t('story.dicaCamera')}
                onPress={() => void foto()}
                onLongPress={() => void comecarVideo()}
                onPressOut={() => gravando && pararVideo()}
                delayLongPress={300}
                style={[estilos.disparo, { borderColor: gravando ? cores.sos : '#FFFFFF' }]}
              >
                <View style={[estilos.disparoMiolo, { backgroundColor: gravando ? cores.sos : '#FFFFFF' }]} />
              </Pressable>
              <BotaoIcone
                icone="reagrupar"
                rotulo={t('story.trocarCamera')}
                flutuante
                onPress={() => setFrente((f) => !f)}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // 2) Editor
  const adicionarTexto = () => {
    if (!rascunho.texto.trim()) return;
    setConteudo((c) =>
      c
        ? { ...c, textos: [...c.textos, { ...rascunho, texto: rascunho.texto.trim(), id: `t${Date.now()}` }] }
        : c,
    );
    setRascunho((r) => ({ ...r, texto: '' }));
  };
  const muda = (p: Partial<Omit<CamadaTexto, 'id'>>) => setRascunho((r) => ({ ...r, ...p }));

  return (
    <View style={[estilos.tela, { backgroundColor: '#000' }]}>
      <View style={{ flex: 1 }}>
        <StoryCena c={conteudo} />
        <SafeAreaView
          edges={['top']}
          style={[StyleSheet.absoluteFill, { padding: espaco.sm }]}
          pointerEvents="box-none"
        >
          <View style={estilos.linhaTopo}>
            <BotaoIcone
              icone="voltar"
              rotulo={t('story.refazer')}
              flutuante
              onPress={() => setConteudo(null)}
            />
            {conteudo.textos.length > 0 && (
              <BotaoIcone
                icone="menos"
                rotulo={t('story.apagarTexto')}
                flutuante
                onPress={() => setConteudo((c) => (c ? { ...c, textos: c.textos.slice(0, -1) } : c))}
              />
            )}
          </View>
        </SafeAreaView>
      </View>

      <SafeAreaView
        edges={['bottom']}
        style={{ backgroundColor: cores.superficie, padding: espaco.md, gap: espaco.sm }}
      >
        <View style={{ flexDirection: 'row', gap: espaco.xs }}>
          {(['filtros', 'texto', 'selos'] as const).map((a) => (
            <Chip key={a} rotulo={t(`story.abas.${a}`)} ativo={aba === a} onPress={() => setAba(a)} />
          ))}
        </View>

        {aba === 'filtros' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: espaco.xs }}
          >
            {filtros.map((f) => (
              <Chip
                key={f.id}
                rotulo={t(`story.filtros.${f.id}`)}
                ativo={conteudo.filtro === f.id}
                onPress={() => setConteudo((c) => (c ? { ...c, filtro: f.id as Filtro } : c))}
              />
            ))}
          </ScrollView>
        )}

        {aba === 'texto' && (
          <View style={{ gap: espaco.xs }}>
            <View style={{ flexDirection: 'row', gap: espaco.xs }}>
              <TextInput
                value={rascunho.texto}
                onChangeText={(v) => muda({ texto: v.slice(0, 120) })}
                placeholder={t('story.escrevaTexto')}
                placeholderTextColor={cores.textoSec}
                accessibilityLabel={t('story.escrevaTexto')}
                style={[estilos.campo, { color: cores.texto, borderColor: cores.linha }]}
              />
              <Botao
                titulo={t('story.adicionarTexto')}
                onPress={adicionarTexto}
                desativado={!rascunho.texto.trim()}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: espaco.xs }}
            >
              {estilosTexto.map((e) => (
                <Chip
                  key={e}
                  rotulo={t(`story.estilos.${e}`)}
                  ativo={rascunho.estilo === e}
                  onPress={() => muda({ estilo: e })}
                />
              ))}
              {(['p', 'm', 'g'] as const).map((s) => (
                <Chip
                  key={s}
                  rotulo={t(`story.tamanhos.${s}`)}
                  ativo={rascunho.tamanho === s}
                  onPress={() => muda({ tamanho: s })}
                />
              ))}
            </ScrollView>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: espaco.xs, alignItems: 'center' }}
            >
              {coresTexto.map((c) => (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityLabel={t('story.cor', { cor: t(`story.cores.${c.slice(1)}`) })}
                  accessibilityState={{ selected: rascunho.cor === c }}
                  onPress={() => muda({ cor: c })}
                  style={[
                    estilos.bolinha,
                    { backgroundColor: c, borderColor: rascunho.cor === c ? cores.acao : cores.linha },
                  ]}
                />
              ))}
              {fundosTexto.map((f) => (
                <Chip
                  key={f}
                  rotulo={t(`story.fundos.${f}`)}
                  ativo={rascunho.fundo === f}
                  onPress={() => muda({ fundo: f })}
                />
              ))}
              {posicoesTexto.map((p) => (
                <Chip
                  key={p}
                  rotulo={t(`story.posicoes.${p}`)}
                  ativo={rascunho.posicao === p}
                  onPress={() => muda({ posicao: p })}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {aba === 'selos' && (
          <View style={{ gap: espaco.xs }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: espaco.xs }}
            >
              {diretorios.membros.map((m) => (
                <Chip
                  key={m.id}
                  rotulo={`@${m.titulo}`}
                  ativo={conteudo.selos.mencao === m.titulo}
                  onPress={() =>
                    setConteudo((c) =>
                      c
                        ? {
                            ...c,
                            selos: { ...c.selos, mencao: c.selos.mencao === m.titulo ? undefined : m.titulo },
                          }
                        : c,
                    )
                  }
                />
              ))}
            </ScrollView>
            <TextInput
              value={conteudo.selos.local ?? ''}
              onChangeText={(v) =>
                setConteudo((c) =>
                  c ? { ...c, selos: { ...c.selos, local: v.slice(0, 40) || undefined } } : c,
                )
              }
              placeholder={t('story.selos.local')}
              placeholderTextColor={cores.textoSec}
              accessibilityLabel={t('story.selos.local')}
              style={[estilos.campo, { color: cores.texto, borderColor: cores.linha }]}
            />
            <TextInput
              value={conteudo.selos.km != null ? String(conteudo.selos.km) : ''}
              onChangeText={(v) => {
                const n = Number(v.replace(/\D/g, ''));
                setConteudo((c) => (c ? { ...c, selos: { ...c.selos, km: n > 0 ? n : undefined } } : c));
              }}
              keyboardType="numeric"
              placeholder={t('story.selos.km')}
              placeholderTextColor={cores.textoSec}
              accessibilityLabel={t('story.selos.km')}
              style={[estilos.campo, { color: cores.texto, borderColor: cores.linha }]}
            />
          </View>
        )}

        <Texto variante="pequeno">{t('publicar.semLocal')}</Texto>
        <Botao
          titulo={t('story.publicar')}
          grande
          icone="check"
          onPress={() => {
            publicarStory(conteudo);
            router.back();
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  sobreCamera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: espaco.sm,
  },
  linhaTopo: { flexDirection: 'row', justifyContent: 'space-between' },
  linhaBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    alignSelf: 'stretch',
  },
  dica: { color: '#FFFFFF', fontFamily: fontes.textoSemi, textShadowColor: '#000', textShadowRadius: 6 },
  disparo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disparoMiolo: { width: 64, height: 64, borderRadius: 32 },
  campo: {
    flex: 1,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: raios.botao,
    paddingHorizontal: espaco.md,
    fontFamily: fontes.texto,
    fontSize: 17,
  },
  bolinha: { width: 44, height: 44, borderRadius: 22, borderWidth: 3 },
});
