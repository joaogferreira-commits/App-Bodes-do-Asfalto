import { Camera, GeoJSONSource, Layer, Map, type CameraRef } from '@maplibre/maplibre-react-native';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { bateVoltaPadrao, useViagem } from '@/estado/viagem';
import { camadasDaRota, useEstiloMapa } from '@/map/estilos';
import {
  destinosDaProva,
  nomeDoDestino,
  postoExemplo,
  posicaoDoDestino,
  type Coordenada,
} from '@/navegacao/destinos';
import {
  formatarDuracao,
  formatarKm,
  horaChegada,
  limites,
  percentualTerra,
  trechosGeoJSON,
} from '@/rotas/formato';
import { prefetchGoogle, type ResultadoGoogle } from '@/rotas/google';
import type { RotaPlanejada, TipoEstrada } from '@/rotas/tipos';
import { ErroRota, planejarBateVolta, planejarRota, rumos, type Rumo } from '@/rotas/valhalla';
import { espaco, fontes, raios, sombra, useCores, useEstilos, type NomeCor, type Paleta } from '@/theme';
import { Botao, Chip, Icone, PainelInferior, Texto, type NomeIcone } from '@/ui';

const distancias = [50, 100, 150, 200, 300];

const tipos: { chave: TipoEstrada; icone: NomeIcone; cor: NomeCor }[] = [
  { chave: 'asfalto', icone: 'asfalto', cor: 'texto' },
  { chave: 'misto', icone: 'misto', cor: 'acao' },
  { chave: 'terra', icone: 'terra', cor: 'terra' },
];

type Estado =
  | { fase: 'calculando' }
  | { fase: 'pronta' }
  | { fase: 'erro'; motivo: 'semRede' | 'semRota' | 'semLocalizacao' };

export default function Rota() {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const estiloMapa = useEstiloMapa();
  const pintura = camadasDaRota(cores);
  const camera = useRef<CameraRef>(null);
  const viagem = useViagem();
  const { destino, tipoEstrada, rota, bateVolta } = viagem;
  const { height: alturaTela } = useWindowDimensions();
  const [origem, setOrigem] = useState<Coordenada | null>(null);
  const [estado, setEstado] = useState<Estado>({ fase: 'calculando' });
  const [recolhido, setRecolhido] = useState(false);
  const [opcoes, setOpcoes] = useState<RotaPlanejada[]>([]);
  const [escolhida, setEscolhida] = useState(0);
  const destinos = [...(destino.chave === 'busca' ? [destino] : []), ...destinosDaProva, postoExemplo];

  const corte = useRef<AbortController | null>(null);
  const [demorando, setDemorando] = useState(false);
  useEffect(() => {
    if (estado.fase !== 'calculando') {
      void Promise.resolve().then(() => setDemorando(false));
      return;
    }
    const relogio = setTimeout(() => setDemorando(true), 6000);
    return () => clearTimeout(relogio);
  }, [estado.fase]);

  useEffect(() => () => corte.current?.abort(), []);

  const cancelar = () => {
    corte.current?.abort();
    router.back();
  };

  const calcular = useCallback(async () => {
    corte.current?.abort();
    const controle = new AbortController();
    corte.current = controle;
    setEstado({ fase: 'calculando' });
    let atual = origem;
    if (!atual) {
      const { granted } = await Location.requestForegroundPermissionsAsync().catch(() => ({
        granted: false,
      }));
      const p = granted ? await Location.getCurrentPositionAsync({}).catch(() => null) : null;
      if (!p) return setEstado({ fase: 'erro', motivo: 'semLocalizacao' });
      atual = { lat: p.coords.latitude, lng: p.coords.longitude };
      setOrigem(atual);
    }
    try {
      const nova = bateVolta
        ? await planejarBateVolta(atual, { ...bateVolta, tipo: tipoEstrada }, undefined, controle.signal)
        : await planejarRota(atual, posicaoDoDestino(destino, atual), tipoEstrada, undefined, {
            sinal: controle.signal,
          });
      if (controle.signal.aborted) return;
      const { alternativas, ...principal } = nova;
      setOpcoes([principal, ...(alternativas ?? [])]);
      setEscolhida(0);
      viagem.definirRota(principal, null);
      setEstado({ fase: 'pronta' });
      camera.current?.fitBounds(limites(nova.forma), {
        padding: { top: 220, bottom: 470, left: 40, right: 40 },
        duration: 700,
      });
    } catch (e) {
      if (controle.signal.aborted) return;
      viagem.definirRota(null, null);
      setEstado({ fase: 'erro', motivo: e instanceof ErroRota ? e.motivo : 'semRede' });
    }
    // viagem.definirRota é estável o bastante para este uso
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destino, tipoEstrada, origem, bateVolta]);

  useEffect(() => {
    // recalcula quando o destino ou o tipo de estrada mudam (fora do ciclo de renderização)
    void Promise.resolve().then(calcular);
  }, [calcular]);

  // Assim que a rota é escolhida, o token do Google é pedido em segundo plano (cache por rota):
  // o "Iniciar" reaproveita sem esperar. Também confere se a navegação vai seguir esta rota.
  const [google, setGoogle] = useState<ResultadoGoogle | 'verificando' | null>(null);
  const chaveGoogle =
    (Constants.expoConfig?.extra as { chaveGoogle?: string } | undefined)?.chaveGoogle ?? '';
  useEffect(() => {
    if (!rota) return;
    let ativo = true;
    void Promise.resolve()
      .then(() => ativo && setGoogle('verificando'))
      .then(() => prefetchGoogle(chaveGoogle, rota.forma, rota.km))
      .then((r) => ativo && setGoogle(r));
    return () => {
      ativo = false;
    };
  }, [rota, chaveGoogle]);

  const iniciar = async () => {
    if (!rota || !origem) return;
    // Não espera o Google aqui: a tela de pilotagem pede um token novo saindo de onde o irmão está.
    viagem.definirRota(rota, google && google !== 'verificando' && google.aceita ? google.token : null);
    router.push('/pilotando');
  };

  const textoGoogle =
    google === 'verificando'
      ? t('rota.google.verificando')
      : !google
        ? null
        : google.aceita
          ? google.fiel
            ? t('rota.google.fiel')
            : t('rota.google.parecida', { km: formatarKm(google.kmGoogle) })
          : t(`rota.google.${google.motivo}`, { terra: formatarKm(rota?.kmTerra ?? 0) });
  const corGoogle =
    google && google !== 'verificando'
      ? google.aceita && google.fiel
        ? cores.verdePosto
        : cores.alerta
      : cores.textoSec;

  const pct = rota ? percentualTerra(rota.km, rota.kmTerra) : 0;

  return (
    <View style={estilos.tela}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={estiloMapa}
        logo={false}
        attribution
        attributionPosition={{ bottom: 480, left: 8 }}
      >
        <Camera ref={camera} initialViewState={{ center: [-56.0861, -15.5895], zoom: 9 }} />
        {rota && (
          <GeoJSONSource id="rota" data={trechosGeoJSON(rota.trechos)}>
            <Layer
              type="line"
              id="rota-contorno"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={pintura.contorno as never}
            />
            <Layer
              type="line"
              id="rota-linha"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={pintura.linha as never}
            />
            <Layer
              type="line"
              id="rota-terra"
              filter={['==', ['get', 'terra'], true]}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={pintura.terra as never}
            />
          </GeoJSONSource>
        )}
      </Map>

      <SafeAreaView edges={['top']} style={estilos.topo} pointerEvents="box-none">
        <View style={estilos.cabecalho}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('comum.voltar')}
            onPress={() => router.back()}
            style={estilos.voltar}
          >
            <Icone nome="voltar" />
          </Pressable>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={estilos.ponto}>
              <View style={[estilos.bolinha, { borderWidth: 2, borderColor: cores.texto }]} />
              <Texto variante="secundario">{t('rota.origem')}</Texto>
            </View>
            <View style={estilos.ponto}>
              <View style={[estilos.bolinha, { backgroundColor: cores.acao }]} />
              <Texto variante="corpoForte" numberOfLines={1}>
                {bateVolta ? t('rota.bateVolta.titulo', { km: bateVolta.km }) : nomeDoDestino(destino, t)}
              </Texto>
            </View>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.destinos}
        >
          <Chip
            rotulo={t('rota.bateVolta.chip')}
            ativo={!!bateVolta}
            onPress={() => viagem.definirBateVolta(bateVolta ?? bateVoltaPadrao)}
          />
          {destinos.map((d) => (
            <Chip
              key={d.chave}
              rotulo={nomeDoDestino(d, t)}
              ativo={!bateVolta && d.chave === destino.chave}
              onPress={() => {
                viagem.definirBateVolta(null);
                viagem.definirDestino(d);
              }}
            />
          ))}
        </ScrollView>
      </SafeAreaView>

      <PainelInferior
        style={estilos.painel}
        recolhido={recolhido}
        aoAlternar={setRecolhido}
        resumo={
          recolhido && rota ? (
            <Texto variante="corpoForte">
              {t('rota.km', { km: formatarKm(rota.km) })} · {formatarDuracao(rota.minutos)}
            </Texto>
          ) : null
        }
      >
        <ScrollView
          style={{ maxHeight: alturaTela * 0.62 }}
          contentContainerStyle={{ gap: espaco.sm }}
          showsVerticalScrollIndicator={false}
        >
          {estado.fase === 'calculando' && (
            <View style={{ gap: espaco.sm }} accessibilityLiveRegion="polite">
              <Texto variante="secundario">{demorando ? t('rota.quaseLa') : t('rota.calculando')}</Texto>
              <Botao titulo={t('comum.cancelar')} variante="secundario" onPress={cancelar} />
            </View>
          )}
          {estado.fase === 'erro' && (
            <View style={{ gap: espaco.sm }}>
              <Texto style={{ color: cores.alerta }}>{t(`rota.erros.${estado.motivo}`)}</Texto>
              <Botao titulo={t('rota.tentarDeNovo')} variante="secundario" onPress={calcular} />
            </View>
          )}
          {estado.fase === 'pronta' && rota && (
            <>
              <View style={estilos.resumo}>
                <View>
                  <Texto variante="numero" style={{ fontSize: 40, lineHeight: 42 }}>
                    {t('rota.km', { km: formatarKm(rota.km) })}
                  </Texto>
                  <Texto variante="secundario">
                    {t('rota.duracao', {
                      tempo: formatarDuracao(rota.minutos),
                      hora: horaChegada(rota.minutos),
                    })}
                  </Texto>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Texto variante="rotulo" style={{ color: cores.terra }}>
                    {t('rota.terraRotulo')}
                  </Texto>
                  <Texto variante="subtitulo">{t('rota.terraKm', { km: formatarKm(rota.kmTerra) })}</Texto>
                </View>
              </View>
              <View
                accessible
                accessibilityLabel={t('rota.composicao', { asfalto: 100 - pct, terra: pct })}
                style={estilos.barra}
              >
                {/* Trechos na ordem do caminho: claro = asfalto, ocre com borda escura = terra */}
                {rota.trechos.map((tr, i) => (
                  <View
                    key={i}
                    style={{
                      flex: Math.max(tr.km ?? rota.km / rota.trechos.length, 0.01),
                      backgroundColor: tr.terra ? cores.terra : cores.asfalto,
                      borderTopWidth: tr.terra ? 2 : 0,
                      borderBottomWidth: tr.terra ? 2 : 0,
                      borderColor: cores.terraEscura,
                    }}
                  />
                ))}
              </View>
              {rota.kmAteTerra !== undefined && (
                <Texto variante="secundario">
                  {rota.kmAteTerra > 0
                    ? t('rota.terraComeca', { km: formatarKm(rota.kmAteTerra) })
                    : t('rota.terraNaSaida')}
                </Texto>
              )}
              {opcoes.length > 1 && (
                <View style={{ gap: espaco.xs }}>
                  <Texto variante="rotulo">{t('rota.opcoes')}</Texto>
                  <View style={estilos.quebra}>
                    {opcoes.map((o, i) => (
                      <Chip
                        key={i}
                        rotulo={t('rota.opcao', {
                          n: i + 1,
                          km: formatarKm(o.km),
                          tempo: formatarDuracao(o.minutos),
                          terra: percentualTerra(o.km, o.kmTerra),
                        })}
                        ativo={escolhida === i}
                        onPress={() => {
                          setEscolhida(i);
                          viagem.definirRota(o, null);
                        }}
                      />
                    ))}
                  </View>
                </View>
              )}
              {rota.aviso === 'semCaminhoSoAsfalto' && (
                <View style={estilos.avisoTerra} accessibilityLiveRegion="polite">
                  <Icone nome="alerta" tamanho={20} cor={cores.alerta} />
                  <Texto variante="secundario" style={{ flex: 1, color: cores.texto }}>
                    {t('rota.semCaminhoSoAsfalto', { km: formatarKm(rota.kmTerra) })}
                  </Texto>
                </View>
              )}
            </>
          )}

          {bateVolta && (
            <View style={{ gap: espaco.sm }}>
              <Texto variante="rotulo">{t('rota.bateVolta.distancia')}</Texto>
              <View style={estilos.quebra}>
                {distancias.map((km) => (
                  <Chip
                    key={km}
                    rotulo={t('rota.km', { km })}
                    ativo={bateVolta.km === km}
                    onPress={() => viagem.definirBateVolta({ ...bateVolta, km, variacao: 0 })}
                  />
                ))}
              </View>
              <Texto variante="rotulo">{t('rota.bateVolta.direcao')}</Texto>
              <View style={estilos.quebra} accessibilityRole="radiogroup">
                {(Object.keys(rumos) as Rumo[]).map((r) => (
                  <Chip
                    key={r}
                    rotulo={t(`rota.bateVolta.rumos.${r}`)}
                    ativo={bateVolta.rumo === r}
                    onPress={() => viagem.definirBateVolta({ ...bateVolta, rumo: r, variacao: 0 })}
                  />
                ))}
              </View>
              <View style={estilos.quebra}>
                <Chip
                  rotulo={t('rota.bateVolta.curvas')}
                  ativo={bateVolta.curvas}
                  onPress={() =>
                    viagem.definirBateVolta({ ...bateVolta, curvas: !bateVolta.curvas, variacao: 0 })
                  }
                />
                <Chip
                  rotulo={t('rota.bateVolta.outra')}
                  onPress={() => viagem.definirBateVolta({ ...bateVolta, variacao: bateVolta.variacao + 1 })}
                />
              </View>
            </View>
          )}

          {estado.fase === 'pronta' && textoGoogle && (
            <View style={[estilos.avisoTerra, { borderColor: corGoogle }]} accessibilityLiveRegion="polite">
              <Icone nome="navegar" tamanho={20} cor={corGoogle} />
              <Texto variante="secundario" style={{ flex: 1, color: cores.texto }}>
                {textoGoogle}
              </Texto>
            </View>
          )}

          <Texto variante="rotulo">{t('rota.tipoEstrada')}</Texto>
          <View accessibilityRole="radiogroup" style={estilos.tipos}>
            {tipos.map((tp) => {
              const ativo = tp.chave === tipoEstrada;
              return (
                <Pressable
                  key={tp.chave}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: ativo }}
                  accessibilityLabel={t(`rota.${tp.chave}`)}
                  onPress={() => viagem.definirTipoEstrada(tp.chave)}
                  style={[estilos.tipo, ativo && estilos.tipoAtivo]}
                >
                  <Icone nome={tp.icone} tamanho={26} cor={ativo ? cores.acao : cores[tp.cor]} />
                  <Texto style={estilos.textoTipo}>{t(`rota.${tp.chave}`)}</Texto>
                </Pressable>
              );
            })}
          </View>
          <Texto variante="secundario">{t(`rota.explicacao.${tipoEstrada}`)}</Texto>

          <View style={estilos.acoes}>
            <View style={{ flex: 1 }}>
              <Botao
                titulo={t('rota.iniciar')}
                grande
                icone="navegar"
                desativado={estado.fase !== 'pronta'}
                onPress={iniciar}
              />
            </View>
          </View>
          <Texto variante="pequeno">{t('rota.aviso')}</Texto>
        </ScrollView>
      </PainelInferior>
    </View>
  );
}

const criarEstilos = (cores: Paleta) =>
  StyleSheet.create({
    tela: { flex: 1, backgroundColor: cores.chao },
    topo: { position: 'absolute', top: 0, left: 0, right: 0 },
    cabecalho: {
      marginHorizontal: espaco.md,
      marginTop: espaco.xs,
      flexDirection: 'row',
      alignItems: 'center',
      gap: espaco.sm,
      padding: espaco.sm,
      backgroundColor: cores.sobreMapa,
      borderWidth: 1,
      borderColor: cores.linha,
      borderRadius: raios.cartao,
      boxShadow: sombra.flutuante,
    },
    voltar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    ponto: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs },
    bolinha: { width: 10, height: 10, borderRadius: 5 },
    destinos: { gap: espaco.xs, paddingHorizontal: espaco.md, paddingVertical: espaco.sm },
    painel: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: espaco.lg,
      paddingBottom: espaco.xl,
      gap: espaco.sm,
    },
    resumo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    barra: {
      flexDirection: 'row',
      height: 8,
      borderRadius: 8,
      overflow: 'hidden',
      gap: 2,
      marginVertical: espaco.xs,
    },
    tipos: { flexDirection: 'row', gap: espaco.xs },
    quebra: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs },
    tipo: {
      flex: 1,
      height: 76,
      borderRadius: raios.botao,
      borderWidth: 1,
      borderColor: cores.linha,
      backgroundColor: cores.superficie2,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    tipoAtivo: { borderWidth: 3, borderColor: cores.acao, backgroundColor: cores.superficie3 },
    textoTipo: { fontSize: 15, fontFamily: fontes.textoSemi, color: cores.texto, textAlign: 'center' },
    acoes: { flexDirection: 'row', gap: 10, marginTop: espaco.xs },
    avisoTerra: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: espaco.xs,
      padding: espaco.sm,
      borderRadius: raios.botao,
      borderWidth: 1,
      borderColor: cores.alerta,
    },
  });
