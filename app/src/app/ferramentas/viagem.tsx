import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Campo, numero, Resultado, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { useGuardado } from '@/estado/guardado';
import { planoViagemLonga } from '@/ferramentas/calculos';
import { espaco } from '@/theme';
import { Cartao, Texto } from '@/ui';

/** Viagem longa em etapas: quantos dias, km e horas por dia, pausas contra a fadiga. */
export default function ViagemLonga() {
  const { t } = useTranslation();
  const [v, setV] = useGuardado('viagemLonga', { distancia: '1800', porDia: '450' });
  const p = planoViagemLonga({ distanciaKm: numero(v.distancia), kmPorDia: numero(v.porDia) });
  return (
    <TelaFerramenta
      titulo={t('ferramentas.itens.viagem.titulo')}
      explicacao={t('ferramentas.itens.viagem.explicacao')}
    >
      <View style={{ flexDirection: 'row', gap: espaco.sm }}>
        <Campo
          rotulo={t('ferramentas.viagem.total')}
          valor={v.distancia}
          aoMudar={(x) => setV((a) => ({ ...a, distancia: x }))}
          teclado="numeric"
          sufixo="km"
        />
        <Campo
          rotulo={t('ferramentas.viagem.porDia')}
          valor={v.porDia}
          aoMudar={(x) => setV((a) => ({ ...a, porDia: x }))}
          teclado="numeric"
          sufixo="km"
        />
      </View>
      <Cartao destaque style={{ gap: espaco.md }}>
        <View style={{ flexDirection: 'row' }}>
          <Resultado valor={`${p.dias}`} rotulo={t('ferramentas.viagem.dias')} />
          <Resultado valor={`${p.kmDia}`} rotulo={t('ferramentas.viagem.kmDia')} />
          <Resultado valor={`${p.horasDia}`} rotulo={t('ferramentas.viagem.horasDia')} />
        </View>
        <Texto variante="secundario">{t('ferramentas.viagem.pausas', { n: p.pausasDia })}</Texto>
      </Cartao>
      <Texto variante="secundario">{t('ferramentas.viagem.dica')}</Texto>
    </TelaFerramenta>
  );
}
