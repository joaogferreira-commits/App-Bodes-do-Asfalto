import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch, View } from 'react-native';

import { clienteConsultas } from '@/servidor/consulta';
import { CHAVE_RANKING, definirForaDoRanking } from '@/servidor/desafios';
import { CHAVE_MEU_PROGRESSO, useMeuProgresso } from '@/servidor/useGamificacao';
import { espaco, useCores } from '@/theme';
import { Icone, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

/** "Sair do ranking" (só no modo servidor): continua com XP e selos, mas não aparece na lista. */
export function SairDoRanking() {
  const { t } = useTranslation();
  const cores = useCores();
  const { servidor, dados } = useMeuProgresso();
  const [otimista, setOtimista] = useState<boolean | null>(null);
  if (!servidor) return null;
  const fora = otimista ?? dados?.foraDoRanking ?? false;

  const mudar = async (v: boolean) => {
    setOtimista(v);
    const ok = await definirForaDoRanking(v);
    if (!ok) {
      setOtimista(null);
      return avisar(t('conquistas.sairRankingErro'));
    }
    await clienteConsultas.invalidateQueries({ queryKey: CHAVE_MEU_PROGRESSO });
    await clienteConsultas.invalidateQueries({ queryKey: CHAVE_RANKING });
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: espaco.sm,
        padding: espaco.md,
        minHeight: 64,
      }}
    >
      <Icone nome="trofeu" tamanho={24} cor={cores.acao} />
      <View style={{ flex: 1 }}>
        <Texto variante="corpoForte">{t('conquistas.sairRanking')}</Texto>
        <Texto variante="secundario">{t('conquistas.sairRankingDetalhe')}</Texto>
      </View>
      <Switch
        accessibilityLabel={t('conquistas.sairRanking')}
        value={fora}
        onValueChange={(v) => void mudar(v)}
        trackColor={{ false: cores.linhaForte, true: cores.acao }}
      />
    </View>
  );
}
