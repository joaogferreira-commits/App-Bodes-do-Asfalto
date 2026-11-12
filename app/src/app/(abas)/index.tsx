import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  type CameraRef,
  type MapRef,
} from '@maplibre/maplibre-react-native';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MarcadorAgape } from '@/componentes/MarcadorAgape';
import { agapeExemplo } from '@/dados/agape';
import { useAgapes, type Agape } from '@/estado/agapes';
import { filtrar, irmaosExemplo, lugaresExemplo, todosOsLugares, type Filtro } from '@/dados/exemplos';
import { CamadaLugares } from '@/componentes/CamadaLugares';
import { BotaoSOS } from '@/componentes/BotaoSOS';
import { FichaMapa } from '@/componentes/FichaMapa';
import { useGuardado } from '@/estado/guardado';
import {
  acenar,
  fichaDoAgape,
  fichaDoIrmao,
  fichaDoLugar,
  type AcaoFicha,
  type Ficha,
  type RegistroAcenos,
} from '@/map/fichas';
import { ZOOM_EMBLEMA, ZOOM_MINIMO_IRMAOS } from '@/map/lugares';
import { useViagem } from '@/estado/viagem';
import { useEstiloMapa } from '@/map/estilos';
import { postoExemplo } from '@/navegacao/destinos';
import { espaco, raios, sombra, useCores, useEstilos, type NomeCor, type Paleta } from '@/theme';
import { Avatar, Botao, BotaoIcone, Chip, coresDoStatus, Icone, PainelInferior, pinos, Texto } from '@/ui';

const CUIABA: [number, number] = [-56.0861, -15.5895];

const filtros: { chave: Filtro; cor?: NomeCor }[] = [
  { chave: 'tudo' },
  { chave: 'irmaos', cor: 'acao' },
  { chave: 'postos', cor: 'verdePosto' },
  { chave: 'sedes', cor: 'ouro' },
  { chave: 'lojas', cor: 'azulRio' },
  { chave: 'passeio', cor: 'acao' },
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
  const coresStatus = coresDoStatus(cores);
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

  /**
   * Botão "Eu": antes não dava retorno nenhum quando a permissão era negada ou o GPS demorava.
   * Agora: usa na hora a última posição conhecida, depois refina com o GPS, e avisa se não der.
   */
  const [minhaPosicao, setMinhaPosicao] = useState<[number, number] | null>(null);
  const irParaMim = async () => {
    const { granted } = await Location.requestForegroundPermissionsAsync().catch(() => ({ granted: false }));
    if (!granted) return Alert.alert(t('mapa.semPermissaoTitulo'), t('mapa.semPermissaoTexto'));
    const voar = (lat: number, lng: number) => {
      setMinhaPosicao([lng, lat]);
      camera.current?.flyTo({ center: [lng, lat], zoom: 14, duration: 900 });
    };
    const rapida = await Location.getLastKnownPositionAsync().catch(() => null);
    if (rapida) voar(rapida.coords.latitude, rapida.coords.longitude);
    const precisa = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(
      () => null,
    );
    if (precisa) voar(precisa.coords.latitude, precisa.coords.longitude);
    else if (!rapida) Alert.alert(t('mapa.semGpsTitulo'), t('mapa.semGpsTexto'));
  };

  /** Zoom por botão (R24): todo gesto tem um botão equivalente. */
  const zoom = async (delta: number) => {
    const atual = await mapa.current?.getZoom().catch(() => null);
    if (atual != null) camera.current?.zoomTo(atual + delta, { duration: 250 });
  };

  const { agapes } = useAgapes();
  // Ficha que sobe de baixo ao tocar em qualquer ícone (irmão, posto, sede, Loja, negócio, Ágape…).
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [precos, setPrecos] = useGuardado<Record<string, { valor: string; dia: string }>>('precosPostos', {});
  const [acenos, setAcenos] = useGuardado<RegistroAcenos>('acenos', { dia: '', para: [] });
  const [salvosMapa, setSalvosMapa] = useGuardado<string[]>('lugaresSalvos', []);
  const [vouAgape, setVouAgape] = useGuardado<string[]>('agapesVou', []);
  const hoje = new Date().toISOString().slice(0, 10);

  const abrir = (f: Ficha) => {
    camera.current?.flyTo({ center: [f.posicao.lng, f.posicao.lat], duration: 600 });
    setFicha(f);
  };
  const verAgape = (ag: Agape = agapeExemplo) => abrir(fichaDoAgape(ag));
  const tocarLugar = (id: string) => {
    const l = todosOsLugares().find((x) => x.id === id);
    if (l) abrir(fichaDoLugar(l, precos[l.id]));
  };
  const tocarIrmao = (id: string) => {
    const i = irmaosExemplo.find((x) => x.id === id);
    if (i) abrir(fichaDoIrmao(i));
  };

  const feitas: AcaoFicha[] = !ficha
    ? []
    : [
        ...(acenos.dia === hoje && acenos.para.includes(ficha.id) ? (['acenar'] as const) : []),
        ...(salvosMapa.includes(ficha.id) ? (['salvar'] as const) : []),
        ...(vouAgape.includes(ficha.id) ? (['vou'] as const) : []),
      ];

  const agir = (acao: AcaoFicha, extra?: string) => {
    if (!ficha) return;
    switch (acao) {
      case 'rota':
        setFicha(null);
        definirBateVolta(null);
        definirDestino({ chave: 'busca', nome: ficha.titulo, posicao: ficha.posicao });
        router.push('/rota');
        return;
      case 'acenar': {
        const novo = acenar(acenos, ficha.id, hoje);
        if (!novo) {
          if (!acenos.para.includes(ficha.id)) Alert.alert(t('ficha.limiteAcenos'));
          return;
        }
        setAcenos(novo);
        Alert.alert(t('ficha.acenoEnviado', { nome: ficha.titulo }), t('ficha.acenoExplica'));
        return;
      }
      case 'perfil':
      case 'falarContato':
        Alert.alert(t('comum.emBreve'), t(`ficha.emBreve.${acao}`));
        return;
      case 'informarPreco':
        if (extra) {
          const dia = new Date().toLocaleDateString('pt-BR');
          setPrecos((p) => ({ ...p, [ficha.id]: { valor: extra, dia } }));
          const l = lugaresExemplo.find((x) => x.id === ficha.id);
          if (l) setFicha(fichaDoLugar(l, { valor: extra, dia }));
        }
        return;
      case 'vitrine':
        setFicha(null);
        router.push(ficha.negocio ? `/negocios/${ficha.negocio}` : '/negocios');
        return;
      case 'site':
        if (ficha.link) void Linking.openURL(ficha.link);
        return;
      case 'salvar':
        setSalvosMapa((l) => (l.includes(ficha.id) ? l.filter((x) => x !== ficha.id) : [...l, ficha.id]));
        return;
      case 'vou':
        setVouAgape((l) => (l.includes(ficha.id) ? l.filter((x) => x !== ficha.id) : [...l, ficha.id]));
        return;
    }
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
            <MarcadorAgape
              comecaEm={ag.comecaEm}
              local={ag.local}
              compacto={zoomAtual < ZOOM_EMBLEMA}
              onPress={() => verAgape(ag)}
            />
          </Marker>
        ))}
        {minhaPosicao && (
          <Marker id="eu" lngLat={minhaPosicao}>
            <View
              accessible
              accessibilityLabel={t('mapa.voceEstaAqui')}
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: cores.estrada,
                borderWidth: 4,
                borderColor: cores.texto,
                boxShadow: '0px 0px 0px 8px rgba(111,149,184,0.3)',
              }}
            />
          </Marker>
        )}
        {/* De longe, cada irmão vira um ponto com a cor do status (não some e não polui o mapa). */}
        <GeoJSONSource
          id="irmaos-pontos"
          data={
            {
              type: 'FeatureCollection',
              features: irmaos.map((i) => ({
                type: 'Feature',
                id: i.id,
                properties: { id: i.id, cor: coresStatus[i.status] },
                geometry: { type: 'Point', coordinates: [i.lng, i.lat] },
              })),
            } as never
          }
          onPress={(e) => {
            const id = (e as unknown as { nativeEvent?: { features?: { properties?: { id?: string } }[] } })
              .nativeEvent?.features?.[0]?.properties?.id;
            if (id) tocarIrmao(id);
          }}
        >
          <Layer
            id="irmaos-ponto"
            type="circle"
            maxzoom={ZOOM_MINIMO_IRMAOS}
            paint={{
              'circle-color': ['get', 'cor'],
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 3, 8, 6],
              'circle-stroke-color': cores.fundo,
              'circle-stroke-width': 1.5,
            }}
          />
        </GeoJSONSource>
        {zoomAtual >= ZOOM_MINIMO_IRMAOS &&
          irmaos.map((i) => (
            <Marker key={i.id} id={i.id} lngLat={[i.lng, i.lat]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('ficha.abrirIrmao', { nome: i.nome })}
                hitSlop={8}
                onPress={() => tocarIrmao(i.id)}
              >
                <Avatar nome={i.nome} status={i.status} tamanho={44} />
              </Pressable>
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
          <BotaoSOS flutuante />
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
      <FichaMapa
        ficha={ficha}
        status={irmaosExemplo.find((i) => i.id === ficha?.id)?.status}
        feitas={feitas}
        aoFechar={() => setFicha(null)}
        aoAgir={agir}
      />
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
