import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  modosVisibilidade,
  statusMapa,
  temporarioAtivo,
  type EstadoVisibilidade,
  type ModoVisibilidade,
  type StatusMapa,
} from '@/estado/visibilidadeMapa';
import { espaco, raios, toque, useCores, useEstilos, type Paleta } from '@/theme';
import { Botao, Chip, Icone, Texto } from '@/ui';

type Props = {
  aberto: boolean;
  estado: EstadoVisibilidade;
  modoAtual: ModoVisibilidade;
  aoEscolher: (modo: ModoVisibilidade, temporario: boolean) => void;
  aoMudarStatus: (status: StatusMapa) => void;
  aoFechar: () => void;
};

/** Folha para escolher como o irmão aparece no mapa: 5 modos, modo de 2 h e status. */
export function SeletorVisibilidade({
  aberto,
  estado,
  modoAtual,
  aoEscolher,
  aoMudarStatus,
  aoFechar,
}: Props) {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const temporario = temporarioAtivo(estado);
  return (
    <Modal transparent visible={aberto} animationType="slide" onRequestClose={aoFechar}>
      <Pressable
        style={estilos.fundo}
        accessibilityRole="button"
        accessibilityLabel={t('mapa.visib.fechar')}
        onPress={aoFechar}
      />
      <View style={estilos.folha}>
        <Texto variante="titulo">{t('mapa.visibilidade')}</Texto>
        <ScrollView contentContainerStyle={{ gap: espaco.xs }}>
          {modosVisibilidade.map((m) => {
            const marcado = modoAtual === m;
            return (
              <Pressable
                key={m}
                accessibilityRole="radio"
                accessibilityState={{ selected: marcado }}
                accessibilityLabel={t(`mapa.visib.modos.${m}`)}
                onPress={() => aoEscolher(m, temporario)}
                style={[estilos.opcao, marcado && { borderColor: cores.acao }]}
              >
                <View style={{ flex: 1 }}>
                  <Texto variante="corpoForte">{t(`mapa.visib.modos.${m}`)}</Texto>
                  <Texto variante="secundario">{t(`mapa.visib.desc.${m}`)}</Texto>
                </View>
                {marcado && <Icone nome="check" tamanho={22} cor={cores.acao} />}
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: temporario }}
            accessibilityLabel={t('mapa.visib.temporario')}
            onPress={() => aoEscolher(modoAtual, !temporario)}
            style={[estilos.opcao, temporario && { borderColor: cores.acao }]}
          >
            <View style={{ flex: 1 }}>
              <Texto variante="corpoForte">{t('mapa.visib.temporario')}</Texto>
              <Texto variante="secundario">{t('mapa.visib.temporarioDesc')}</Texto>
            </View>
            {temporario && <Icone nome="check" tamanho={22} cor={cores.acao} />}
          </Pressable>
          <Texto variante="rotulo">{t('mapa.visib.status')}</Texto>
          <View style={estilos.chips}>
            {statusMapa.map((s) => (
              <Chip
                key={s}
                rotulo={t(`mapa.visib.statusNomes.${s}`)}
                ativo={estado.status === s}
                onPress={() => aoMudarStatus(s)}
              />
            ))}
          </View>
        </ScrollView>
        <Botao titulo={t('mapa.visib.pronto')} onPress={aoFechar} />
      </View>
    </Modal>
  );
}

const criarEstilos = (c: Paleta) =>
  StyleSheet.create({
    fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
    folha: {
      maxHeight: '85%',
      backgroundColor: c.superficie,
      borderTopLeftRadius: raios.cartao,
      borderTopRightRadius: raios.cartao,
      padding: espaco.md,
      gap: espaco.sm,
    },
    opcao: {
      minHeight: toque.minimo,
      flexDirection: 'row',
      alignItems: 'center',
      gap: espaco.sm,
      padding: espaco.sm,
      borderRadius: raios.botao,
      borderWidth: 2,
      borderColor: c.linha,
      backgroundColor: c.superficie2,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs },
  });
