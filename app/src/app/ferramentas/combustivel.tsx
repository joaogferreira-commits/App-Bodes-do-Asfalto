import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Campo, numero, Resultado, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { useGuardado } from '@/estado/guardado';
import { planoCombustivel } from '@/ferramentas/calculos';
import { espaco } from '@/theme';
import { Cartao, Texto } from '@/ui';

/** Autonomia, paradas para abastecer (com reserva de 15 %) e custo da viagem. */
export default function Combustivel() {
  const { t } = useTranslation();
  const [v, setV] = useGuardado('combustivel', {
    distancia: '300',
    tanque: '18',
    consumo: '18',
    preco: '6,29',
  });
  const muda = (k: keyof typeof v) => (x: string) => setV((a) => ({ ...a, [k]: x }));
  const p = planoCombustivel({
    distanciaKm: numero(v.distancia),
    tanqueL: numero(v.tanque),
    consumoKmL: numero(v.consumo),
    precoL: numero(v.preco),
  });
  return (
    <TelaFerramenta
      titulo={t('ferramentas.itens.combustivel.titulo')}
      explicacao={t('ferramentas.itens.combustivel.explicacao')}
    >
      <View style={{ flexDirection: 'row', gap: espaco.sm }}>
        <Campo
          rotulo={t('ferramentas.combustivel.distancia')}
          valor={v.distancia}
          aoMudar={muda('distancia')}
          teclado="numeric"
          sufixo="km"
        />
        <Campo
          rotulo={t('ferramentas.combustivel.tanque')}
          valor={v.tanque}
          aoMudar={muda('tanque')}
          teclado="numeric"
          sufixo="L"
        />
      </View>
      <View style={{ flexDirection: 'row', gap: espaco.sm }}>
        <Campo
          rotulo={t('ferramentas.combustivel.consumo')}
          valor={v.consumo}
          aoMudar={muda('consumo')}
          teclado="numeric"
          sufixo="km/L"
        />
        <Campo
          rotulo={t('ferramentas.combustivel.preco')}
          valor={v.preco}
          aoMudar={muda('preco')}
          teclado="numeric"
          sufixo="R$/L"
        />
      </View>
      <Cartao destaque style={{ gap: espaco.md }}>
        <View style={{ flexDirection: 'row' }}>
          <Resultado valor={`${p.autonomiaKm}`} rotulo={t('ferramentas.combustivel.autonomia')} />
          <Resultado valor={`${p.paradas}`} rotulo={t('ferramentas.combustivel.paradas')} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Resultado valor={`${p.litros}`} rotulo={t('ferramentas.combustivel.litros')} />
          <Resultado
            valor={`R$ ${p.custo.toFixed(2).replace('.', ',')}`}
            rotulo={t('ferramentas.combustivel.custo')}
          />
        </View>
        <Texto variante="secundario">{t('ferramentas.combustivel.dica', { km: p.abastecerACadaKm })}</Texto>
      </Cartao>
    </TelaFerramenta>
  );
}
