import Constants from 'expo-constants';
import {
  NavigationNightMode,
  NavigationProvider,
  NavigationView,
  TaskRemovedBehavior,
  useNavigation,
  useNavigationAuto,
} from '@googlemaps/react-native-navigation-sdk';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePerfilOpcional } from '@/estado/perfil';
import { useViagem } from '@/estado/viagem';
import { useOdometro } from '@/seguranca/useOdometro';
import { medidasGrade, ordemAcoes, type Acao } from '@/navegacao/gradePilotando';
import { tokenParaSair } from '@/rotas/google';
import { nomeDoDestino, posicaoDoDestino } from '@/navegacao/destinos';
import { iniciarNavegacao, type ControladorNavegacao, type ResultadoNavegacao } from '@/navegacao/fluxo';
import { cores, escalaMaxima, espaco, fontes, tema, toque, useCores, useTema } from '@/theme';
import { Botao, BotaoSegurar, Icone, Texto, type NomeIcone } from '@/ui';

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

const DURACAO_SOS = 3000;
const DURACAO_ENCERRAR = 1500;
const LARGURA_GRADE_DEITADO = 3 * 110 + 2 * toque.pilotandoEspaco + 2 * espaco.sm;

function Pilotando() {
  const { t } = useTranslation();
  const c = useCores();
  const { modo, preferencia } = useTema();
  const janela = useWindowDimensions();
  const deitado = janela.width > janela.height;
  const grade = medidasGrade(deitado ? LARGURA_GRADE_DEITADO : janela.width, deitado);
  const { navigationController } = useNavigation();
  const viagem = useViagem();
  const { permissao, pedir } = usePermissaoLocalizacao();
  const [estado, setEstado] = useState<'preparando' | 'guiando' | 'erro'>('preparando');
  const [erro, setErro] = useState<Exclude<ResultadoNavegacao, 'ok' | 'okRotaRapida'> | null>(null);
  const [rotaRapida, setRotaRapida] = useState(false);
  const chaveGoogle =
    (Constants.expoConfig?.extra as { chaveGoogle?: string } | undefined)?.chaveGoogle ?? '';
  const [aviso, setAviso] = useState<string | null>(null);
  const relogioAviso = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iniciou = useRef(false);
  // Km rodados vão para a Manutenção e para a moto principal da garagem.
  const perfil = usePerfilOpcional();
  useOdometro((km) => {
    const m = perfil?.motoPrincipal;
    if (m) perfil.salvarMoto({ ...m, km: String((Number(m.km.replace(/\D/g, '')) || 0) + km) });
  });

  const iniciar = async () => {
    setErro(null);
    setEstado('preparando');
    const resultado = await iniciarNavegacao({
      controlador: navigationController as unknown as ControladorNavegacao,
      pedirPermissaoLocalizacao: pedir,
      posicaoAtual,
      destino: (atual) =>
        viagem.rota?.forma[viagem.rota.forma.length - 1] ?? posicaoDoDestino(viagem.destino, atual),
      tituloDestino: viagem.bateVolta
        ? t('rota.bateVolta.titulo', { km: viagem.bateVolta.km })
        : nomeDoDestino(viagem.destino, t),
      tokenRota: viagem.tokenRota,
      tokenNaHora: viagem.rota
        ? // reaproveita o token pedido em segundo plano na tela de rota (instantâneo)
          (atual) => tokenParaSair(chaveGoogle, viagem.rota!.forma, viagem.rota!.km, atual)
        : undefined,
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
      if (relogioAviso.current) clearTimeout(relogioAviso.current);
      void navigationController.stopGuidance().catch(() => undefined);
      void navigationController.cleanup().catch(() => undefined);
    };
    // inicia uma vez ao abrir a tela
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const encerrar = async () => {
    try {
      navigationController.setTurnByTurnLoggingEnabled(false);
    } catch {
      // nada a desligar
    }
    await navigationController.stopGuidance().catch(() => undefined);
    await navigationController.clearDestinations().catch(() => undefined);
    router.back();
  };

  // Botão "Encerrar" da tela do carro (Android Auto) encerra a navegação aqui também.
  const { setOnCustomNavigationAutoEvent } = useNavigationAuto();
  const encerrarRef = useRef(encerrar);
  useEffect(() => {
    encerrarRef.current = encerrar;
  });
  useEffect(() => {
    setOnCustomNavigationAutoEvent((evento) => {
      if (evento.type === 'encerrar') void encerrarRef.current();
    });
    return () => setOnCustomNavigationAutoEvent(null);
  }, [setOnCustomNavigationAutoEvent]);

  /** Resposta de um toque (R2, R7): vibração + faixa curta, sem janela para fechar. */
  const avisar = (chave: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    setAviso(t(chave));
    if (relogioAviso.current) clearTimeout(relogioAviso.current);
    relogioAviso.current = setTimeout(() => setAviso(null), 4000);
  };

  const acoes: Record<
    Exclude<Acao, 'sos' | 'encerrar'>,
    { icone: NomeIcone; fundo: string; cor: string; corIcone: string; aviso: string }
  > = {
    alerta: {
      icone: 'alerta',
      fundo: c.alerta,
      cor: c.textoSobreAlerta,
      corIcone: c.textoSobreAlerta,
      aviso: 'pilotando.emBreveAlerta',
    },
    reagrupar: {
      icone: 'reagrupar',
      fundo: c.superficie3,
      cor: c.texto,
      corIcone: c.texto,
      aviso: 'pilotando.emBreveReagrupar',
    },
    postoProximo: {
      icone: 'posto',
      fundo: c.superficie3,
      cor: c.texto,
      corIcone: c.verdePosto,
      aviso: 'pilotando.emBrevePosto',
    },
    postoNaRota: {
      icone: 'postoRota',
      fundo: c.superficie3,
      cor: c.texto,
      corIcone: c.verdePosto,
      aviso: 'pilotando.emBrevePosto',
    },
  };

  const faixa =
    aviso ??
    (estado === 'preparando'
      ? t('pilotando.dicaEntrada')
      : erro
        ? t(`navegacao.erros.${erro}`)
        : rotaRapida
          ? t('pilotando.rotaRapida')
          : null);

  const modoNoturnoGoogle =
    preferencia === 'auto'
      ? NavigationNightMode.AUTO
      : modo === 'sol'
        ? NavigationNightMode.FORCE_DAY
        : NavigationNightMode.FORCE_NIGHT;

  const tamanhoBotao = { width: grade.largura, height: grade.altura };

  return (
    <View style={[estilos.tela, { backgroundColor: c.fundo, flexDirection: deitado ? 'row' : 'column' }]}>
      <View style={estilos.mapa}>
        {permissao === 'concedida' ? (
          <NavigationView
            style={StyleSheet.absoluteFill}
            navigationNightMode={modoNoturnoGoogle}
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

      <SafeAreaView
        edges={deitado ? ['right', 'bottom'] : ['bottom']}
        style={deitado ? { width: LARGURA_GRADE_DEITADO } : undefined}
      >
        {faixa && (
          <View
            accessibilityLiveRegion="polite"
            style={[
              estilos.faixa,
              { backgroundColor: c.superficie, borderColor: aviso ? c.verdePosto : c.alerta },
            ]}
          >
            <Icone nome={aviso ? 'socorro' : 'alerta'} tamanho={22} cor={aviso ? c.verdePosto : c.alerta} />
            <Texto style={[estilos.textoFaixa, { color: c.texto }]} maxFontSizeMultiplier={1.3}>
              {faixa}
            </Texto>
            {estado === 'erro' && !aviso && (
              <Pressable accessibilityRole="button" onPress={iniciar} hitSlop={12} style={estilos.tentar}>
                <Texto style={{ color: c.acao, fontFamily: fontes.textoForte }}>
                  {t('rota.tentarDeNovo')}
                </Texto>
              </Pressable>
            )}
          </View>
        )}

        <View style={[estilos.grade, { gap: grade.vao, padding: grade.margem }]} testID="grade-pilotando">
          {ordemAcoes.map((chave) => {
            if (chave === 'sos') {
              return (
                <BotaoSegurar
                  key={chave}
                  duracao={DURACAO_SOS}
                  rotulo={t('pilotando.sos')}
                  dica={t('pilotando.sosDica')}
                  corProgresso={c.sosPressionado}
                  aoCompletar={() => router.push('/sos')}
                  style={[
                    estilos.botao,
                    tamanhoBotao,
                    { backgroundColor: c.sos, borderWidth: 3, borderColor: c.contornoSos },
                  ]}
                >
                  <Texto style={[estilos.sos, { color: c.textoSobreSos }]} maxFontSizeMultiplier={1}>
                    SOS
                  </Texto>
                  <Texto
                    style={[estilos.textoBotao, { color: c.textoSobreSos }]}
                    maxFontSizeMultiplier={escalaMaxima.pilotando}
                  >
                    {t('pilotando.sosDica')}
                  </Texto>
                </BotaoSegurar>
              );
            }
            if (chave === 'encerrar') {
              return (
                <BotaoSegurar
                  key={chave}
                  duracao={DURACAO_ENCERRAR}
                  rotulo={t('pilotando.encerrar')}
                  dica={t('pilotando.encerrarDica')}
                  corProgresso={c.superficie3}
                  aoCompletar={() => void encerrar()}
                  style={[estilos.botao, tamanhoBotao, { borderWidth: 2, borderColor: c.linhaForte }]}
                >
                  <Icone nome="encerrar" tamanho={30} cor={c.texto} />
                  <Texto
                    style={[estilos.textoBotao, { color: c.texto }]}
                    maxFontSizeMultiplier={escalaMaxima.pilotando}
                  >
                    {t('pilotando.encerrarDica')}
                  </Texto>
                </BotaoSegurar>
              );
            }
            const a = acoes[chave];
            return (
              <Pressable
                key={chave}
                accessibilityRole="button"
                accessibilityLabel={t(`pilotando.${chave}`)}
                onPress={() => avisar(a.aviso)}
                style={({ pressed }) => [
                  estilos.botao,
                  tamanhoBotao,
                  { backgroundColor: a.fundo, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Icone nome={a.icone} tamanho={32} cor={a.corIcone} />
                <Texto
                  style={[estilos.textoBotao, { color: a.cor }]}
                  numberOfLines={2}
                  maxFontSizeMultiplier={escalaMaxima.pilotando}
                >
                  {t(`pilotando.${chave}`)}
                </Texto>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

/**
 * Modo pilotando (R1–R7): navegação do Google com o cartão de manobra em cima e 6 botões grandes
 * embaixo. Um toque para Alerta, Reagrupar e Postos; segurar para SOS (3 s) e Encerrar (1,5 s).
 */
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
  tela: { flex: 1 },
  mapa: { flex: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espaco.md, padding: espaco.xl },
  faixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    marginHorizontal: espaco.sm,
    marginTop: espaco.xs,
    paddingHorizontal: espaco.sm,
    paddingVertical: espaco.xs,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 2,
  },
  textoFaixa: { flex: 1, fontFamily: fontes.textoSemi, fontSize: 17, lineHeight: 22 },
  tentar: { minHeight: 48, justifyContent: 'center' },
  grade: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  botao: { borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 6 },
  sos: { fontFamily: fontes.textoForte, fontSize: 34, lineHeight: 38, letterSpacing: 1 },
  textoBotao: { fontSize: 17, fontFamily: fontes.textoForte, textAlign: 'center', lineHeight: 21 },
});
