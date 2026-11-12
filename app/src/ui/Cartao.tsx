import { StyleSheet, View, type ViewProps } from 'react-native';

import { cores, espaco, raios } from '@/theme';

type Props = ViewProps & { destaque?: boolean; semPadding?: boolean };

/** Cartão limpo: superfície 2, borda fina, raio 16. "destaque" usa a borda laranja. */
export function Cartao({ destaque, semPadding, style, ...resto }: Props) {
  return (
    <View
      style={[estilos.base, destaque && estilos.destaque, !semPadding && { padding: espaco.md - 2 }, style]}
      {...resto}
    />
  );
}

const estilos = StyleSheet.create({
  base: {
    backgroundColor: cores.superficie2,
    borderRadius: raios.cartao,
    borderWidth: 1,
    borderColor: cores.linha,
  },
  destaque: { borderColor: cores.acao, borderWidth: 2, backgroundColor: 'rgba(232,105,42,0.12)' },
});
