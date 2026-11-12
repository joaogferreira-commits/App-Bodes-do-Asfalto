import '@/i18n';

import { BarlowCondensed_600SemiBold, BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';

import { AberturaAnimada } from '@/componentes/AberturaAnimada';
import { Redirect, router, Stack, useSegments } from 'expo-router';
import { Fragment } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { RegistroNotificacoes } from '@/componentes/RegistroNotificacoes';
import { ProvedorAcesso, useAcesso } from '@/acesso/acesso';
import { ProvedorAgapes } from '@/estado/agapes';
import { ProvedorAvatar } from '@/estado/avatar';
import { ProvedorClassificados } from '@/estado/classificados';
import { ProvedorMeusPosts } from '@/estado/meusPosts';
import { ProvedorPerfil } from '@/estado/perfil';
import { ProvedorConversas } from '@/estado/conversas';
import { ProvedorViagem } from '@/estado/viagem';
import { TelaEmMovimento } from '@/seguranca/TelaEmMovimento';
import { useBloqueioEmMovimento } from '@/seguranca/useBloqueioEmMovimento';
import { paletaNoite, ProvedorTema, useTema } from '@/theme';

export default function Layout() {
  const [carregou] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  if (!carregou) return <View style={{ flex: 1, backgroundColor: paletaNoite.fundo }} />;
  return (
    <ProvedorTema>
      <ProvedorAcesso>
        <ArvoreDaSessao>
          <ProvedorAvatar>
            <ProvedorPerfil>
              <ProvedorAgapes>
                <ProvedorMeusPosts>
                  <ProvedorClassificados>
                    <ProvedorViagem>
                      <ProvedorConversas>
                        <Telas />
                      </ProvedorConversas>
                    </ProvedorViagem>
                  </ProvedorClassificados>
                </ProvedorMeusPosts>
              </ProvedorAgapes>
            </ProvedorPerfil>
          </ProvedorAvatar>
        </ArvoreDaSessao>
      </ProvedorAcesso>
      <AberturaAnimada />
    </ProvedorTema>
  );
}

/** Remonta os dados da pessoa a cada sessão (sair/excluir não deixa nada na memória). */
function ArvoreDaSessao({ children }: { children: React.ReactNode }) {
  const { sessao } = useAcesso();
  return <Fragment key={sessao}>{children}</Fragment>;
}

/**
 * Guarda de acesso para TODAS as telas: quem não é membro aprovado só fica em "acesso/*";
 * o membro que cai numa tela de entrada volta para o mapa.
 */
function GuardaDeAcesso() {
  const { estado } = useAcesso();
  const segmentos = useSegments() as string[];
  const naEntrada = segmentos[0] === 'acesso';
  const telaLivreParaMembro = segmentos[1] === 'meus-dados' || segmentos[1] === 'consentimentos';
  if (estado === 'carregando') return null;
  if (estado !== 'membro' && !naEntrada) {
    const destino =
      estado === 'deslogado'
        ? '/acesso/entrada'
        : estado === 'pendente'
          ? '/acesso/espera'
          : '/acesso/consentimentos';
    return <Redirect href={destino} />;
  }
  if (estado === 'membro' && naEntrada && !telaLivreParaMembro) return <Redirect href="/" />;
  return null;
}

/** Telas que continuam liberadas com a moto andando (as abas têm a própria trava). */
const LIVRES_EM_MOVIMENTO = ['(abas)', 'pilotando', 'sos', 'rota', 'acesso'];

/** Trava em movimento (R3) para as telas fora das abas: classificados, garagem, publicar, ferramentas… */
function TravaEmMovimento() {
  const emMovimento = useBloqueioEmMovimento();
  const segmentos = useSegments() as string[];
  if (!emMovimento || LIVRES_EM_MOVIMENTO.includes(segmentos[0] ?? '(abas)')) return null;
  return (
    <View style={StyleSheet.absoluteFill}>
      <TelaEmMovimento aoIrAoMapa={() => router.navigate('/')} />
    </View>
  );
}

function Telas() {
  const { modo, cores } = useTema();
  return (
    <>
      <StatusBar style={modo === 'sol' ? 'dark' : 'light'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }} />
      <TravaEmMovimento />
      <GuardaDeAcesso />
      <RegistroNotificacoes />
    </>
  );
}
