import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  type CameraRef,
  type StyleSpecification,
} from '@maplibre/maplibre-react-native';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useViagem } from '@/estado/viagem';
import estilo from '@/map/estilo-bodes.json';
import { destinosDaProva, postoExemplo, posicaoDoDestino, type Coordenada } from '@/navegacao/destinos';
import {
  formatarDuracao,
  formatarKm,
  horaChegada,
  limites,
  percentualTerra,
  trechosGeoJSON,
} from '@/rotas/formato';
import { tokenDaRota } from '@/rotas/google';
import type { TipoEstrada } from '@/rotas/tipos';
import { amostrarPassagens, ErroRota, planejarRota } from '@/rotas/valhalla';
import { cores, espaco, raios, sombra } from '@/theme';
import { Botao, Chip, Icone, PainelInferior, Texto, type NomeIcone } from '@/ui';

const tipos: { chave: TipoEstrada; icone: NomeIcone; cor: string }[] = [
  { chave: 'asfalto', icone: 'asfalto', cor: cores.asfalto },
  { chave: 'misto', icone: 'misto', cor: cores.acao },
  { chave: 'terra', icone: 'terra', cor: cores.terra },
];

type Estado =
  | { fase: 'calculando' }
  | { fase: 'pronta' }
  | { fase: 'erro'; motivo: 'semRede' | 'semRota' | 'semLocalizacao' };

export default function Rota() {
  const { t } = useTranslation();
  const camera = useRef<CameraRef>(null);
  const viagem = useViagem();
  const { destino, tipoEstrada, rota } = viagem;
  const [origem, setOrigem] = useState<Coordenada | null>(null);
  const [estado, setEstado] = useState<Estado>({ fase: 'calculando' });
  const [iniciando, setIniciando] = useState(false);
  const destinos = [...destinosDaProva, postoExemplo];

  const calcular = useCallback(async () => {
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
      const nova = await planejarRota(atual, posicaoDoDestino(destino, atual), tipoEstrada);
      viagem.definirRota(nova, null);
      setEstado({ fase: 'pronta' });
      camera.current?.fitBounds(limites(nova.forma), {
        padding: { top: 220, bottom: 470, left: 40, right: 40 },
        duration: 700,
      });
    } catch (e) {
      viagem.definirRota(null, null);
      setEstado({ fase: 'erro', motivo: e instanceof ErroRota ? e.motivo : 'semRede' });
    }
    // viagem.definirRota é estável o bastante para este uso
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destino, tipoEstrada, origem]);

  useEffect(() => {
    // recalcula quando o destino ou o tipo de estrada mudam (fora do ciclo de renderização)
    void Promise.resolve().then(calcular);
  }, [calcular]);

  const iniciar = async () => {
    if (!rota || !origem) return;
    setIniciando(true);
    const chave = (Constants.expoConfig?.extra as { chaveGoogle?: string } | undefined)?.chaveGoogle ?? '';
    const token = await tokenDaRota(
      chave,
      origem,
      rota.forma[rota.forma.length - 1]!,
      amostrarPassagens(rota.forma, 12),
    );
    viagem.definirRota(rota, token);
    setIniciando(false);
    router.push('/pilotando');
  };

  const pct = rota ? percentualTerra(rota.km, rota.kmTerra) : 0;

  return (
    <View style={estilos.tela}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={estilo as unknown as StyleSpecification}
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
              paint={{ 'line-color': cores.fundo, 'line-width': 12 }}
            />
            <Layer
              type="line"
              id="rota-linha"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': cores.acao, 'line-width': 7 }}
            />
            <Layer
              type="line"
              id="rota-terra"
              filter={['==', ['get', 'terra'], true]}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': cores.rotaTerra, 'line-width': 2, 'line-dasharray': [2, 3] }}
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
                {t(`destinos.${destino.chave}`)}
              </Texto>
            </View>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.destinos}
        >
          {destinos.map((d) => (
            <Chip
              key={d.chave}
              rotulo={t(`destinos.${d.chave}`)}
              ativo={d.chave === destino.chave}
              onPress={() => viagem.definirDestino(d)}
            />
          ))}
        </ScrollView>
      </SafeAreaView>

      <PainelInferior style={estilos.painel}>
        {estado.fase === 'calculando' && <Texto variante="secundario">{t('rota.calculando')}</Texto>}
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
              <View style={{ flex: Math.max(100 - pct, 0.01), backgroundColor: cores.asfalto }} />
              <View style={{ flex: Math.max(pct, 0.01), backgroundColor: cores.terra }} />
            </View>
          </>
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
                <Icone nome={tp.icone} tamanho={26} cor={ativo ? cores.acao : tp.cor} />
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
              desativado={estado.fase !== 'pronta' || iniciando}
              onPress={iniciar}
            />
          </View>
        </View>
        <Texto variante="pequeno">{t('rota.aviso')}</Texto>
      </PainelInferior>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.chao },
  topo: { position: 'absolute', top: 0, left: 0, right: 0 },
  cabecalho: {
    marginHorizontal: espaco.md,
    marginTop: espaco.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    padding: espaco.sm,
    backgroundColor: 'rgba(22,18,14,0.95)',
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
  tipoAtivo: { borderWidth: 2, borderColor: cores.acao, backgroundColor: 'rgba(232,105,42,0.12)' },
  textoTipo: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: cores.texto },
  acoes: { flexDirection: 'row', gap: 10, marginTop: espaco.xs },
});
