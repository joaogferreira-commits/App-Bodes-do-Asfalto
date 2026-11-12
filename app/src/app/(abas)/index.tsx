import { Camera, Map, Marker, type CameraRef, type MapRef } from '@maplibre/maplibre-react-native';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MarcadorAgape } from '@/componentes/MarcadorAgape';
import { agapeExemplo } from '@/dados/agape';
import { useAgapes, type Agape } from '@/estado/agapes';
import { filtrar, lugaresExemplo, type Filtro } from '@/dados/exemplos';
import { CamadaLugares } from '@/componentes/CamadaLugares';
import { ZOOM_MINIMO_IRMAOS } from '@/map/lugares';
import { useViagem } from '@/estado/viagem';
import { useEstiloMapa } from '@/map/estilos';
import { postoExemplo } from '@/navegacao/destinos';
import { espaco, raios, sombra, useCores, useEstilos, type NomeCor, type Paleta } from '@/theme';
import { Avatar, Botao, BotaoIcone, Chip, Icone, PainelInferior, pinos, Texto } from '@/ui';

const CUIABA: [number, number] = [-56.0861, -15.5895];

const filtros: { chave: Filtro; cor?: NomeCor }[] = [
  { chave: 'tudo' },
  { chave: 'irmaos', cor: 'acao' },
  { chave: 'postos', cor: 'verdePosto' },
  { chave: 'sedes', cor: 'ouro' },
  { chave: 'lojas', cor: 'azulRio' },
];

function LinhaLegenda({ terra, rota, texto }: { terra?: boolean; rota?: boolean; texto: string }) {
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const cor = rota ? cores.acao : terra ? cores.terra : cores.asfalto;
  return (
    <View style={estilos.linhaLegenda}>
      <View style={[estilos.amostra, { backgroundColor: terra && !rota ? cores.terraEscura : cor }]}>
        {terra && (
          <View style={estilos.tracejado}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[estilos.traco, { backgroundColor: rota ? cores.rotaTerra : cores.terra }]}
              />
            ))}
          </View>
        )}
      </View>
      <Texto variante="pequeno" style={{ color: cores.texto }}>
        {texto}
      </Texto>
    </View>
  );
}

export default function Mapa() {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const estiloMapa = useEstiloMapa();
  const mapa = useRef<MapRef>(null);
  const camera = useRef<CameraRef>(null);
  const [filtro, setFiltro] = useState<Filtro>('tudo');
  const [legenda, setLegenda] = useState(false);
  const [recolhido, setRecolhido] = useState(false);
  const [zoomAtual, setZoomAtual] = useState(11);
  const { definirDestino, definirBateVolta } = useViagem();
  const { lugares, irmaos } = useMemo(() => filtrar(filtro), [filtro]);
  const contagem = {
    irmaos: irmaos.length,
    sedes: lugares.filter((l) => l.tipo === 'sede').length,
    pontos: lugares.length,
  };

  const irParaMim = async () => {
    const { granted } = await Location.requestForegroundPermissionsAsync().catch(() => ({ granted: false }));
    if (!granted) return;
    const p = await Location.getCurrentPositionAsync({}).catch(() => null);
    if (p)
      camera.current?.flyTo({ center: [p.coords.longitude, p.coords.latitude], zoom: 13, duration: 900 });
  };

  /** Zoom por botão (R24): todo gesto tem um botão equivalente. */
  const zoom = async (delta: number) => {
    const atual = await mapa.current?.getZoom().catch(() => null);
    if (atual != null) camera.current?.zoomTo(atual + delta, { duration: 250 });
  };

  const { agapes } = useAgapes();
  const verAgape = (ag: Agape = agapeExemplo) => {
    camera.current?.flyTo({ center: [ag.lng, ag.lat], zoom: 14, duration: 800 });
    Alert.alert(
      t('feed.agapeEm', { local: ag.local }),
      `${ag.texto}\n\n${t('feed.agapeHora', { hora: ag.horario })}\n${t('feed.vaoN', { n: ag.vao.length })}`,
    );
  };

  /** Toque num emblema: nome e opção de traçar rota até ele. */
  const tocarLugar = (id: string) => {
    const l = lugaresExemplo.find((x) => x.id === id);
    if (!l) return;
    Alert.alert(l.nome, l.rotulo ?? undefined, [
      { text: t('comum.cancelar'), style: 'cancel' },
      {
        text: t('ferramentas.rotaAte', { lugar: l.nome }),
        onPress: () => {
          definirBateVolta(null);
          definirDestino({ chave: 'busca', nome: l.nome, posicao: { lat: l.lat, lng: l.lng } });
          router.push('/rota');
        },
      },
    ]);
  };

  const irAoPosto = () => {
    definirDestino(postoExemplo);
    router.push('/rota');
  };

  return (
    <View style={estilos.tela}>
      <Map
        ref={mapa}
        style={StyleSheet.absoluteFill}
        mapStyle={estiloMapa}
        onRegionDidChange={(e) => setZoomAtual(e.nativeEvent.zoom)}
        logo={false}
        attribution
        attributionPosition={{ bottom: recolhido ? 90 : 330, left: 8 }}
      >
        <Camera ref={camera} initialViewState={{ center: CUIABA, zoom: 11 }} />
        <CamadaLugares
          lugares={lugares}
          aoTocarLugar={tocarLugar}
          aoTocarGrupo={(centro, z) =>
            camera.current?.flyTo({ center: centro, zoom: z + 0.5, duration: 600 })
          }
        />
        {/* Ágape Relâmpago: sempre visível, por cima dos outros, flutuando */}
        {agapes.map((ag) => (
          <Marker key={ag.id} id={ag.id} lngLat={[ag.lng, ag.lat]} anchor="bottom">
            <MarcadorAgape comecaEm={ag.comecaEm} local={ag.local} onPress={() => verAgape(ag)} />
          </Marker>
        ))}
        {zoomAtual >= ZOOM_MINIMO_IRMAOS &&
          irmaos.map((i) => (
            <Marker key={i.id} id={i.id} lngLat={[i.lng, i.lat]}>
              <Avatar nome={i.nome} status={i.status} tamanho={44} />
            </Marker>
          ))}
      </Map>

      <SafeAreaView edges={['top']} style={estilos.topo} pointerEvents="box-none">
        <View style={estilos.linhaBusca}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('mapa.busca')}
            onPress={() => router.push('/busca')}
            style={estilos.busca}
          >
            <Icone nome="busca" tamanho={20} cor={cores.textoSec} />
            <Texto style={{ color: cores.textoSec, fontSize: 16 }}>{t('mapa.busca')}</Texto>
          </Pressable>
          <BotaoIcone
            icone="grade"
            corIcone={cores.acao}
            rotulo={t('mapa.ferramentas')}
            flutuante
            onPress={() => router.push('/ferramentas')}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('mapa.meuPerfil')}
            onPress={() => router.navigate('/perfil')}
            style={estilos.botaoPerfil}
          >
            <Avatar nome="Irmão Teste" status="aberto" tamanho={34} />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.filtros}>
          {filtros.map((f) => (
            <Chip
              key={f.chave}
              rotulo={t(`mapa.filtros.${f.chave}`)}
              corPonto={f.cor ? cores[f.cor] : undefined}
              ativo={filtro === f.chave}
              onPress={() => setFiltro(f.chave)}
            />
          ))}
        </ScrollView>
        <View style={estilos.lateral} pointerEvents="box-none">
          <BotaoIcone
            icone="visivel"
            corIcone={cores.acao}
            legenda={t('mapa.aprox')}
            legendaAbaixo
            rotulo={t('mapa.visibilidade')}
            flutuante
            onPress={() => Alert.alert(t('mapa.visibilidade'), t('mapa.visibilidadeTexto'))}
          />
          <BotaoIcone
            icone="camadas"
            legenda={t('mapa.legendaCurta')}
            legendaAbaixo
            rotulo={t('mapa.camadas')}
            flutuante
            onPress={() => setLegenda((v) => !v)}
          />
          <BotaoIcone
            icone="localizacao"
            legenda={t('mapa.euCurto')}
            legendaAbaixo
            rotulo={t('mapa.minhaLocalizacao')}
            flutuante
            onPress={irParaMim}
          />
          <View style={estilos.zoom}>
            <BotaoIcone icone="mais" rotulo={t('mapa.aproximar')} flutuante onPress={() => void zoom(1)} />
            <BotaoIcone icone="menos" rotulo={t('mapa.afastar')} flutuante onPress={() => void zoom(-1)} />
          </View>
        </View>
        {legenda && (
          <View style={estilos.legenda} accessibilityLabel={t('mapa.camadas')}>
            <LinhaLegenda texto={t('mapa.legendaAsfalto')} />
            <LinhaLegenda terra texto={t('mapa.legendaTerra')} />
            <LinhaLegenda rota texto={t('mapa.legendaRota')} />
            <LinhaLegenda rota terra texto={t('mapa.legendaRotaTerra')} />
            <Texto variante="pequeno" style={{ maxWidth: 210 }}>
              {t('mapa.dadosExemplo')}
            </Texto>
          </View>
        )}
      </SafeAreaView>

      <PainelInferior
        style={estilos.painel}
        recolhido={recolhido}
        aoAlternar={setRecolhido}
        resumo={
          <View style={estilos.nestaArea}>
            <Texto variante="rotulo">{t('mapa.nestaArea')}</Texto>
            <Texto variante="secundario">{t('mapa.contagem', contagem)}</Texto>
          </View>
        }
      >
        <View style={[estilos.cartaoAgape, { borderColor: cores.ouro }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('mapa.agapeMarcador', {
              local: agapeExemplo.local,
              tempo: agapeExemplo.comecaEm,
            })}
            onPress={() => verAgape()}
            style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}
          >
            <Image
              source={pinos.agape.imagem}
              style={{ width: 40, height: 50 }}
              contentFit="contain"
              accessible={false}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Texto variante="rotulo" style={{ color: cores.ouro }} numberOfLines={1}>
                {t('mapa.agapeRotulo', { tempo: agapeExemplo.comecaEm })}
              </Texto>
              <Texto variante="corpoForte" numberOfLines={1}>
                {t('feed.agapeEm', { local: agapeExemplo.local })}
              </Texto>
              <Texto variante="secundario" numberOfLines={1}>
                {t('feed.vaoN', { n: agapeExemplo.vao.length })}
              </Texto>
            </View>
          </Pressable>
          <Botao
            titulo={t('mapa.vou')}
            onPress={() => Alert.alert(t('comum.emBreve'), t('mapa.agapeTextoAviso'))}
          />
        </View>

        <View style={estilos.postos}>
          <View style={{ flex: 1 }}>
            <Botao
              titulo={t('mapa.postoProximo')}
              variante="secundario"
              icone="posto"
              corIcone={cores.verdePosto}
              onPress={irAoPosto}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Botao
              titulo={t('mapa.postoNaRota')}
              variante="secundario"
              icone="postoRota"
              corIcone={cores.verdePosto}
              onPress={irAoPosto}
            />
          </View>
        </View>
      </PainelInferior>
    </View>
  );
}

const criarEstilos = (cores: Paleta) =>
  StyleSheet.create({
    tela: { flex: 1, backgroundColor: cores.chao },
    topo: { position: 'absolute', top: 0, left: 0, right: 0 },
    linhaBusca: { flexDirection: 'row', gap: 10, paddingHorizontal: espaco.md, paddingTop: espaco.xs },
    busca: {
      flex: 1,
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: espaco.md,
      backgroundColor: cores.sobreMapa,
      borderWidth: 1,
      borderColor: cores.linha,
      borderRadius: raios.botao,
      boxShadow: sombra.flutuante,
    },
    botaoPerfil: {
      width: 48,
      height: 48,
      borderRadius: raios.botao,
      borderWidth: 1,
      borderColor: cores.linha,
      backgroundColor: cores.sobreMapa,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filtros: { gap: espaco.xs, paddingHorizontal: espaco.md, paddingVertical: espaco.sm },
    lateral: { position: 'absolute', right: espaco.md, top: 132, gap: espaco.xs, alignItems: 'flex-end' },
    zoom: { gap: espaco.xxs, marginTop: espaco.xs, alignItems: 'center', width: 64 },
    legenda: {
      alignSelf: 'flex-start',
      marginLeft: espaco.md,
      marginTop: espaco.xs,
      backgroundColor: cores.sobreMapa,
      borderWidth: 1,
      borderColor: cores.linha,
      borderRadius: 12,
      padding: espaco.sm,
      gap: espaco.xs,
    },
    linhaLegenda: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    amostra: { width: 34, height: 7, borderRadius: 4, overflow: 'hidden', justifyContent: 'center' },
    tracejado: { flexDirection: 'row', gap: 4, paddingHorizontal: 2 },
    traco: { width: 5, height: 3, borderRadius: 2 },
    painel: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: espaco.md, gap: 10 },
    nestaArea: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    cartaoAgape: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: espaco.sm,
      backgroundColor: cores.superficie2,
      borderRadius: raios.cartao,
      borderWidth: 1,
      borderColor: cores.linha,
      padding: 14,
    },
    iconeAgape: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: cores.superficie3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    postos: { flexDirection: 'row', gap: 10 },
  });
