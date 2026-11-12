import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Switch, View } from 'react-native';

import { TelaFerramenta } from '@/componentes/TelaFerramenta';
import {
  carregarPreferencias,
  salvarPreferencia,
  TIPO_SEMPRE_LIGADO,
  TIPOS_NOTIFICACAO,
  type TipoNotificacao,
} from '@/servidor/notificacoes';
import { espaco, useCores } from '@/theme';
import { Cartao, Texto } from '@/ui';

/** Liga/desliga por tipo de aviso. O SOS fica sempre ligado. A prévia nunca mostra o texto das mensagens. */
export default function Notificacoes() {
  const { t } = useTranslation();
  const cores = useCores();
  const [prefs, setPrefs] = useState<Record<TipoNotificacao, boolean> | null>(null);

  useEffect(() => {
    let vivo = true;
    void carregarPreferencias()
      .then((p) => vivo && setPrefs(p))
      .catch(() => {
        if (!vivo) return;
        setPrefs(
          Object.fromEntries(TIPOS_NOTIFICACAO.map((k) => [k, true])) as Record<TipoNotificacao, boolean>,
        );
        Alert.alert(t('notificacoes.erroCarregar'));
      });
    return () => {
      vivo = false;
    };
  }, [t]);

  const mudar = useCallback(
    async (tipo: TipoNotificacao, ligado: boolean) => {
      if (tipo === TIPO_SEMPRE_LIGADO) return;
      setPrefs((p) => (p ? { ...p, [tipo]: ligado } : p));
      try {
        await salvarPreferencia(tipo, ligado);
      } catch {
        setPrefs((p) => (p ? { ...p, [tipo]: !ligado } : p));
        Alert.alert(t('notificacoes.erroSalvar'));
      }
    },
    [t],
  );

  return (
    <TelaFerramenta titulo={t('notificacoes.titulo')} explicacao={t('notificacoes.explica')}>
      <Cartao style={{ gap: espaco.md }}>
        {TIPOS_NOTIFICACAO.map((tipo) => {
          const fixo = tipo === TIPO_SEMPRE_LIGADO;
          return (
            <View
              key={tipo}
              style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm, minHeight: 56 }}
            >
              <View style={{ flex: 1 }}>
                <Texto variante="corpoForte">{t(`notificacoes.tipos.${tipo}`)}</Texto>
                <Texto variante="secundario">
                  {fixo ? t('notificacoes.sosFixo') : t(`notificacoes.detalhes.${tipo}`)}
                </Texto>
              </View>
              <Switch
                accessibilityLabel={t(`notificacoes.tipos.${tipo}`)}
                value={prefs ? prefs[tipo] : true}
                disabled={fixo || !prefs}
                onValueChange={(v) => void mudar(tipo, v)}
                trackColor={{ false: cores.linhaForte, true: cores.acao }}
              />
            </View>
          );
        })}
      </Cartao>
      <Texto variante="pequeno">{t('notificacoes.privacidade')}</Texto>
    </TelaFerramenta>
  );
}
