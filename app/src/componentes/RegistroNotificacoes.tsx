import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useAcesso } from '@/acesso/acesso';
import { servidorConfigurado } from '@/servidor/supabase';
import { permissaoConcedida, registrarToken, rotaDaNotificacao } from '@/servidor/notificacoes';
import { avisar } from '@/ui/dialogo';

const CHAVE_EXPLICOU = 'notificacoes:explicou';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Sem tela: depois do login do membro, explica para que servem os avisos e só então pede a permissão
 * do sistema (uma vez). Registra o token e abre a tela certa ao tocar numa notificação.
 */
export function RegistroNotificacoes() {
  const { t } = useTranslation();
  const { estado } = useAcesso();

  useEffect(() => {
    if (!servidorConfigurado || estado !== 'membro') return;
    let vivo = true;
    void (async () => {
      try {
        const jaConcedida = await permissaoConcedida(false);
        let pedir = false;
        if (!jaConcedida && !(await AsyncStorage.getItem(CHAVE_EXPLICOU))) {
          await AsyncStorage.setItem(CHAVE_EXPLICOU, '1');
          pedir = await new Promise<boolean>((resolve) =>
            avisar(t('notificacoes.permissaoTitulo'), t('notificacoes.permissaoTexto'), [
              { text: t('notificacoes.agoraNao'), style: 'cancel', onPress: () => resolve(false) },
              { text: t('notificacoes.permitir'), onPress: () => resolve(true) },
            ]),
          );
        }
        if (vivo) await registrarToken({ pedirPermissao: pedir });
      } catch {
        // sem rede ou projeto sem push: tenta de novo na próxima abertura
      }
    })();
    return () => {
      vivo = false;
    };
  }, [estado, t]);

  useEffect(() => {
    if (estado !== 'membro') return;
    const abrir = (r: Notifications.NotificationResponse | null) => {
      const rota = rotaDaNotificacao(r);
      if (rota) router.push(rota as Href);
    };
    abrir(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(abrir);
    return () => sub.remove();
  }, [estado]);

  return null;
}
