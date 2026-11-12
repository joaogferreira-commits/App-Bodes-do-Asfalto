import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Campo, numero, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { useGuardado } from '@/estado/guardado';
import { proximaManutencao } from '@/ferramentas/calculos';
import { espaco, useCores } from '@/theme';
import { Botao, Cartao, Icone, Texto } from '@/ui';

const servicos: { chave: string; intervalo: number }[] = [
  { chave: 'oleo', intervalo: 3000 },
  { chave: 'relacao', intervalo: 20000 },
  { chave: 'pneuTraseiro', intervalo: 12000 },
  { chave: 'pneuDianteiro', intervalo: 18000 },
  { chave: 'pastilhas', intervalo: 10000 },
  { chave: 'revisao', intervalo: 10000 },
];

/** Diário de manutenção: km atual e km da última troca de cada item; avisa o que está vencendo. */
export default function Manutencao() {
  const { t } = useTranslation();
  const cores = useCores();
  const [kmAtual, setKmAtual] = useGuardado('motoKm', '25000');
  const [ultimos, setUltimos] = useGuardado<Record<string, string>>('manutencao', {
    oleo: '23000',
    relacao: '12000',
    pneuTraseiro: '18000',
    pneuDianteiro: '18000',
    pastilhas: '20000',
    revisao: '20000',
  });
  return (
    <TelaFerramenta
      titulo={t('ferramentas.itens.manutencao.titulo')}
      explicacao={t('ferramentas.itens.manutencao.explicacao')}
    >
      <Campo
        rotulo={t('ferramentas.manutencao.kmAtual')}
        valor={kmAtual}
        aoMudar={setKmAtual}
        teclado="numeric"
        sufixo="km"
      />
      {servicos.map((s) => {
        const p = proximaManutencao({
          ultimoKm: numero(ultimos[s.chave] ?? '0'),
          intervaloKm: s.intervalo,
          kmAtual: numero(kmAtual),
        });
        const perto = !p.vencida && p.falta <= 500;
        const cor = p.vencida ? cores.sos : perto ? cores.alerta : cores.verdePosto;
        return (
          <Cartao
            key={s.chave}
            style={{ gap: espaco.xs, borderColor: p.vencida || perto ? cor : cores.linha }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.xs }}>
              <Icone nome={p.vencida ? 'alerta' : 'oficina'} cor={cor} />
              <Texto variante="destaque" style={{ flex: 1 }}>
                {t(`ferramentas.manutencao.servicos.${s.chave}`)}
              </Texto>
            </View>
            <Texto style={{ color: cor }}>
              {p.vencida
                ? t('ferramentas.manutencao.vencida', { km: Math.abs(p.falta).toLocaleString('pt-BR') })
                : t('ferramentas.manutencao.falta', {
                    km: p.falta.toLocaleString('pt-BR'),
                    proximo: p.proximoKm.toLocaleString('pt-BR'),
                  })}
            </Texto>
            <Campo
              rotulo={t('ferramentas.manutencao.ultimaTroca', {
                intervalo: s.intervalo.toLocaleString('pt-BR'),
              })}
              valor={ultimos[s.chave] ?? ''}
              aoMudar={(v) => setUltimos((u) => ({ ...u, [s.chave]: v }))}
              teclado="numeric"
              sufixo="km"
            />
            <Botao
              titulo={t('ferramentas.manutencao.fizHoje')}
              variante="secundario"
              icone="check"
              onPress={() => setUltimos((u) => ({ ...u, [s.chave]: kmAtual }))}
            />
          </Cartao>
        );
      })}
    </TelaFerramenta>
  );
}
