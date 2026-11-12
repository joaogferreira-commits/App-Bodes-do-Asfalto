import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { PanResponder, Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { espaco, raios, sombra, useEstilos, type Paleta } from '@/theme';

import { Icone } from './icones';

const criarEstilos = (c: Paleta) =>
  StyleSheet.create({
    painel: {
      backgroundColor: c.superficie,
      borderTopWidth: 1,
      borderColor: c.linha,
      borderTopLeftRadius: raios.folha,
      borderTopRightRadius: raios.folha,
      paddingHorizontal: espaco.md,
      boxShadow: sombra.folha,
    },
    alcaArea: { alignSelf: 'stretch', minHeight: 36, alignItems: 'center', justifyContent: 'center' },
    alca: { width: 44, height: 5, borderRadius: 4, backgroundColor: c.linhaForte },
  });

type Props = ViewProps & {
  /** Se informado, o painel pode ser recolhido (puxando para baixo ou tocando na alça). */
  recolhido?: boolean;
  aoAlternar?: (recolher: boolean) => void;
  /** Conteúdo que continua visível quando recolhido (ex.: "Nesta área"). */
  resumo?: ReactNode;
};

/** Painel fixo na base da tela (raio 22, alça), usado sobre o mapa. Opaco (R25). Gesto com botão equivalente (R24). */
export function PainelInferior({ style, children, recolhido, aoAlternar, resumo, ...resto }: Props) {
  const { t } = useTranslation();
  const estilos = useEstilos(criarEstilos);
  const arrastar = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          !!aoAlternar && Math.abs(g.dy) > 12 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderRelease: (_e, g) => {
          if (g.dy > 30) aoAlternar?.(true);
          else if (g.dy < -30) aoAlternar?.(false);
        },
      }),
    [aoAlternar],
  );
  return (
    <View style={[estilos.painel, style]} {...(aoAlternar ? arrastar.panHandlers : {})} {...resto}>
      {aoAlternar ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={recolhido ? t('comum.abrirPainel') : t('comum.recolherPainel')}
          onPress={() => aoAlternar(!recolhido)}
          hitSlop={8}
          style={estilos.alcaArea}
        >
          <View style={estilos.alca} />
          <View style={{ position: 'absolute', right: 0 }}>
            <Icone nome={recolhido ? 'mais' : 'menos'} tamanho={20} />
          </View>
        </Pressable>
      ) : (
        <View style={[estilos.alcaArea, { minHeight: 24 }]}>
          <View style={estilos.alca} />
        </View>
      )}
      {resumo}
      {!recolhido && children}
    </View>
  );
}
