import { StyleSheet, View } from 'react-native';

import { cores, espaco } from '@/theme';

export function Divisoria() {
  return <View accessible={false} style={estilos.linha} />;
}

const estilos = StyleSheet.create({
  linha: { height: 1, backgroundColor: cores.linhaSuave, marginVertical: espaco.sm },
});
