import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { useAcesso } from '@/acesso/acesso';
import { concluirCodigo } from '@/servidor/auth';
import { espaco, useCores } from '@/theme';
import { Botao, Texto } from '@/ui';

/** Volta do link mágico ou do Google (bodesdoasfalto://acesso/retorno?code=...). */
export default function Retorno() {
  const { t } = useTranslation();
  const cores = useCores();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { atualizar } = useAcesso();
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      const ok = code ? await concluirCodigo(code).catch(() => false) : false;
      if (!vivo) return;
      if (!ok) return setFalhou(true);
      await atualizar();
      router.replace('/acesso/consentimentos');
    })();
    return () => {
      vivo = false;
    };
  }, [code, atualizar]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: cores.fundo,
        justifyContent: 'center',
        padding: espaco.lg,
        gap: espaco.md,
      }}
    >
      {falhou ? (
        <>
          <Texto variante="subtitulo" style={{ textAlign: 'center' }}>
            {t('acesso.retornoFalhou')}
          </Texto>
          <Texto variante="secundario" style={{ textAlign: 'center' }}>
            {t('acesso.retornoFalhouExplica')}
          </Texto>
          <Botao
            titulo={t('acesso.voltarEntrada')}
            grande
            onPress={() => router.replace('/acesso/entrada')}
          />
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={cores.acao} />
          <Texto style={{ textAlign: 'center' }}>{t('acesso.entrando')}</Texto>
        </>
      )}
    </View>
  );
}
