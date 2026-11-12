import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { Campo, numero, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { useGuardado } from '@/estado/guardado';
import { proximaManutencao } from '@/ferramentas/calculos';
import { espaco, useCores } from '@/theme';
import { Botao, Cartao, Icone, Texto } from '@/ui';

export type ItemManutencao = { id: string; nome: string; intervalo: string; ultimo: string };

/** Itens iniciais: o nome vem da tradução (chave) até o irmão renomear. */
const iniciais: ItemManutencao[] = [
  { id: 'oleo', nome: '', intervalo: '3000', ultimo: '23000' },
  { id: 'relacao', nome: '', intervalo: '20000', ultimo: '12000' },
  { id: 'pneuTraseiro', nome: '', intervalo: '12000', ultimo: '18000' },
  { id: 'pneuDianteiro', nome: '', intervalo: '18000', ultimo: '18000' },
  { id: 'pastilhas', nome: '', intervalo: '10000', ultimo: '20000' },
  { id: 'revisao', nome: '', intervalo: '10000', ultimo: '20000' },
];

/**
 * Diário de manutenção: km atual da moto e, para cada item, nome, intervalo e km da última troca —
 * tudo editável (pedido do dono em 12/11). Avisa o que venceu ou está a menos de 500 km.
 */
export default function Manutencao() {
  const { t } = useTranslation();
  const cores = useCores();
  const [kmAtual, setKmAtual] = useGuardado('motoKm', '25000');
  const [itens, setItens] = useGuardado<ItemManutencao[]>('manutencaoItens', iniciais);
  const muda = (id: string, campo: keyof ItemManutencao) => (v: string) =>
    setItens((l) => l.map((x) => (x.id === id ? { ...x, [campo]: v } : x)));
  const nomeDe = (i: ItemManutencao) =>
    i.nome || (iniciais.some((x) => x.id === i.id) ? t(`ferramentas.manutencao.servicos.${i.id}`) : '');

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
      {itens.map((s) => {
        const p = proximaManutencao({
          ultimoKm: numero(s.ultimo),
          intervaloKm: numero(s.intervalo),
          kmAtual: numero(kmAtual),
        });
        const perto = !p.vencida && p.falta <= 500;
        const cor = p.vencida ? cores.sos : perto ? cores.alerta : cores.verdePosto;
        return (
          <Cartao key={s.id} style={{ gap: espaco.xs, borderColor: p.vencida || perto ? cor : cores.linha }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.xs }}>
              <Icone nome={p.vencida ? 'alerta' : 'oficina'} cor={cor} />
              <Texto style={{ color: cor, flex: 1 }}>
                {p.vencida
                  ? t('ferramentas.manutencao.vencida', { km: Math.abs(p.falta).toLocaleString('pt-BR') })
                  : t('ferramentas.manutencao.falta', {
                      km: p.falta.toLocaleString('pt-BR'),
                      proximo: p.proximoKm.toLocaleString('pt-BR'),
                    })}
              </Texto>
            </View>
            <Campo rotulo={t('ferramentas.manutencao.nome')} valor={nomeDe(s)} aoMudar={muda(s.id, 'nome')} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm }}>
              <Campo
                rotulo={t('ferramentas.manutencao.intervalo')}
                valor={s.intervalo}
                aoMudar={muda(s.id, 'intervalo')}
                teclado="numeric"
                sufixo="km"
              />
              <Campo
                rotulo={t('ferramentas.manutencao.ultimoKm')}
                valor={s.ultimo}
                aoMudar={muda(s.id, 'ultimo')}
                teclado="numeric"
                sufixo="km"
              />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
              <View style={{ flex: 1, minWidth: 140 }}>
                <Botao
                  titulo={t('ferramentas.manutencao.fizHoje')}
                  variante="secundario"
                  icone="check"
                  onPress={() => muda(s.id, 'ultimo')(kmAtual)}
                />
              </View>
              <View style={{ flex: 1, minWidth: 140 }}>
                <Botao
                  titulo={t('comentarios.apagar')}
                  variante="contorno"
                  onPress={() =>
                    Alert.alert(t('ferramentas.manutencao.apagarPergunta', { nome: nomeDe(s) }), undefined, [
                      { text: t('comum.cancelar'), style: 'cancel' },
                      {
                        text: t('comentarios.apagar'),
                        style: 'destructive',
                        onPress: () => setItens((l) => l.filter((x) => x.id !== s.id)),
                      },
                    ])
                  }
                />
              </View>
            </View>
          </Cartao>
        );
      })}
      <Botao
        titulo={t('ferramentas.manutencao.novo')}
        icone="mais"
        grande
        onPress={() =>
          setItens((l) => [
            ...l,
            {
              id: `item-${Date.now()}`,
              nome: t('ferramentas.manutencao.novoNome'),
              intervalo: '5000',
              ultimo: kmAtual,
            },
          ])
        }
      />
    </TelaFerramenta>
  );
}
