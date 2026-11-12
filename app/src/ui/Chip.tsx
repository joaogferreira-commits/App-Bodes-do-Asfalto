import { Pressable, StyleSheet, View } from 'react-native';

import { escalaMaxima, espaco, fontes, raios, toque, useCores, useEstilos, type Paleta } from '@/theme';

import { Texto } from './Texto';

type Props = { rotulo: string; ativo?: boolean; onPress: () => void; corPonto?: string };

const criarEstilos = (c: Paleta) =>
  StyleSheet.create({
    base: {
      minHeight: 40,
      paddingHorizontal: 14,
      borderRadius: raios.pilula,
      flexDirection: 'row',
      alignItems: 'center',
      gap: espaco.xs - 2,
    },
    ativo: { backgroundColor: c.texto },
    inativo: { backgroundColor: c.sobreMapa, borderWidth: 1, borderColor: c.linhaForte },
    ponto: { width: 10, height: 10, borderRadius: 5 },
    texto: { fontFamily: fontes.textoSemi, fontSize: 15 },
  });

/** Filtro em pílula (40 dp, área de toque 48). Ativo: invertido; inativo: opaco com contorno. */
export function Chip({ rotulo, ativo = false, onPress, corPonto }: Props) {
  const c = useCores();
  const estilos = useEstilos(criarEstilos);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      accessibilityLabel={rotulo}
      onPress={onPress}
      hitSlop={(toque.minimo - 40) / 2}
      style={[estilos.base, ativo ? estilos.ativo : estilos.inativo]}
    >
      {corPonto && !ativo && <View style={[estilos.ponto, { backgroundColor: corPonto }]} />}
      <Texto
        style={[estilos.texto, { color: ativo ? c.fundo : c.texto }]}
        maxFontSizeMultiplier={escalaMaxima.chip}
      >
        {rotulo}
      </Texto>
    </Pressable>
  );
}
