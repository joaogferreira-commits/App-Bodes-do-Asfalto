import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Campo, numero, Resultado, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { perfilExemplo } from '@/dados/perfil';
import { useGuardado } from '@/estado/guardado';
import { progressoMeta } from '@/ferramentas/calculos';
import { espaco, useCores } from '@/theme';
import { Cartao, Texto } from '@/ui';

/** Meta pessoal de km no ano (sem pressa: conta km rodados, nunca velocidade). */
export default function Meta() {
  const { t } = useTranslation();
  const cores = useCores();
  const [meta, setMeta] = useGuardado('metaKm', '10000');
  const feito = perfilExemplo.numeros.kmAno;
  const p = progressoMeta({ metaKm: numero(meta), feitoKm: feito, hoje: new Date() });
  return (
    <TelaFerramenta
      titulo={t('ferramentas.itens.meta.titulo')}
      explicacao={t('ferramentas.itens.meta.explicacao')}
    >
      <Campo
        rotulo={t('ferramentas.meta.meta')}
        valor={meta}
        aoMudar={setMeta}
        teclado="numeric"
        sufixo="km"
      />
      <Cartao destaque style={{ gap: espaco.md }}>
        <View style={{ height: 14, borderRadius: 7, backgroundColor: cores.superficie3, overflow: 'hidden' }}>
          <View
            style={{ width: `${Math.round(p.fracao * 100)}%`, height: '100%', backgroundColor: cores.ouro }}
          />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Resultado valor={feito.toLocaleString('pt-BR')} rotulo={t('ferramentas.meta.feito')} />
          <Resultado valor={p.falta.toLocaleString('pt-BR')} rotulo={t('ferramentas.meta.falta')} />
          <Resultado valor={p.porSemana.toLocaleString('pt-BR')} rotulo={t('ferramentas.meta.porSemana')} />
        </View>
      </Cartao>
      <Texto variante="secundario">{t('ferramentas.meta.dica')}</Texto>
    </TelaFerramenta>
  );
}
