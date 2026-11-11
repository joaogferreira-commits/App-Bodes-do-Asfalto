import { BlurMask, Canvas, Line, RoundedRect, vec } from '@shopify/react-native-skia';
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { cores, profundidade, type NivelProfundidade } from '@/theme';

type Props = { nivel: NivelProfundidade; raio: number };

/**
 * Sombra desenhada com Skia atrás do componente (DESIGN.md, "Profundidade").
 * Fica fora da área de toque e não interfere na acessibilidade.
 */
export function Profundidade({ nivel, raio }: Props) {
  const [tam, setTam] = useState({ w: 0, h: 0 });
  const p = profundidade[nivel];
  const folga = p.blur * 2 + p.y;
  const onLayout = (e: LayoutChangeEvent) =>
    setTam({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {tam.w > 0 && (
        <Canvas
          style={{
            position: 'absolute',
            left: -folga,
            top: -folga,
            width: tam.w + folga * 2,
            height: tam.h + folga * 2,
          }}
        >
          <RoundedRect
            x={folga}
            y={folga + p.y}
            width={tam.w}
            height={tam.h}
            r={raio}
            color={`rgba(0,0,0,${p.opacidade})`}
          >
            <BlurMask blur={p.blur / 2} style="normal" />
          </RoundedRect>
          {p.sombraInterna && (
            <RoundedRect
              x={folga + 1}
              y={folga + 1}
              width={tam.w - 2}
              height={tam.h - 2}
              r={raio}
              color="rgba(0,0,0,0.35)"
              style="stroke"
              strokeWidth={3}
            >
              <BlurMask blur={3} style="inner" />
            </RoundedRect>
          )}
          {p.brilho && (
            <Line
              p1={vec(folga + raio, folga + 1)}
              p2={vec(folga + tam.w - raio, folga + 1)}
              color={cores.creme}
              opacity={0.1}
              strokeWidth={1}
            />
          )}
        </Canvas>
      )}
    </View>
  );
}
