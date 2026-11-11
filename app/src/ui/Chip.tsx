import { Pressable, StyleSheet } from 'react-native';

import { cores, espaco, fontes, raios, tamanhoTexto, toque } from '@/theme';

import { Texto } from './Texto';

type Props = { rotulo: string; ativo?: boolean; onPress: () => void };

/** Filtro em forma de pílula: ativo laranja, inativo sarja com contorno. */
export function Chip({ rotulo, ativo = false, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      accessibilityLabel={rotulo}
      onPress={onPress}
      hitSlop={(toque.minimo - 36) / 2}
      style={[estilos.base, ativo ? estilos.ativo : estilos.inativo]}
    >
      <Texto style={[estilos.texto, { color: ativo ? cores.noite : cores.creme }]}>{rotulo}</Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: 36,
    paddingHorizontal: espaco.md,
    borderRadius: raios.pilula,
    justifyContent: 'center',
  },
  ativo: { backgroundColor: cores.laranja },
  inativo: { backgroundColor: cores.sarja, borderWidth: 1.5, borderColor: cores.linhaEscura },
  texto: { fontFamily: fontes.textoSemi, fontSize: tamanhoTexto.pequeno },
});
