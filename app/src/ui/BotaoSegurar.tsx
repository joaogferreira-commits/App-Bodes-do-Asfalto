import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  /** Tempo segurando até disparar (ms). SOS: 3.000 (R6); Encerrar: 1.500 (R7). */
  duracao: number;
  aoCompletar: () => void;
  rotulo: string;
  dica: string;
  corProgresso: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * Botão de "segurar para confirmar": evita disparo acidental com vibração e luva.
 * Uma faixa enche de baixo para cima enquanto o irmão segura; vibra ao começar,
 * a cada segundo e ao completar. Soltar antes do tempo cancela sem fazer nada.
 */
export function BotaoSegurar({ duracao, aoCompletar, rotulo, dica, corProgresso, style, children }: Props) {
  const [progresso] = useState(() => new Animated.Value(0));
  const disparo = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulsos = useRef<ReturnType<typeof setInterval> | null>(null);
  const [segurando, setSegurando] = useState(false);

  const limpar = () => {
    if (disparo.current) clearTimeout(disparo.current);
    if (pulsos.current) clearInterval(pulsos.current);
    disparo.current = null;
    pulsos.current = null;
  };
  useEffect(() => limpar, []);

  const comecar = () => {
    limpar();
    setSegurando(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    progresso.setValue(0);
    Animated.timing(progresso, {
      toValue: 1,
      duration: duracao,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    pulsos.current = setInterval(
      () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined),
      1000,
    );
    disparo.current = setTimeout(() => {
      limpar();
      setSegurando(false);
      progresso.setValue(0);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      aoCompletar();
    }, duracao);
  };

  const soltar = () => {
    if (!disparo.current) return;
    limpar();
    setSegurando(false);
    progresso.stopAnimation();
    Animated.timing(progresso, { toValue: 0, duration: 160, useNativeDriver: false }).start();
  };

  const altura = progresso.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityHint={dica}
      accessibilityState={{ busy: segurando }}
      onPressIn={comecar}
      onPressOut={soltar}
      // Leitor de tela: toque duplo confirma direto (o leitor já exige confirmação).
      onAccessibilityTap={aoCompletar}
      style={[style, { overflow: 'hidden' }]}
    >
      <Animated.View
        pointerEvents="none"
        testID="progresso-segurar"
        style={[estilos.progresso, { height: altura, backgroundColor: corProgresso }]}
      />
      <View pointerEvents="none" style={estilos.conteudo}>
        {children}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  progresso: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  conteudo: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
});
