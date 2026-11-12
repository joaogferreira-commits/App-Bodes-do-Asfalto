import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';

import { paletaNoite } from '@/theme';

/** Mesmo arquivo e tamanho do splash nativo (app.json: imageWidth 220) para não "pular" na troca. */
const LOGO = require('../../assets/icone/abertura.png');
const LADO = 220;
export const DURACAO_ABERTURA_MS = 1500;

/**
 * Abertura de 1,5 s (decisão do dono e da equipe em 12/11/2026): a logo "assenta" (92% → 100%),
 * uma luz de farol passa pelo escudo e tudo some revelando o app. Sem som.
 * "Reduzir movimento" ligado no celular: só um esmaecimento curto.
 */
export function AberturaAnimada() {
  const [visivel, setVisivel] = useState(true);
  const [escala] = useState(() => new Animated.Value(0.92));
  const [luz] = useState(() => new Animated.Value(0));
  const [saida] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let vivo = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduzir) => {
        if (!vivo) return;
        const fim = Animated.timing(saida, {
          toValue: 0,
          duration: reduzir ? 250 : 300,
          useNativeDriver: true,
        });
        const animacao = reduzir
          ? Animated.sequence([Animated.delay(150), fim])
          : Animated.sequence([
              Animated.parallel([
                Animated.timing(escala, {
                  toValue: 1,
                  duration: 550,
                  easing: Easing.out(Easing.cubic),
                  useNativeDriver: true,
                }),
                Animated.sequence([
                  Animated.delay(350),
                  Animated.timing(luz, {
                    toValue: 1,
                    duration: 650,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                  }),
                ]),
              ]),
              Animated.delay(200),
              fim,
            ]);
        animacao.start(() => vivo && setVisivel(false));
      });
    return () => {
      vivo = false;
    };
  }, [escala, luz, saida]);

  if (!visivel) return null;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, estilos.fundo, { opacity: saida }]}
    >
      <Animated.View
        style={{ width: LADO, height: LADO, overflow: 'hidden', transform: [{ scale: escala }] }}
      >
        <Animated.Image source={LOGO} style={{ width: LADO, height: LADO }} resizeMode="contain" />
        {/* Luz de farol: faixa clara inclinada que atravessa o escudo uma vez */}
        <Animated.View
          style={[
            estilos.luz,
            {
              transform: [
                { translateX: luz.interpolate({ inputRange: [0, 1], outputRange: [-LADO, LADO * 1.2] }) },
                { rotate: '20deg' },
              ],
              opacity: luz.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] }),
            },
          ]}
        />
      </Animated.View>
      <View />
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  fundo: { backgroundColor: paletaNoite.fundo, alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  luz: {
    position: 'absolute',
    top: -LADO * 0.3,
    width: LADO * 0.22,
    height: LADO * 1.6,
    backgroundColor: 'rgba(255, 236, 210, 0.28)',
  },
});
