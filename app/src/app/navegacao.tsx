import {
  NavigationNightMode,
  NavigationProvider,
  NavigationView,
  TaskRemovedBehavior,
  useNavigation,
} from '@googlemaps/react-native-navigation-sdk';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { destinosDaProva, posicaoDoDestino, type Destino } from '@/navegacao/destinos';
import { iniciarNavegacao, type ControladorNavegacao, type ResultadoNavegacao } from '@/navegacao/fluxo';
import { cores, espaco, raios, tema } from '@/theme';
import { Botao, Chip, Texto } from '@/ui';

async function pedirPermissao() {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  return granted;
}

async function posicaoAtual() {
  const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(() => null);
  return p ? { lat: p.coords.latitude, lng: p.coords.longitude } : null;
}

type Permissao = 'verificando' | 'concedida' | 'negada';

/** O mapa do Google só pode ser montado depois da permissão de localização (senão o Android fecha o app). */
function usePermissaoLocalizacao() {
  const [permissao, setPermissao] = useState<Permissao>('verificando');
  useEffect(() => {
    let ativo = true;
    void Location.getForegroundPermissionsAsync()
      .then(({ granted }) => ativo && setPermissao(granted ? 'concedida' : 'negada'))
      .catch(() => ativo && setPermissao('negada'));
    return () => {
      ativo = false;
    };
  }, []);
  const pedir = async () => {
    const ok = await pedirPermissao().catch(() => false);
    setPermissao(ok ? 'concedida' : 'negada');
    return ok;
  };
  return { permissao, pedir };
}

function ProvaDeNavegacao() {
  const { t } = useTranslation();
  const { navigationController } = useNavigation();
  const { permissao, pedir } = usePermissaoLocalizacao();
  const [destino, setDestino] = useState<Destino>(destinosDaProva[0]!);
  const [estado, setEstado] = useState<'parado' | 'preparando' | 'guiando'>('parado');
  const [erro, setErro] = useState<Exclude<ResultadoNavegacao, 'ok'> | null>(null);

  useEffect(() => {
    return () => {
      void navigationController.stopGuidance().catch(() => undefined);
      void navigationController.cleanup().catch(() => undefined);
    };
  }, [navigationController]);

  const iniciar = async () => {
    setErro(null);
    setEstado('preparando');
    const resultado = await iniciarNavegacao({
      controlador: navigationController as unknown as ControladorNavegacao,
      pedirPermissaoLocalizacao: pedir,
      posicaoAtual,
      destino: (atual) => posicaoDoDestino(destino, atual),
      tituloDestino: t(`navegacao.${destino.chave}`),
    });
    if (resultado === 'ok') {
      setEstado('guiando');
    } else {
      setErro(resultado);
      setEstado('parado');
    }
  };

  const encerrar = async () => {
    await navigationController.stopGuidance().catch(() => undefined);
    await navigationController.clearDestinations().catch(() => undefined);
    setEstado('parado');
  };

  return (
    <View style={estilos.tela}>
      {permissao === 'concedida' && (
        <View testID="mapa-navegacao" style={StyleSheet.absoluteFill}>
          <NavigationView
            style={StyleSheet.absoluteFill}
            navigationNightMode={NavigationNightMode.FORCE_NIGHT}
            myLocationEnabled
            speedometerEnabled
            reportIncidentButtonEnabled={false}
          />
        </View>
      )}
      <SafeAreaView edges={['bottom']} style={estilos.painelArea} pointerEvents="box-none">
        {estado === 'guiando' ? (
          <Botao titulo={t('navegacao.encerrar')} variante="secundario" onPress={encerrar} />
        ) : (
          <View style={estilos.painel}>
            <Texto variante="rotulo">{t('navegacao.escolha')}</Texto>
            <View style={estilos.linha}>
              {destinosDaProva.map((d) => (
                <Chip
                  key={d.chave}
                  rotulo={t(`navegacao.${d.chave}`)}
                  ativo={d.chave === destino.chave}
                  onPress={() => setDestino(d)}
                />
              ))}
            </View>
            {permissao === 'negada' && <Texto>{t('navegacao.permissaoMotivo')}</Texto>}
            {erro && <Texto style={{ color: cores.alerta }}>{t(`navegacao.erros.${erro}`)}</Texto>}
            <Texto variante="secundario">{t('navegacao.aviso')}</Texto>
            <Botao
              titulo={estado === 'preparando' ? t('navegacao.preparando') : t('navegacao.iniciar')}
              desativado={estado === 'preparando'}
              onPress={iniciar}
            />
            <Botao titulo={t('comum.voltar')} variante="secundario" onPress={() => router.back()} />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

/** Etapa 0: navegação curva a curva do Google, modo moto, com voz. */
export default function TelaNavegacao() {
  const { t } = useTranslation();
  return (
    <NavigationProvider
      termsAndConditionsDialogOptions={{
        title: t('navegacao.termosTitulo'),
        companyName: tema.marca.nome,
        showOnlyDisclaimer: false,
        uiParams: {
          backgroundColor: cores.sarja,
          titleColor: cores.creme,
          mainTextColor: cores.creme,
          acceptButtonTextColor: cores.laranja,
          cancelButtonTextColor: cores.caramelo,
        },
      }}
      taskRemovedBehavior={TaskRemovedBehavior.QUIT_SERVICE}
    >
      <ProvaDeNavegacao />
    </NavigationProvider>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.noite },
  painelArea: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: espaco.md },
  painel: {
    backgroundColor: cores.sarja,
    borderRadius: raios.folha,
    borderWidth: 2,
    borderColor: cores.laranja,
    padding: espaco.lg,
    gap: espaco.sm,
  },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs },
});
