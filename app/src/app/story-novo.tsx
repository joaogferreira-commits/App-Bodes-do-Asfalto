import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuadroDesenho } from '@/componentes/QuadroDesenho';
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
  moverTexto,
  velocidades,
  type Velocidade,
  zoomDasVezes,
} from '@/stories/estilos';
import { espaco, fontes, raios, useCores } from '@/theme';
import { Botao, BotaoIcone, Chip, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

type Aba = 'filtros' | 'texto' | 'desenho' | 'selos' | 'interativos';

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
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');
  const [zoom, setZoom] = useState<1 | 2 | 4>(1);
  const [temporizador, setTemporizador] = useState<0 | 3 | 10>(0);
  const [grade, setGrade] = useState(false);
  const [maosLivres, setMaosLivres] = useState(false);
  const [contagem, setContagem] = useState<number | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [gravando, setGravando] = useState(false);
  const [modo, setModo] = useState<'picture' | 'video'>('picture');
  const [conteudo, setConteudo] = useState<ConteudoStory | null>(null);
  const [aba, setAba] = useState<Aba>('filtros');
  const [enviando, setEnviando] = useState(false);
  const [desenhando, setDesenhando] = useState(false);
  const [corTraco, setCorTraco] = useState<string>('#E8692A');
  const [espessura, setEspessura] = useState(10);
  const [cena, setCena] = useState({ w: 0, h: 0 });
  const [enquete, setEnquete] = useState({ pergunta: '', a: '', b: '' });
  const [pergunta, setPergunta] = useState('');
  const [contagemTitulo, setContagemTitulo] = useState('');
  const [rascunho, setRascunho] = useState<Omit<CamadaTexto, 'id'>>({
    texto: '',
    estilo: 'forte',
    cor: '#F3EADB',
    fundo: 'faixa',
    posicao: 'base',
    tamanho: 'm',
  });

  /** Temporizador: conta 3 ou 10 s na tela antes de disparar. */
  const comTemporizador = (acao: () => void) => {
    if (!temporizador) return acao();
    let n = temporizador;
    setContagem(n);
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        setContagem(null);
        acao();
      } else setContagem(n);
    }, 1000);
  };

  const foto = async () => {
    const r = await camera.current?.takePictureAsync({ quality: 0.9, exif: false }).catch(() => null);
    if (r?.uri)
      setConteudo({ uri: await prepararFoto(r.uri), tipo: 'foto', filtro: 'nenhum', textos: [], selos: {} });
  };
  const comecarVideo = async () => {
    if (!permMic?.granted && !(await pedirMic()).granted) return avisar(t('story.semMicrofone'));
    setModo('video');
    setGravando(true);
    setSegundos(0);
    const relogio = setInterval(() => setSegundos((x) => Math.min(DURACAO_MAX_VIDEO_S, x + 1)), 1000);
    // espera a câmera trocar para o modo vídeo
    await new Promise((r) => setTimeout(r, 250));
    const r = await camera.current?.recordAsync({ maxDuration: DURACAO_MAX_VIDEO_S }).catch(() => null);
    clearInterval(relogio);
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
          flash={flash}
          enableTorch={flash === 'on' && modo === 'video'}
          zoom={zoomDasVezes[zoom]}
          mirror={frente}
          mode={modo}
          videoQuality="720p"
        />
        <SafeAreaView style={estilos.sobreCamera} pointerEvents="box-none">
          <View style={estilos.linhaTopo}>
            <BotaoIcone icone="fechar" rotulo={t('comum.fechar')} flutuante onPress={() => router.back()} />
            <View style={{ gap: espaco.xs, alignItems: 'flex-end' }}>
              <Chip
                rotulo={t(`story.flash.${flash}`)}
                ativo={flash !== 'off'}
                onPress={() => setFlash((f) => (f === 'off' ? 'auto' : f === 'auto' ? 'on' : 'off'))}
              />
              <Chip
                rotulo={
                  temporizador ? t('story.temporizadorN', { n: temporizador }) : t('story.temporizador')
                }
                ativo={temporizador > 0}
                onPress={() => setTemporizador((x) => (x === 0 ? 3 : x === 3 ? 10 : 0))}
              />
              <Chip rotulo={t('story.grade')} ativo={grade} onPress={() => setGrade((g) => !g)} />
              <Chip
                rotulo={t('story.maosLivres')}
                ativo={maosLivres}
                onPress={() => setMaosLivres((m) => !m)}
              />
            </View>
          </View>
          {grade && (
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              {[1, 2].map((i) => (
                <View
                  key={`v${i}`}
                  style={[estilos.linhaGrade, { left: `${(i * 100) / 3}%`, top: 0, bottom: 0, width: 1 }]}
                />
              ))}
              {[1, 2].map((i) => (
                <View
                  key={`h${i}`}
                  style={[estilos.linhaGrade, { top: `${(i * 100) / 3}%`, left: 0, right: 0, height: 1 }]}
                />
              ))}
            </View>
          )}
          {contagem != null && (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
            >
              <Texto style={estilos.contagem}>{contagem}</Texto>
            </View>
          )}
          <View style={{ alignItems: 'center', gap: espaco.md, paddingBottom: espaco.lg }}>
            {gravando ? (
              <View style={{ alignSelf: 'stretch', gap: 6, paddingHorizontal: espaco.lg }}>
                <View style={estilos.trilhoGravacao}>
                  <View
                    style={[estilos.barraGravacao, { width: `${(segundos / DURACAO_MAX_VIDEO_S) * 100}%` }]}
                  />
                </View>
                <Texto style={estilos.dica}>
                  {t('story.gravandoTempo', { s: segundos, max: DURACAO_MAX_VIDEO_S })}
                </Texto>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row', gap: espaco.xs }}>
                  {([1, 2, 4] as const).map((z) => (
                    <Chip key={z} rotulo={`${z}×`} ativo={zoom === z} onPress={() => setZoom(z)} />
                  ))}
                </View>
                <Texto style={estilos.dica}>
                  {maosLivres ? t('story.dicaMaosLivres') : t('story.dicaCamera')}
                </Texto>
              </>
            )}
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
                onPress={() =>
                  maosLivres
                    ? gravando
                      ? pararVideo()
                      : comTemporizador(() => void comecarVideo())
                    : comTemporizador(() => void foto())
                }
                onLongPress={() => !maosLivres && void comecarVideo()}
                onPressOut={() => !maosLivres && gravando && pararVideo()}
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
      <View
        style={{ flex: 1 }}
        onLayout={(e) => setCena({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        <StoryCena
          c={conteudo}
          aoMoverTexto={(id, dx, dy) =>
            setConteudo((c) =>
              c ? { ...c, textos: c.textos.map((x) => (x.id === id ? moverTexto(x, dx, dy) : x)) } : c,
            )
          }
        />
        {desenhando && cena.w > 0 && (
          <QuadroDesenho
            key={`${corTraco}-${espessura}-${cena.w}-${cena.h}`}
            cor={corTraco}
            espessura={espessura}
            largura={cena.w}
            altura={cena.h}
            aoTerminar={(d) =>
              setConteudo((c) =>
                c ? { ...c, tracos: [...(c.tracos ?? []), { d, cor: corTraco, espessura }] } : c,
              )
            }
          />
        )}
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: espaco.xs }}
          >
            {(['filtros', 'texto', 'desenho', 'selos', 'interativos'] as const).map((a) => (
              <Chip
                key={a}
                rotulo={t(`story.abas.${a}`)}
                ativo={aba === a}
                onPress={() => {
                  setAba(a);
                  setDesenhando(a === 'desenho');
                }}
              />
            ))}
          </ScrollView>
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

        {aba === 'filtros' && conteudo.tipo === 'video' && (
          <View style={{ flexDirection: 'row', gap: espaco.xs }}>
            {velocidades.map((v) => (
              <Chip
                key={v}
                rotulo={t('story.velocidade', { v: String(v).replace('.', ',') })}
                ativo={(conteudo.velocidade ?? 1) === v}
                onPress={() => setConteudo((c) => (c ? { ...c, velocidade: v as Velocidade } : c))}
              />
            ))}
          </View>
        )}

        {aba === 'desenho' && (
          <View style={{ gap: espaco.xs }}>
            <Texto variante="pequeno">{t('story.desenheExplica')}</Texto>
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
                  accessibilityState={{ selected: corTraco === c }}
                  onPress={() => setCorTraco(c)}
                  style={[
                    estilos.bolinha,
                    { backgroundColor: c, borderColor: corTraco === c ? cores.acao : cores.linha },
                  ]}
                />
              ))}
              {([6, 10, 18] as const).map((e, i) => (
                <Chip
                  key={e}
                  rotulo={t(`story.tamanhos.${(['p', 'm', 'g'] as const)[i]}`)}
                  ativo={espessura === e}
                  onPress={() => setEspessura(e)}
                />
              ))}
              <Chip
                rotulo={t('story.desfazer')}
                onPress={() => setConteudo((c) => (c ? { ...c, tracos: (c.tracos ?? []).slice(0, -1) } : c))}
              />
            </ScrollView>
          </View>
        )}

        {aba === 'interativos' && (
          <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={{ gap: espaco.xs }}>
            <Texto variante="rotulo">{t('story.interativos.enquete')}</Texto>
            <TextInput
              value={enquete.pergunta}
              onChangeText={(v) => setEnquete((e) => ({ ...e, pergunta: v.slice(0, 60) }))}
              placeholder={t('story.interativos.perguntaEnquete')}
              placeholderTextColor={cores.textoSec}
              accessibilityLabel={t('story.interativos.perguntaEnquete')}
              style={[estilos.campo, { color: cores.texto, borderColor: cores.linha }]}
            />
            <View style={{ flexDirection: 'row', gap: espaco.xs }}>
              {(['a', 'b'] as const).map((k) => (
                <TextInput
                  key={k}
                  value={enquete[k]}
                  onChangeText={(v) => setEnquete((e) => ({ ...e, [k]: v.slice(0, 20) }))}
                  placeholder={t(`story.interativos.opcao${k.toUpperCase()}`)}
                  placeholderTextColor={cores.textoSec}
                  accessibilityLabel={t(`story.interativos.opcao${k.toUpperCase()}`)}
                  style={[estilos.campo, { color: cores.texto, borderColor: cores.linha }]}
                />
              ))}
            </View>
            <Botao
              titulo={t('story.interativos.porEnquete')}
              variante="secundario"
              desativado={!enquete.pergunta.trim() || !enquete.a.trim() || !enquete.b.trim()}
              onPress={() => {
                setConteudo((c) =>
                  c
                    ? {
                        ...c,
                        interativos: [
                          ...(c.interativos ?? []),
                          {
                            tipo: 'enquete',
                            pergunta: enquete.pergunta.trim(),
                            opcoes: [enquete.a.trim(), enquete.b.trim()],
                          },
                        ],
                      }
                    : c,
                );
                setEnquete({ pergunta: '', a: '', b: '' });
              }}
            />
            <Texto variante="rotulo">{t('story.interativos.pergunta')}</Texto>
            <View style={{ flexDirection: 'row', gap: espaco.xs }}>
              <TextInput
                value={pergunta}
                onChangeText={(v) => setPergunta(v.slice(0, 60))}
                placeholder={t('story.interativos.perguntaTexto')}
                placeholderTextColor={cores.textoSec}
                accessibilityLabel={t('story.interativos.perguntaTexto')}
                style={[estilos.campo, { color: cores.texto, borderColor: cores.linha }]}
              />
              <Botao
                titulo={t('story.adicionarTexto')}
                desativado={!pergunta.trim()}
                onPress={() => {
                  setConteudo((c) =>
                    c
                      ? {
                          ...c,
                          interativos: [
                            ...(c.interativos ?? []),
                            { tipo: 'pergunta', texto: pergunta.trim() },
                          ],
                        }
                      : c,
                  );
                  setPergunta('');
                }}
              />
            </View>
            <Texto variante="rotulo">{t('story.interativos.contagem')}</Texto>
            <TextInput
              value={contagemTitulo}
              onChangeText={(v) => setContagemTitulo(v.slice(0, 40))}
              placeholder={t('story.interativos.contagemTitulo')}
              placeholderTextColor={cores.textoSec}
              accessibilityLabel={t('story.interativos.contagemTitulo')}
              style={[estilos.campo, { color: cores.texto, borderColor: cores.linha }]}
            />
            <View style={{ flexDirection: 'row', gap: espaco.xs }}>
              {[1, 7, 30].map((n) => (
                <Chip
                  key={n}
                  rotulo={t('story.interativos.emDias', { n })}
                  onPress={() => {
                    if (!contagemTitulo.trim()) return;
                    const data = new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
                    setConteudo((c) =>
                      c
                        ? {
                            ...c,
                            interativos: [
                              ...(c.interativos ?? []),
                              { tipo: 'contagem', titulo: contagemTitulo.trim(), data },
                            ],
                          }
                        : c,
                    );
                    setContagemTitulo('');
                  }}
                />
              ))}
            </View>
            {!!conteudo.interativos?.length && (
              <Chip
                rotulo={t('story.interativos.remover')}
                onPress={() =>
                  setConteudo((c) => (c ? { ...c, interativos: (c.interativos ?? []).slice(0, -1) } : c))
                }
              />
            )}
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
          desativado={enviando}
          onPress={() => {
            setEnviando(true);
            Promise.resolve(publicarStory(conteudo))
              .then(() => router.back())
              .catch(() => {
                setEnviando(false);
                avisar(t('feed.erroAcao'));
              });
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
  linhaGrade: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.45)' },
  contagem: {
    color: '#FFFFFF',
    fontFamily: fontes.titulo,
    fontSize: 120,
    textShadowColor: '#000',
    textShadowRadius: 12,
  },
  trilhoGravacao: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  barraGravacao: { height: 6, backgroundColor: '#C62828' },
});
