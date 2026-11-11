import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { cores, fontes } from '@/theme';

import { Texto } from './Texto';

export type StatusIrmao = 'aberto' | 'estrada' | 'naoPerturbe' | 'nenhum';

const corDoStatus: Record<StatusIrmao, string> = {
  aberto: cores.laranja,
  estrada: cores.jeans,
  naoPerturbe: '#7A7268',
  nenhum: cores.linhaEscura,
};

type Props = {
  nome: string;
  status?: StatusIrmao;
  tamanho?: number;
  /** Posição aproximada: círculo tracejado em volta (Kit visual). */
  aproximado?: boolean;
  rotuloStatus?: string;
};

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return (
    (partes[0]?.[0] ?? '') + (partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '')
  ).toUpperCase();
}

/** Avatar com anel de status e moldura de pesponto. Até o irmão subir foto, mostra as iniciais. */
export function Avatar({ nome, status = 'nenhum', tamanho = 56, aproximado, rotuloStatus }: Props) {
  const anel = 3;
  const total = tamanho + (aproximado ? 12 : 0);
  const c = total / 2;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={rotuloStatus ? `${nome}, ${rotuloStatus}` : nome}
      style={{ width: total, height: total }}
    >
      <Svg width={total} height={total} style={StyleSheet.absoluteFill}>
        {aproximado && (
          <Circle
            cx={c}
            cy={c}
            r={c - 1}
            stroke={cores.caramelo}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="none"
          />
        )}
        <Circle
          cx={c}
          cy={c}
          r={tamanho / 2 - anel / 2}
          stroke={corDoStatus[status]}
          strokeWidth={anel}
          fill={cores.sarja}
        />
        <Circle
          cx={c}
          cy={c}
          r={tamanho / 2 - anel - 3}
          stroke={cores.creme}
          strokeOpacity={0.6}
          strokeWidth={1}
          strokeDasharray="3 3"
          fill="none"
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, estilos.centro]}>
        <Texto
          style={{ fontFamily: fontes.titulo, fontSize: Math.max(13, tamanho * 0.36), color: cores.creme }}
        >
          {iniciais(nome)}
        </Texto>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({ centro: { alignItems: 'center', justifyContent: 'center' } });
