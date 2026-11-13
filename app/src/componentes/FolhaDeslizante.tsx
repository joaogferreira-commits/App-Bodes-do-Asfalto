import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, PanResponder, Pressable, StyleSheet, View } from 'react-native';

import { espaco, raios, sombra, useEstilos, type Paleta } from '@/theme';

export type NivelFolha = 0 | 1 | 2;

/** Alturas da folha: recolhida (~96 dp), meia e cheia. */
export const alturasFolha = (alturaTela: number): [number, number, number] => [
  96,
  Math.round(alturaTela * 0.42),
  Math.round(alturaTela * 0.75),
];

type Props = {
  /** Altura animada, compartilhada com quem precisa acompanhar (botão SOS, atribuição). */
  altura: Animated.Value;
  alturas: [number, number, number];
  nivel: NivelFolha;
  aoMudarNivel: (n: NivelFolha) => void;
  /** Sempre visível (recolhida inclusive). */
  resumo: ReactNode;
  /** Só com a folha meio aberta ou cheia. */
  children: ReactNode;
};

const criarEstilos = (c: Paleta) =>
  StyleSheet.create({
    folha: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      backgroundColor: c.superficie,
      borderTopWidth: 1,
      borderColor: c.linha,
      borderTopLeftRadius: raios.folha - 2,
      borderTopRightRadius: raios.folha - 2,
      paddingHorizontal: espaco.md,
      boxShadow: sombra.folha,
    },
    alcaArea: { alignSelf: 'stretch', height: 24, alignItems: 'center', justifyContent: 'center' },
    alca: { width: 44, height: 5, borderRadius: 4, backgroundColor: c.linhaForte },
  });

/** Folha arrastável sobre o mapa, com 3 alturas. Arrastar na alça/resumo ou tocar na alça (botão equivalente, R24). */
export function FolhaDeslizante({ altura, alturas, nivel, aoMudarNivel, resumo, children }: Props) {
  const { t } = useTranslation();
  const estilos = useEstilos(criarEstilos);
  const inicio = useRef(alturas[nivel]);
  const api = useRef({ alturas, nivel, aoMudarNivel });
  useEffect(() => {
    api.current = { alturas, nivel, aoMudarNivel };
  });

  const irPara = (n: NivelFolha) => {
    aoMudarNivel(n);
    Animated.spring(altura, { toValue: alturas[n], useNativeDriver: false, bounciness: 0 }).start();
  };

  // Os gestos só leem os refs depois, nos eventos (nunca durante a renderização).
  // eslint-disable-next-line react-hooks/refs
  const [arrastar] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 8 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        altura.stopAnimation((v) => {
          inicio.current = v;
        });
      },
      onPanResponderMove: (_e, g) => {
        const [min, , max] = api.current.alturas;
        altura.setValue(Math.max(min, Math.min(max, inicio.current - g.dy)));
      },
      onPanResponderRelease: (_e, g) => {
        const { alturas: alts, aoMudarNivel: muda } = api.current;
        const alvo = inicio.current - g.dy - g.vy * 120;
        let melhor: NivelFolha = 0;
        ([0, 1, 2] as const).forEach((n) => {
          if (Math.abs(alts[n] - alvo) < Math.abs(alts[melhor] - alvo)) melhor = n;
        });
        muda(melhor);
        Animated.spring(altura, { toValue: alts[melhor], useNativeDriver: false, bounciness: 0 }).start();
      },
    }),
  );

  return (
    <Animated.View testID="folha-mapa" style={[estilos.folha, { height: altura }]} {...arrastar.panHandlers}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={nivel === 2 ? t('comum.recolherPainel') : t('comum.abrirPainel')}
        accessibilityValue={{ text: String(nivel) }}
        onPress={() => irPara(((nivel + 1) % 3) as NivelFolha)}
        hitSlop={8}
        style={estilos.alcaArea}
      >
        <View style={estilos.alca} />
      </Pressable>
      {resumo}
      {nivel > 0 && <View style={{ flex: 1, marginTop: espaco.sm }}>{children}</View>}
    </Animated.View>
  );
}
