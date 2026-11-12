import { useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { caminhoDe } from '@/stories/estilos';

type Props = {
  cor: string;
  espessura: number;
  largura: number;
  altura: number;
  aoTerminar: (d: string) => void;
};

/**
 * Camada de desenho com o dedo. É recriada (key) quando muda cor, espessura ou tamanho,
 * então o gesto sempre usa os valores certos.
 */
export function QuadroDesenho({ cor, espessura, largura, altura, aoTerminar }: Props) {
  const [previa, setPrevia] = useState('');
  const [resp] = useState(() => {
    let pontos: { x: number; y: number }[] = [];
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        pontos = [{ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY }];
      },
      onPanResponderMove: (e) => {
        pontos.push({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
        setPrevia(caminhoDe(pontos, largura, altura));
      },
      onPanResponderRelease: () => {
        const d = caminhoDe(pontos, largura, altura);
        pontos = [];
        setPrevia('');
        if (d) aoTerminar(d);
      },
    });
  });
  return (
    <View style={StyleSheet.absoluteFill} {...resp.panHandlers} testID="quadro-desenho">
      {!!previa && (
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <Path
            d={previa}
            stroke={cor}
            strokeWidth={espessura}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      )}
    </View>
  );
}
