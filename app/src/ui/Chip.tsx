import { Pressable, StyleSheet, View } from 'react-native';

import { cores, espaco, fontes, raios, toque } from '@/theme';

import { Texto } from './Texto';

type Props = { rotulo: string; ativo?: boolean; onPress: () => void; corPonto?: string };

/** Filtro em pílula (36 px, área de toque 48). Ativo: creme; inativo: escuro com contorno. */
export function Chip({ rotulo, ativo = false, onPress, corPonto }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      accessibilityLabel={rotulo}
      onPress={onPress}
      hitSlop={(toque.minimo - 36) / 2}
      style={[estilos.base, ativo ? estilos.ativo : estilos.inativo]}
    >
      {corPonto && !ativo && <View style={[estilos.ponto, { backgroundColor: corPonto }]} />}
      <Texto style={[estilos.texto, { color: ativo ? cores.fundo : cores.texto }]}>{rotulo}</Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: raios.pilula,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs - 2,
  },
  ativo: { backgroundColor: cores.texto },
  inativo: { backgroundColor: 'rgba(22,18,14,0.92)', borderWidth: 1, borderColor: cores.linhaForte },
  ponto: { width: 8, height: 8, borderRadius: 4 },
  texto: { fontFamily: fontes.textoSemi, fontSize: 15 },
});
