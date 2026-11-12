import { StyleSheet, View, type ViewProps } from 'react-native';

import { espaco, raios, useEstilos, type Paleta } from '@/theme';

type Props = ViewProps & { destaque?: boolean; semPadding?: boolean };

const criarEstilos = (c: Paleta) =>
  StyleSheet.create({
    base: {
      backgroundColor: c.superficie2,
      borderRadius: raios.cartao,
      borderWidth: 1,
      borderColor: c.linha,
    },
    destaque: { borderColor: c.acao, borderWidth: 2 },
  });

/** Cartão limpo: superfície 2, borda fina, raio 16. "destaque" usa a borda laranja. */
export function Cartao({ destaque, semPadding, style, ...resto }: Props) {
  const estilos = useEstilos(criarEstilos);
  return (
    <View
      style={[estilos.base, destaque && estilos.destaque, !semPadding && { padding: espaco.md - 2 }, style]}
      {...resto}
    />
  );
}
