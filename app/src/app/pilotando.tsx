import {
  NavigationNightMode,
  NavigationProvider,
  NavigationView,
  TaskRemovedBehavior,
  useNavigation,
} from '@googlemaps/react-native-navigation-sdk';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useViagem } from '@/estado/viagem';
import { posicaoDoDestino } from '@/navegacao/destinos';
import { iniciarNavegacao, type ControladorNavegacao, type ResultadoNavegacao } from '@/navegacao/fluxo';
import { cores, espaco, fontes, tema, toque } from '@/theme';
import { Botao, Icone, Texto, type NomeIcone } from '@/ui';

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

/** Cabeçalho da manobra no laranja do app (como na Interface v2). */
const estiloCabecalho = {
  primaryDayModeThemeColor: cores.acao,
  primaryNightModeThemeColor: cores.acao,
  secondaryDayModeThemeColor: cores.acaoPressionada,
  secondaryNightModeThemeColor: cores.acaoPressionada,
  headerLargeManeuverIconColor: cores.fundo,
  headerSmallManeuverIconColor: cores.fundo,
  headerNextStepTextColor: cores.fundo,
  headerDistanceValueTextColor: cores.fundo,
  headerDistanceUnitsTextColor: cores.fundo,
  headerInstructionsTextColor: cores.fundo,
};

type BotaoGrande = {
  chave: string;
  icone?: NomeIcone;
  corIcone?: string;
  fundo: string;
  corTexto: string;
  aoTocar: () => void;
};

function Pilotando() {
  const { t } = useTranslation();
  const { navigationController } = useNavigation();
  const viagem = useViagem();
  const { permissao, pedir } = usePermissaoLocalizacao();
  const [estado, setEstado] = useState<'preparando' | 'guiando' | 'erro'>('preparando');
  const [erro, setErro] = useState<Exclude<ResultadoNavegacao, 'ok' | 'okRotaRapida'> | null>(null);
  const [rotaRapida, setRotaRapida] = useState(false);
  const iniciou = useRef(false);

  const iniciar = async () => {
    setErro(null);
    setEstado('preparando');
    const resultado = await iniciarNavegacao({
      controlador: navigationController as unknown as ControladorNavegacao,
      pedirPermissaoLocalizacao: pedir,
      posicaoAtual,
      destino: (atual) =>
        viagem.rota?.forma[viagem.rota.forma.length - 1] ?? posicaoDoDestino(viagem.destino, atual),
      tituloDestino: t(`destinos.${viagem.destino.chave}`),
      tokenRota: viagem.tokenRota,
    });
    if (resultado === 'ok' || resultado === 'okRotaRapida') {
      setRotaRapida(resultado === 'okRotaRapida');
      setEstado('guiando');
    } else {
      setErro(resultado);
      setEstado('erro');
    }
  };

  useEffect(() => {
    if (iniciou.current) return;
    iniciou.current = true;
    void iniciar();
    return () => {
      void navigationController.stopGuidance().catch(() => undefined);
      void navigationController.cleanup().catch(() => undefined);
    };
    // inicia uma vez ao abrir a tela
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const encerrar = async () => {
    await navigationController.stopGuidance().catch(() => undefined);
    await navigationController.clearDestinations().catch(() => undefined);
    router.back();
  };

  const emBreve = (chave: string) => () => Alert.alert(t('comum.emBreve'), t(chave));
  const botoes: BotaoGrande[] = [
    {
      chave: 'alerta',
      icone: 'alerta',
      corIcone: cores.fundo,
      fundo: cores.alerta,
      corTexto: cores.fundo,
      aoTocar: emBreve('pilotando.emBreveAlerta'),
    },
    {
      chave: 'reagrupar',
      icone: 'reagrupar',
      fundo: cores.superficie3,
      corTexto: cores.texto,
      aoTocar: emBreve('pilotando.emBreveReagrupar'),
    },
    {
      chave: 'sos',
      fundo: cores.sos,
      corTexto: cores.textoSobreSos,
      aoTocar: () => Alert.alert(t('pilotando.sos'), t('pilotando.sosTeste')),
    },
    {
      chave: 'postoProximo',
      icone: 'posto',
      corIcone: cores.verdePosto,
      fundo: cores.superficie3,
      corTexto: cores.texto,
      aoTocar: emBreve('pilotando.emBrevePosto'),
    },
    {
      chave: 'postoNaRota',
      icone: 'postoRota',
      corIcone: cores.verdePosto,
      fundo: cores.superficie3,
      corTexto: cores.texto,
      aoTocar: emBreve('pilotando.emBrevePosto'),
    },
    { chave: 'encerrar', icone: 'encerrar', fundo: 'transparent', corTexto: cores.texto, aoTocar: encerrar },
  ];

  return (
    <View style={estilos.tela}>
      <View style={estilos.mapa}>
        {permissao === 'concedida' ? (
          <NavigationView
            style={StyleSheet.absoluteFill}
            navigationNightMode={NavigationNightMode.FORCE_NIGHT}
            androidStylingOptions={estiloCabecalho}
            myLocationEnabled
            speedometerEnabled
            reportIncidentButtonEnabled={false}
            tripProgressBarEnabled
          />
        ) : (
          <SafeAreaView style={estilos.centro}>
            <Texto variante="secundario" style={{ textAlign: 'center' }}>
              {permissao === 'negada' ? t('navegacao.permissaoMotivo') : t('pilotando.preparando')}
            </Texto>
            {permissao === 'negada' && <Botao titulo={t('navegacao.permitir')} onPress={iniciar} />}
          </SafeAreaView>
        )}
      </View>

      {(estado !== 'guiando' || rotaRapida) && (
        <View style={estilos.faixa}>
          <Icone nome="alerta" tamanho={18} cor={cores.alerta} />
          <Texto style={{ color: cores.alerta, flex: 1, fontFamily: fontes.textoSemi, fontSize: 15 }}>
            {estado === 'preparando'
              ? t('pilotando.preparando')
              : erro
                ? t(`navegacao.erros.${erro}`)
                : t('pilotando.rotaRapida')}
          </Texto>
          {estado === 'erro' && (
            <Pressable accessibilityRole="button" onPress={iniciar} hitSlop={10}>
              <Texto style={{ color: cores.acao, fontFamily: fontes.textoForte }}>
                {t('rota.tentarDeNovo')}
              </Texto>
            </Pressable>
          )}
        </View>
      )}

      <SafeAreaView edges={['bottom']} style={estilos.grade}>
        {botoes.map((b) => (
          <Pressable
            key={b.chave}
            accessibilityRole="button"
            accessibilityLabel={t(`pilotando.${b.chave}`)}
            onPress={b.chave === 'sos' ? undefined : b.aoTocar}
            onLongPress={b.chave === 'sos' ? b.aoTocar : undefined}
            delayLongPress={2000}
            style={({ pressed }) => [
              estilos.botao,
              { backgroundColor: b.fundo, opacity: pressed ? 0.85 : 1 },
              b.chave === 'encerrar' && estilos.botaoContorno,
            ]}
          >
            {b.chave === 'sos' ? (
              <>
                <Texto style={estilos.sos}>SOS</Texto>
                <Texto style={{ color: cores.textoSobreSos, fontSize: 13, fontFamily: fontes.textoSemi }}>
                  {t('pilotando.sosDica')}
                </Texto>
              </>
            ) : (
              <>
                {b.icone && (
                  <Icone nome={b.icone} tamanho={34} cor={b.corIcone ?? b.corTexto} espessura={2} />
                )}
                <Texto style={[estilos.textoBotao, { color: b.corTexto }]} numberOfLines={2}>
                  {t(`pilotando.${b.chave}`)}
                </Texto>
              </>
            )}
          </Pressable>
        ))}
      </SafeAreaView>
    </View>
  );
}

/** Modo pilotando: navegação do Google + 6 botões grandes (Alerta, Reagrupar, SOS, Postos, Encerrar). */
export default function TelaPilotando() {
  const { t } = useTranslation();
  return (
    <NavigationProvider
      termsAndConditionsDialogOptions={{
        title: t('navegacao.termosTitulo'),
        companyName: tema.marca.nome,
        showOnlyDisclaimer: false,
        uiParams: {
          backgroundColor: cores.superficie,
          titleColor: cores.texto,
          mainTextColor: cores.texto,
          acceptButtonTextColor: cores.acao,
          cancelButtonTextColor: cores.textoSec,
        },
      }}
      taskRemovedBehavior={TaskRemovedBehavior.QUIT_SERVICE}
    >
      <Pilotando />
    </NavigationProvider>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  mapa: { flex: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espaco.md, padding: espaco.xl },
  faixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    marginHorizontal: espaco.sm,
    marginTop: espaco.xs,
    paddingHorizontal: espaco.sm,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(245,197,24,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.5)',
  },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs, padding: espaco.sm },
  botao: {
    width: '31.9%',
    height: toque.pilotando,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  botaoContorno: { borderWidth: 1, borderColor: cores.linhaForte },
  textoBotao: { fontSize: 16, fontFamily: fontes.textoForte, textAlign: 'center', lineHeight: 19 },
  sos: {
    fontFamily: fontes.titulo,
    fontSize: 40,
    lineHeight: 42,
    color: cores.textoSobreSos,
    letterSpacing: 1,
  },
});
