import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAcesso } from '@/acesso/acesso';
import { espaco, useCores } from '@/theme';
import { Botao, Cartao, Texto } from '@/ui';

/** Pendente só vê esta tela até a diretoria (ou a moderação) aprovar. */
export default function Espera() {
  const { t } = useTranslation();
  const cores = useCores();
  const acesso = useAcesso();
  const s = acesso.solicitacao;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <Image
          source={require('../../../assets/gerados/mascote/mascote-bodinho.webp')}
          style={estilos.mascote}
          contentFit="contain"
          accessible={false}
        />
        <Texto variante="titulo" style={estilos.centro}>
          {t('acesso.espera.titulo')}
        </Texto>
        <Texto style={estilos.centro}>{t('acesso.espera.texto', { capitulo: s?.capitulo ?? '' })}</Texto>
        {s && (
          <Cartao style={{ gap: 4 }}>
            <Texto variante="corpoForte">{s.nome}</Texto>
            <Texto variante="secundario">
              {t('acesso.espera.resumo', { capitulo: s.capitulo, indicado: s.indicadoPor })}
            </Texto>
          </Cartao>
        )}
        <Texto variante="secundario" style={estilos.centro}>
          {t('acesso.espera.aviso')}
        </Texto>
        <Botao
          titulo={t('acesso.espera.corrigir')}
          variante="secundario"
          onPress={() => {
            acesso.corrigirSolicitacao();
            router.replace('/acesso/solicitacao');
          }}
        />
        {acesso.modo === 'local' && (
          <Botao
            titulo={t('acesso.espera.simular')}
            variante="contorno"
            onPress={() => {
              acesso.simularAprovacao();
              router.replace('/');
            }}
          />
        )}
        <Botao
          titulo={t('perfil.sair')}
          variante="contorno"
          onPress={() => {
            void acesso.sair().then(() => router.replace('/acesso/entrada'));
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: espaco.xl, gap: espaco.md },
  mascote: { width: 160, height: 160, alignSelf: 'center' },
  centro: { textAlign: 'center' },
});
