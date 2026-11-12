import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAcesso } from '@/acesso/acesso';
import { Campo } from '@/componentes/TelaFerramenta';
import { espaco, tema, useCores } from '@/theme';
import { Botao, Divisoria, Texto } from '@/ui';

/** Boas-vindas e login: e-mail com link mágico, Google e Apple (sem SMS). */
export default function Entrada() {
  const { t } = useTranslation();
  const cores = useCores();
  const acesso = useAcesso();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const depoisDeEntrar = () => router.replace('/acesso/consentimentos');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        <Image
          source={require('../../../assets/marca/logo-plana.png')}
          style={estilos.mascote}
          contentFit="contain"
          accessible={false}
        />
        <Texto variante="titulo" style={estilos.centro}>
          {tema.marca.nome}
        </Texto>
        <Texto style={estilos.centro}>{t('acesso.boasVindas')}</Texto>

        {enviado ? (
          <View style={{ gap: espaco.sm }}>
            <Texto variante="destaque" style={estilos.centro}>
              {t('acesso.linkEnviado', { email: email.trim() })}
            </Texto>
            <Texto variante="secundario" style={estilos.centro}>
              {t('acesso.linkExplica')}
            </Texto>
            <Botao
              titulo={t('acesso.jaCliquei')}
              grande
              onPress={() =>
                acesso.modo === 'supabase'
                  ? void acesso.atualizar().then(depoisDeEntrar)
                  : void acesso.entrar('email', email.trim()).then(depoisDeEntrar)
              }
            />
            <Botao titulo={t('acesso.outroEmail')} variante="contorno" onPress={() => setEnviado(false)} />
          </View>
        ) : (
          <View style={{ gap: espaco.sm }}>
            <Campo rotulo={t('acesso.email')} valor={email} aoMudar={setEmail} teclado="email-address" />
            <Botao
              titulo={t('acesso.receberLink')}
              grande
              desativado={!emailValido}
              onPress={() =>
                acesso.modo === 'supabase'
                  ? void acesso
                      .entrar('email', email.trim())
                      .then(() => setEnviado(true))
                      .catch(() => Alert.alert(t('acesso.erroLink')))
                  : setEnviado(true)
              }
            />
            <Divisoria />
            <Botao
              titulo={t('acesso.google')}
              variante="secundario"
              grande
              onPress={() =>
                void acesso
                  .entrar('google')
                  .then(depoisDeEntrar)
                  .catch(() => Alert.alert(t('acesso.erroGoogle')))
              }
            />
            {Platform.OS === 'ios' && (
              <Botao
                titulo={t('acesso.apple')}
                variante="secundario"
                grande
                onPress={() => void acesso.entrar('apple').then(depoisDeEntrar)}
              />
            )}
          </View>
        )}

        <Texto variante="secundario" style={estilos.centro}>
          {t('acesso.soMembros')}
        </Texto>
        {/* Só na versão de teste (sem servidor). Com o Supabase, os revisores usam uma conta de demonstração real. */}
        {acesso.modo === 'local' && (
          <>
            <Botao
              titulo={t('acesso.demonstracao')}
              variante="contorno"
              onPress={() => {
                acesso.entrarDemonstracao();
                router.replace('/acesso/consentimentos');
              }}
            />
            <Texto variante="pequeno" style={estilos.centro}>
              {t('acesso.modoLocal')}
            </Texto>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: espaco.xl, gap: espaco.md, paddingBottom: espaco.xxxl },
  mascote: { width: 150, height: 186, alignSelf: 'center' },
  centro: { textAlign: 'center' },
});
