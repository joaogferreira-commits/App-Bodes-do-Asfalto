import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { atalhos } from './atalhos';
import { avisar } from '@/ui/dialogo';

/**
 * Atalhos do SOS (pedido do dono em 12/11/2026):
 * - segurar o ícone do app mostra "Pedir ajuda (SOS)" (Android; no iPhone entra com a versão para iPhone);
 * - no primeiro uso pergunta se o irmão quer o atalho fixo na tela inicial (Android; o sistema confirma);
 * - no iPhone explica uma vez o atalho de segurar o ícone.
 */
export function useAtalhosSOS() {
  const { t } = useTranslation();

  useEffect(() => {
    // segurar o ícone do app mostra "Pedir ajuda (SOS)" (abre bodesdoasfalto://sos)
    void atalhos.definirAtalhoDoIcone(t('sos.botaoAjuda'));
  }, [t]);

  useEffect(() => {
    void (async () => {
      const chave = 'bodes.perguntouAtalhoSOS';
      if ((await AsyncStorage.getItem(chave).catch(() => '1')) != null) return;
      await AsyncStorage.setItem(chave, '1').catch(() => undefined);
      if (Platform.OS === 'android' && (await atalhos.podeFixarAtalho())) {
        avisar(t('atalhos.perguntaTitulo'), t('atalhos.perguntaTexto'), [
          { text: t('atalhos.agoraNao'), style: 'cancel' },
          { text: t('atalhos.colocar'), onPress: () => void atalhos.fixarAtalhoSOS(t('atalhos.nomeAtalho')) },
        ]);
      } else if (Platform.OS === 'ios') {
        avisar(t('atalhos.perguntaTitulo'), t('atalhos.iphoneTexto'));
      }
    })();
    // pergunta uma vez só, no primeiro uso
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
