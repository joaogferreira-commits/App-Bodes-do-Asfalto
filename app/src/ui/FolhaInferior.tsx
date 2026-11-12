import { StyleSheet, View, type ViewProps } from 'react-native';

import { espaco, raios, sombra, useEstilos, type Paleta } from '@/theme';

const criarEstilos = (c: Paleta) =>
  StyleSheet.create({
    painel: {
      backgroundColor: c.superficie,
      borderTopWidth: 1,
      borderColor: c.linha,
      borderTopLeftRadius: raios.folha,
      borderTopRightRadius: raios.folha,
      paddingHorizontal: espaco.md,
      paddingTop: 10,
      boxShadow: sombra.folha,
    },
    alca: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 4,
      backgroundColor: c.linhaForte,
      marginBottom: 14,
    },
  });

/** Painel fixo na base da tela (raio 22, alça), usado sobre o mapa. Opaco (R25). */
export function PainelInferior({ style, children, ...resto }: ViewProps) {
  const estilos = useEstilos(criarEstilos);
  return (
    <View style={[estilos.painel, style]} {...resto}>
      <View style={estilos.alca} />
      {children}
    </View>
  );
}
