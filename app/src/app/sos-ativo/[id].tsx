import { Camera, GeoJSONSource, Layer, Map, type CameraRef } from '@maplibre/maplibre-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useEstiloMapa } from '@/map/estilos';
import { lerSos, linkLigar, linkRotaAte, type SosAtivo } from '@/servidor/sos';
import { espaco, useCores } from '@/theme';
import { Botao, Cartao, Texto } from '@/ui';

const ATUALIZAR_MS = 15_000;

/**
 * Tela de quem recebeu o SOS (push): posição EXATA do irmão no mapa, atualizada a cada 15 s,
 * "Ligar" (se houver telefone) e "Rota até ele" (abre o app de mapas do aparelho).
 * A leitura é protegida pela RLS: só grupo do passeio/comboio de hoje, diretoria, moderação e admin.
 */
export default function SosRecebido() {
  const { t, i18n } = useTranslation();
  const cores = useCores();
  const estiloMapa = useEstiloMapa();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sos, setSos] = useState<SosAtivo | null>(null);
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'indisponivel'>('carregando');
  const camera = useRef<CameraRef>(null);

  useEffect(() => {
    let vivo = true;
    const carregar = async () => {
      const s = id ? await lerSos(id) : null;
      if (!vivo) return;
      if (s) {
        setSos(s);
        setEstado('ok');
      } else {
        setEstado((e) => (e === 'ok' ? e : 'indisponivel'));
      }
    };
    void carregar();
    const timer = setInterval(() => void carregar(), ATUALIZAR_MS);
    return () => {
      vivo = false;
      clearInterval(timer);
    };
  }, [id]);

  useEffect(() => {
    if (sos && !sos.encerrado) {
      camera.current?.flyTo?.({ center: [sos.posicao.lng, sos.posicao.lat], zoom: 15, duration: 600 });
    }
  }, [sos]);

  const hora = sos
    ? new Date(sos.atualizadoEm).toLocaleTimeString(i18n.language, {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
    : '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      {estado !== 'ok' || !sos ? (
        <View style={{ padding: espaco.lg, gap: espaco.md }}>
          <Texto variante="titulo" style={{ color: cores.sos }}>
            SOS
          </Texto>
          <Texto>
            {estado === 'carregando'
              ? t('sosAtivo.recebido.carregando')
              : t('sosAtivo.recebido.indisponivel')}
          </Texto>
          <Botao titulo={t('sosAtivo.recebido.voltar')} variante="secundario" onPress={() => router.back()} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={estilos.mapa} accessible accessibilityLabel={t('sosAtivo.recebido.mapa')}>
            <Map style={StyleSheet.absoluteFill} mapStyle={estiloMapa} logo={false} attribution>
              <Camera
                ref={camera}
                initialViewState={{ center: [sos.posicao.lng, sos.posicao.lat], zoom: 15 }}
              />
              <GeoJSONSource
                id="sos-posicao"
                data={{
                  type: 'FeatureCollection',
                  features: [
                    {
                      type: 'Feature',
                      properties: {},
                      geometry: { type: 'Point', coordinates: [sos.posicao.lng, sos.posicao.lat] },
                    },
                  ],
                }}
              >
                <Layer
                  type="circle"
                  id="sos-pino"
                  paint={{
                    'circle-color': cores.sos,
                    'circle-radius': 12,
                    'circle-stroke-color': cores.contornoSos,
                    'circle-stroke-width': 3,
                  }}
                />
              </GeoJSONSource>
            </Map>
          </View>
          <View style={{ padding: espaco.lg, gap: espaco.sm }}>
            <Texto variante="titulo" style={{ color: cores.sos }}>
              {t('sosAtivo.recebido.titulo', { nome: sos.quem })}
            </Texto>
            {sos.tipo && (
              <Texto>
                {t('sosAtivo.recebido.oQue')}: {t(`sos.tipos.${sos.tipo}`)}
              </Texto>
            )}
            {sos.mensagem !== '' && <Texto>{sos.mensagem}</Texto>}
            <Texto variante="pequeno">{t('sosAtivo.recebido.atualizado', { hora })}</Texto>
            {sos.encerrado ? (
              <Cartao style={{ borderColor: cores.alerta }}>
                <Texto>{t('sosAtivo.recebido.encerrado')}</Texto>
              </Cartao>
            ) : (
              <>
                {sos.telefone && (
                  <Botao
                    titulo={t('sosAtivo.recebido.ligar')}
                    icone="socorro"
                    grande
                    onPress={() => void Linking.openURL(linkLigar(sos.telefone as string))}
                  />
                )}
                <Botao
                  titulo={t('sosAtivo.recebido.rota')}
                  icone="navegar"
                  grande
                  variante="secundario"
                  onPress={() => void Linking.openURL(linkRotaAte(sos.posicao))}
                />
              </>
            )}
            <Texto variante="pequeno">{t('sosAtivo.recebido.aviso')}</Texto>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  mapa: { flex: 1, minHeight: 240 },
});
