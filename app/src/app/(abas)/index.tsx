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
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MarcadorAgape } from '@/componentes/MarcadorAgape';
import { agapeExemplo } from '@/dados/agape';
import { useAgapes, type Agape } from '@/estado/agapes';
import { filtrarLugares, irmaosExemplo, lugaresExemplo, todosOsLugares, type Filtro } from '@/dados/exemplos';
import { mesclarPontos } from '@/map/pontos';
import { usePontosDoBanco } from '@/map/usePontosDoBanco';
import { useIrmaosAoVivo } from '@/map/useIrmaosAoVivo';
import { usePublicarPosicao } from '@/map/usePublicarPosicao';
import type { Area } from '@/servidor/pontos';
import { CamadaLugares } from '@/componentes/CamadaLugares';
import { BotaoSOS } from '@/componentes/BotaoSOS';
import { alturasFolha, FolhaDeslizante, type NivelFolha } from '@/componentes/FolhaDeslizante';
import { FolhaMais, gruposMais } from '@/componentes/FolhaMais';
import { FichaMapa } from '@/componentes/FichaMapa';
import { SeletorVisibilidade } from '@/componentes/SeletorVisibilidade';
import { useVisibilidadeMapa } from '@/estado/visibilidadeMapa';
import { useAcessoOpcional } from '@/acesso/acesso';
import { avisarResultadoAceno, enviarAceno } from '@/estado/avisoAceno';
import { useGuardado } from '@/estado/guardado';
import { servidorConfigurado } from '@/servidor/supabase';
import {
  acenar,
  fichaDoAgape,
  fichaDoIrmao,
  fichaDoIrmaoAoVivo,
  fichaDoLugar,
  type AcaoFicha,
  type Ficha,
  type RegistroAcenos,
} from '@/map/fichas';
import { tamanhoAvatarNoMapa, ZOOM_EMBLEMA, ZOOM_MINIMO_IRMAOS } from '@/map/lugares';
import { agapeRelevante, centroDaArea, distanciaKm } from '@/map/areaMapa';
import { usePasseios } from '@/servidor/usePasseios';
import { responderAgape as responderAgapeNoServidor } from '@/servidor/agapes';
import { useViagem } from '@/estado/viagem';
import { useEstiloMapa } from '@/map/estilos';
import { useModoMapaAutomatico } from '@/map/temaMapa';
import { useBloqueioEmMovimento } from '@/seguranca/useBloqueioEmMovimento';
import { avisar } from '@/ui/dialogo';
import { postoExemplo } from '@/navegacao/destinos';
import { espaco, raios, sombra, useCores, useEstilos, useTema, type NomeCor, type Paleta } from '@/theme';
import { Avatar, Botao, BotaoIcone, Chip, coresDoStatus, Icone, pinos, Texto } from '@/ui';

const CUIABA: [number, number] = [-56.0861, -15.5895];

const filtros: { chave: Filtro; cor?: NomeCor }[] = [
  { chave: 'tudo' },
  { chave: 'irmaos', cor: 'acao' },
  { chave: 'postos', cor: 'verdePosto' },
];

const AREA_INICIAL: Area = { minLon: -56.24, minLat: -15.75, maxLon: -55.94, maxLat: -15.45 };

/** Id do ponto tocado numa camada GeoJSON. */
function idTocado(e: unknown): string | undefined {
  return (e as { nativeEvent?: { features?: { properties?: { id?: string } }[] } }).nativeEvent?.features?.[0]
    ?.properties?.id;
}

export default function Mapa() {
  const { t } = useTranslation();
  const cores = useCores();
  const { modo } = useTema();
  const coresStatus = coresDoStatus(cores);
  const estilos = useEstilos(criarEstilos);
  const mapa = useRef<MapRef>(null);
  const camera = useRef<CameraRef>(null);
  const [filtro, setFiltro] = useState<Filtro>('tudo');
  const [maisAberto, setMaisAberto] = useState(false);
  const [nivel, setNivel] = useState<NivelFolha>(0);
  const { height: alturaTela } = useWindowDimensions();
  const alturas = alturasFolha(alturaTela);
  const [altura] = useState(() => new Animated.Value(alturas[0]));
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);
  const [seletorAberto, setSeletorAberto] = useState(false);
  const visibilidade = useVisibilidadeMapa();
  const [zoomAtual, setZoomAtual] = useState(11);
  const { definirDestino, definirBateVolta } = useViagem();
  /**
   * Botão "Eu": antes não dava retorno nenhum quando a permissão era negada ou o GPS demorava.
   * Agora: usa na hora a última posição conhecida, depois refina com o GPS, e avisa se não der.
   */
  const [minhaPosicao, setMinhaPosicao] = useState<[number, number] | null>(null);
  // Dia/noite automático pelo sol (só se o tema do app está em "auto"); pilotando (em movimento, sem
  // liberação de garupa) esconde as camadas extras do estilo.
  const { preferencia } = useTema();
  const modoAuto = useModoMapaAutomatico(
    minhaPosicao ? { lat: minhaPosicao[1], lon: minhaPosicao[0] } : null,
    preferencia === 'auto',
  );
  const pilotando = useBloqueioEmMovimento();
  const estiloMapa = useEstiloMapa(modoAuto, pilotando);
  const irParaMim = async () => {
    const { granted } = await Location.requestForegroundPermissionsAsync().catch(() => ({ granted: false }));
    if (!granted) return avisar(t('mapa.semPermissaoTitulo'), t('mapa.semPermissaoTexto'));
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
    else if (!rapida) avisar(t('mapa.semGpsTitulo'), t('mapa.semGpsTexto'));
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
  const [agapesDispensados, setAgapesDispensados] = useGuardado<string[]>('agapesDispensados', []);
  const dispensarAgape = (id: string) => setAgapesDispensados((l) => (l.includes(id) ? l : [...l, id]));
  const responderAgape = (id: string, vou: boolean) => {
    setVouAgape((l) => (vou ? (l.includes(id) ? l : [...l, id]) : l.filter((x) => x !== id)));
    dispensarAgape(id);
    // Ágape de verdade (id do banco): grava a presença e o grupo do Ágape acompanha.
    if (/^[0-9a-f-]{36}$/.test(id)) void responderAgapeNoServidor(id, vou);
  };
  const hoje = new Date().toISOString().slice(0, 10);
  const acesso = useAcessoOpcional();
  const { passeios: passeiosDaAgenda } = usePasseios();
  const chatNoServidor = servidorConfigurado && acesso?.modo === 'supabase' && acesso.estado === 'membro';

  // Pontos do banco (OpenStreetMap) para a área visível, juntos com os que já vêm no app.
  const [area, setArea] = useState<Area>(AREA_INICIAL);
  const doBanco = usePontosDoBanco(chatNoServidor, area, zoomAtual);
  const todos = useMemo(() => mesclarPontos(todosOsLugares(), doBanco), [doBanco]);
  const lugares = useMemo(() => filtrarLugares(todos, filtro), [todos, filtro]);
  // Servidor + membro aprovado: irmãos de verdade (o servidor decide o que cada um mostra). Exemplos só no modo local.
  const irmaosReais = useIrmaosAoVivo(chatNoServidor, area);
  usePublicarPosicao(chatNoServidor, visibilidade.estado);
  const fonteIrmaos = chatNoServidor ? irmaosReais : irmaosExemplo;
  const irmaos = filtro === 'tudo' || filtro === 'irmaos' ? fonteIrmaos : [];
  const noArea = (p: { lat: number; lng: number }) =>
    p.lng >= area.minLon && p.lng <= area.maxLon && p.lat >= area.minLat && p.lat <= area.maxLat;
  const contagem = {
    irmaos: irmaos.filter(noArea).length,
    postos: lugares.filter((l) => l.tipo === 'posto' && noArea(l)).length,
  };
  const referencia = minhaPosicao ? { lat: minhaPosicao[1], lng: minhaPosicao[0] } : centroDaArea(area);
  const irmaosPerto = [...irmaos]
    .map((i) => ({ i, km: distanciaKm(referencia, i) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 20);
  const proximoPasseio = passeiosDaAgenda.find((p) => p.quando === 'proximos');
  const agapeBanner = agapes.find(
    (ag) => !agapesDispensados.includes(ag.id) && agapeRelevante(ag, referencia, agora),
  );

  const abrir = (f: Ficha) => {
    camera.current?.flyTo({ center: [f.posicao.lng, f.posicao.lat], duration: 600 });
    setFicha(f);
  };
  const verAgape = (ag: Agape = agapeExemplo) => abrir(fichaDoAgape(ag));
  const tocarLugar = (id: string) => {
    const l = todos.find((x) => x.id === id);
    if (l) abrir(fichaDoLugar(l, precos[l.id]));
  };
  const tocarIrmao = (id: string) => {
    if (chatNoServidor) {
      const r = irmaosReais.find((x) => x.id === id);
      if (r) abrir(fichaDoIrmaoAoVivo(r));
      return;
    }
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
        if (chatNoServidor) {
          const { id, titulo } = ficha;
          void enviarAceno(id).then(
            (r) => avisarResultadoAceno(r, titulo, t),
            () => avisarResultadoAceno('erro', titulo, t),
          );
          return;
        }
        const novo = acenar(acenos, ficha.id, hoje);
        if (!novo) {
          if (!acenos.para.includes(ficha.id)) avisar(t('ficha.limiteAcenos'));
          return;
        }
        setAcenos(novo);
        avisar(t('ficha.acenoEnviado', { nome: ficha.titulo }), t('ficha.acenoExplica'));
        return;
      }
      case 'perfil':
      case 'falarContato':
        avisar(t('comum.emBreve'), t(`ficha.emBreve.${acao}`));
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
      case 'telefone':
        if (ficha.telefone) void Linking.openURL(`tel:${ficha.telefone.replace(/[^\d+]/g, '')}`);
        return;
      case 'salvar':
        setSalvosMapa((l) => (l.includes(ficha.id) ? l.filter((x) => x !== ficha.id) : [...l, ficha.id]));
        return;
      case 'vou': {
        const jaVou = vouAgape.includes(ficha.id);
        setVouAgape((l) => (l.includes(ficha.id) ? l.filter((x) => x !== ficha.id) : [...l, ficha.id]));
        if (/^[0-9a-f-]{36}$/.test(ficha.id)) void responderAgapeNoServidor(ficha.id, !jaVou);
        return;
      }
    }
  };

  const grupoMais = gruposMais.find((g) => g.chave === filtro);
  const irAoPosto = () => {
    definirDestino(postoExemplo);
    router.push('/rota');
  };

  const cartaoAgape = agapeBanner && (
    <View style={[estilos.cartaoAgape, { borderColor: cores.ouro }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('mapa.agapeMarcador', {
          local: agapeBanner.local,
          tempo: agapeBanner.comecaEm,
        })}
        onPress={() => verAgape(agapeBanner)}
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
            {t('mapa.agapeRotulo', { tempo: agapeBanner.comecaEm })}
          </Texto>
          <Texto variante="corpoForte" numberOfLines={1}>
            {t('feed.agapeEm', { local: agapeBanner.local })}
          </Texto>
          <Texto variante="secundario" numberOfLines={1}>
            {t('feed.vaoN', { n: agapeBanner.vao.length })}
          </Texto>
        </View>
      </Pressable>
      <View style={{ gap: espaco.xs }}>
        <Botao titulo={t('mapa.vou')} onPress={() => responderAgape(agapeBanner.id, true)} />
        <Botao
          titulo={t('mapa.naoVou')}
          variante="secundario"
          onPress={() => responderAgape(agapeBanner.id, false)}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('mapa.agapeFechar')}
        hitSlop={8}
        onPress={() => dispensarAgape(agapeBanner.id)}
        style={estilos.fecharAgape}
      >
        <Icone nome="fechar" tamanho={20} cor={cores.textoSec} />
      </Pressable>
    </View>
  );

  return (
    <View style={estilos.tela}>
      <Map
        ref={mapa}
        style={StyleSheet.absoluteFill}
        mapStyle={estiloMapa}
        onRegionDidChange={(e) => {
          setZoomAtual(e.nativeEvent.zoom);
          const [minLon, minLat, maxLon, maxLat] = e.nativeEvent.bounds ?? [];
          if (minLon != null && minLat != null && maxLon != null && maxLat != null)
            setArea({ minLon, minLat, maxLon, maxLat });
        }}
        logo={false}
        attribution
        attributionPosition={{ bottom: alturas[nivel] + 8, left: 8 }}
      >
        <Camera ref={camera} initialViewState={{ center: CUIABA, zoom: 11 }} />
        <CamadaLugares
          lugares={lugares}
          area={area}
          aoTocarLugar={tocarLugar}
          aoTocarGrupo={(centro, z) =>
            camera.current?.flyTo({ center: centro, zoom: z + 0.5, duration: 600 })
          }
        />
        {/* Ágape Relâmpago: de longe vira ponto dourado (como os outros pinos); de perto, emblema flutuante.
            Toques passam pela camada do mapa (Marker com Pressable não recebe toque no MapLibre Android). */}
        <GeoJSONSource
          id="agapes-pontos"
          data={
            {
              type: 'FeatureCollection',
              features: agapes.map((ag) => ({
                type: 'Feature',
                id: ag.id,
                properties: { id: ag.id },
                geometry: { type: 'Point', coordinates: [ag.lng, ag.lat] },
              })),
            } as never
          }
          onPress={(e) => {
            const id = idTocado(e);
            const ag = agapes.find((a) => a.id === id);
            if (ag) verAgape(ag);
          }}
        >
          <Layer
            id="agapes-ponto"
            type="circle"
            maxzoom={ZOOM_EMBLEMA}
            paint={{
              'circle-color': cores.ouro,
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 4, ZOOM_EMBLEMA, 7] as never,
              'circle-stroke-color': cores.fundo,
              'circle-stroke-width': 1.5,
            }}
          />
          <Layer
            id="agapes-toque"
            type="circle"
            minzoom={ZOOM_EMBLEMA}
            paint={{
              'circle-color': cores.ouro,
              'circle-opacity': 0.01,
              'circle-radius': 34,
              'circle-translate': [0, -40],
            }}
          />
        </GeoJSONSource>
        {zoomAtual >= ZOOM_EMBLEMA &&
          agapes.map((ag) => (
            <Marker key={ag.id} id={ag.id} lngLat={[ag.lng, ag.lat]} anchor="bottom">
              <View pointerEvents="none">
                <MarcadorAgape comecaEm={ag.comecaEm} local={ag.local} onPress={() => verAgape(ag)} />
              </View>
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
            const id = idTocado(e);
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
          {/* Área de toque invisível sobre os avatares (de perto, os avatares não recebem toque). */}
          <Layer
            id="irmaos-toque"
            type="circle"
            minzoom={ZOOM_MINIMO_IRMAOS}
            paint={{ 'circle-color': cores.fundo, 'circle-opacity': 0.01, 'circle-radius': 28 }}
          />
        </GeoJSONSource>
        {zoomAtual >= ZOOM_MINIMO_IRMAOS &&
          irmaos.map((i) => (
            <Marker key={i.id} id={i.id} lngLat={[i.lng, i.lat]}>
              <View pointerEvents="none">
                <Avatar
                  nome={i.nome}
                  status={i.status}
                  tamanho={tamanhoAvatarNoMapa(zoomAtual)}
                  contornoBranco={modo === 'sol'}
                />
              </View>
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
          <Chip
            rotulo={t(grupoMais ? `mapa.filtros.${filtro}` : 'mapa.maisChip')}
            corPonto={grupoMais ? cores[grupoMais.cor] : undefined}
            ativo={!!grupoMais}
            onPress={() => setMaisAberto(true)}
          />
        </ScrollView>
        <View style={estilos.lateral} pointerEvents="box-none">
          <BotaoIcone
            icone="visivel"
            corIcone={cores.acao}
            legenda={t(`mapa.visib.curto.${visibilidade.modo}`)}
            legendaAbaixo
            rotulo={t('mapa.visibilidade')}
            flutuante
            onPress={() => setSeletorAberto(true)}
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
      </SafeAreaView>

      <Animated.View style={[estilos.sos, { bottom: Animated.add(altura, 12) }]} pointerEvents="box-none">
        <BotaoSOS flutuante />
      </Animated.View>
      {cartaoAgape && nivel === 0 && (
        <Animated.View style={[estilos.bannerAgape, { bottom: Animated.add(altura, 84) }]}>
          {cartaoAgape}
        </Animated.View>
      )}
      <FolhaDeslizante
        altura={altura}
        alturas={alturas}
        nivel={nivel}
        aoMudarNivel={setNivel}
        resumo={
          <View style={estilos.resumo}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Texto variante="corpoForte" numberOfLines={2}>
                {t('mapa.nestaAreaResumo', contagem)}
              </Texto>
            </View>
            <Botao
              titulo={t('mapa.postoProximo')}
              variante="secundario"
              icone="posto"
              corIcone={cores.verdePosto}
              onPress={irAoPosto}
            />
          </View>
        }
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: espaco.sm }}>
          {cartaoAgape}
          <Texto variante="rotulo">{t('mapa.irmaosPerto')}</Texto>
          {irmaosPerto.length === 0 && <Texto variante="secundario">{t('mapa.semIrmaos')}</Texto>}
          {irmaosPerto.map(({ i, km }) => (
            <Pressable
              key={i.id}
              accessibilityRole="button"
              accessibilityLabel={i.nome}
              onPress={() => {
                setNivel(0);
                altura.setValue(alturas[0]);
                tocarIrmao(i.id);
              }}
              style={estilos.linhaIrmao}
            >
              <Avatar nome={i.nome} status={i.status} tamanho={36} />
              <Texto variante="corpoForte" style={{ flex: 1 }} numberOfLines={1}>
                {i.nome}
              </Texto>
              <Texto variante="secundario">{`${km.toFixed(km < 10 ? 1 : 0)} km`}</Texto>
            </Pressable>
          ))}
          {proximoPasseio && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={proximoPasseio.titulo}
              onPress={() => router.navigate('/passeios')}
              style={estilos.cartaoPasseio}
            >
              <Texto variante="rotulo">{t('mapa.proximoEvento')}</Texto>
              <Texto variante="corpoForte" numberOfLines={1}>
                {proximoPasseio.titulo}
              </Texto>
              <Texto variante="secundario" numberOfLines={1}>
                {`${proximoPasseio.dia} · ${proximoPasseio.hora} · ${proximoPasseio.saida}`}
              </Texto>
            </Pressable>
          )}
        </ScrollView>
      </FolhaDeslizante>
      <FolhaMais
        aberto={maisAberto}
        filtro={filtro}
        aoEscolher={setFiltro}
        aoFechar={() => setMaisAberto(false)}
      />
      <SeletorVisibilidade
        aberto={seletorAberto}
        estado={visibilidade.estado}
        modoAtual={visibilidade.modo}
        aoEscolher={visibilidade.escolher}
        aoMudarStatus={visibilidade.definirStatus}
        aoFechar={() => setSeletorAberto(false)}
      />
      <FichaMapa
        ficha={ficha}
        status={fonteIrmaos.find((i) => i.id === ficha?.id)?.status}
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
    sos: { position: 'absolute', left: espaco.md },
    bannerAgape: { position: 'absolute', left: espaco.md, right: espaco.md },
    resumo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
    linhaIrmao: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
    cartaoPasseio: {
      backgroundColor: cores.superficie2,
      borderRadius: raios.cartao,
      borderWidth: 1,
      borderColor: cores.linha,
      padding: 14,
      gap: 2,
    },
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
    fecharAgape: {
      width: 40,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
