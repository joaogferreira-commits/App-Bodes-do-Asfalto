import { StyleSheet, View, type ViewProps } from 'react-native';

import { cores, espaco, raios, sombra } from '@/theme';

/** Painel fixo na base da tela (raio 22, alça), usado sobre o mapa. */
export function PainelInferior({ style, children, ...resto }: ViewProps) {
  return (
    <View style={[estilos.painel, style]} {...resto}>
      <View style={estilos.alca} />
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  painel: {
    backgroundColor: cores.superficie,
    borderTopWidth: 1,
    borderColor: cores.linha,
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
    backgroundColor: cores.linhaForte,
    marginBottom: 14,
  },
});
