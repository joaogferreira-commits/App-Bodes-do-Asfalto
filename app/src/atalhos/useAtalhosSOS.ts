import * as QuickActions from 'expo-quick-actions';
import { useQuickActionRouting } from 'expo-quick-actions/router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { atalhos } from './atalhos';

/**
 * Atalhos do SOS (pedido do dono em 12/11/2026):
 * - segurar o ícone do app mostra "Pedir ajuda (SOS)" (Android e iPhone);
 * - no primeiro uso pergunta se o irmão quer o atalho fixo na tela inicial (Android; o sistema confirma);
 * - no iPhone explica uma vez o atalho de segurar o ícone.
 */
export function useAtalhosSOS() {
  const { t } = useTranslation();
  useQuickActionRouting();

  useEffect(() => {
    void QuickActions.setItems([
      {
        id: 'sos',
        title: t('sos.botaoAjuda'),
        icon: Platform.OS === 'ios' ? 'symbol:sos.circle.fill' : undefined,
        params: { href: '/sos' },
      },
    ]).catch(() => undefined);
  }, [t]);

  useEffect(() => {
    void (async () => {
      const chave = 'bodes.perguntouAtalhoSOS';
      if ((await AsyncStorage.getItem(chave).catch(() => '1')) != null) return;
      await AsyncStorage.setItem(chave, '1').catch(() => undefined);
      if (Platform.OS === 'android' && (await atalhos.podeFixarAtalho())) {
        Alert.alert(t('atalhos.perguntaTitulo'), t('atalhos.perguntaTexto'), [
          { text: t('atalhos.agoraNao'), style: 'cancel' },
          { text: t('atalhos.colocar'), onPress: () => void atalhos.fixarAtalhoSOS(t('atalhos.nomeAtalho')) },
        ]);
      } else if (Platform.OS === 'ios') {
        Alert.alert(t('atalhos.perguntaTitulo'), t('atalhos.iphoneTexto'));
      }
    })();
    // pergunta uma vez só, no primeiro uso
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
