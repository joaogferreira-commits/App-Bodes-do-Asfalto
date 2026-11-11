import { Camera, Map, type StyleSpecification } from '@maplibre/maplibre-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import estilo from '@/map/estilo-bodes.json';
import { cores, espaco } from '@/theme';
import { Botao, Texto } from '@/ui';

const CUIABA: [number, number] = [-56.0974, -15.601];

/** Etapa 0: mapa principal com o estilo próprio dos Bodes (MapLibre + OpenFreeMap). */
export default function TelaMapa() {
  const { t } = useTranslation();
  return (
    <View style={estilos.tela}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={estilo as unknown as StyleSpecification}
        logo={false}
        attribution
      >
        <Camera initialViewState={{ center: CUIABA, zoom: 8.5 }} />
      </Map>
      <SafeAreaView edges={['top']} style={estilos.topo} pointerEvents="box-none">
        <View style={estilos.cabecalho}>
          <Texto variante="titulo">{t('testes.mapa')}</Texto>
        </View>
      </SafeAreaView>
      <SafeAreaView edges={['bottom']} style={estilos.rodape} pointerEvents="box-none">
        <Botao titulo={t('comum.voltar')} variante="secundario" onPress={() => router.back()} />
      </SafeAreaView>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.noite },
  topo: { position: 'absolute', top: 0, left: 0, right: 0, padding: espaco.md },
  cabecalho: {
    backgroundColor: 'rgba(12,10,8,0.8)',
    borderRadius: 14,
    padding: espaco.sm,
    alignSelf: 'flex-start',
  },
  rodape: { position: 'absolute', bottom: 0, left: espaco.md, right: espaco.md, paddingBottom: espaco.md },
});
