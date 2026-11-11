import { StyleSheet, View } from 'react-native';

import { cores, espaco } from '@/theme';

/** Linha de pesponto tracejado (caramelo 40%). */
export function Divisoria() {
  return <View accessible={false} style={estilos.linha} />;
}

const estilos = StyleSheet.create({
  linha: {
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: cores.caramelo,
    opacity: 0.4,
    marginVertical: espaco.sm,
  },
});
