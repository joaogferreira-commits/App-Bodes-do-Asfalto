import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { fontes, useCores } from '@/theme';
import { pinos, Texto } from '@/ui';

/**
 * Ágape Relâmpago no mapa: emblema maior que os outros pinos, "flutuando" (sobe e desce devagar)
 * com um anel dourado pulsando e a etiqueta "Ágape · em 1h20". Nunca é agrupado.
 */
export function MarcadorAgape({
  comecaEm,
  local,
  onPress,
  compacto,
}: {
  comecaEm: string;
  local: string;
  onPress: () => void;
  /** De longe (zoom < 10): só o emblema pequeno, sem etiqueta. */
  compacto?: boolean;
}) {
  const { t } = useTranslation();
  const cores = useCores();
  const [ciclo] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(ciclo, {
        toValue: 1,
        duration: 1800,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [ciclo]);

  const sobe = ciclo.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -6, 0] });
  const escala = ciclo.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.5] });
  const opacidade = ciclo.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('mapa.agapeMarcador', { local, tempo: comecaEm })}
      onPress={onPress}
      style={estilos.coluna}
    >
      <View style={[estilos.area, compacto && { width: 44, height: 44 }]}>
        <Animated.View
          style={[
            estilos.anel,
            { borderColor: cores.ouro, opacity: opacidade, transform: [{ scale: escala }] },
          ]}
        />
        <Animated.View style={{ transform: [{ translateY: sobe }] }}>
          <Image
            source={pinos.agape.imagem}
            style={estilos.emblema}
            contentFit="contain"
            accessible={false}
          />
        </Animated.View>
      </View>
      {!compacto && (
        <View style={[estilos.etiqueta, { backgroundColor: cores.ouro }]}>
          <Texto style={[estilos.texto, { color: cores.textoSobreAlerta }]} maxFontSizeMultiplier={1.3}>
            {t('mapa.agapeEtiqueta', { tempo: comecaEm })}
          </Texto>
        </View>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  coluna: { alignItems: 'center' },
  area: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center' },
  anel: { position: 'absolute', width: 70, height: 70, borderRadius: 35, borderWidth: 4 },
  emblema: { width: 58, height: 72 },
  etiqueta: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  texto: { fontSize: 13, fontFamily: fontes.textoForte },
});
