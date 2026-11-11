import { Text, type TextProps, type TextStyle } from 'react-native';

import { cores, fontes, tamanhoTexto } from '@/theme';

const variantes = {
  titulo: {
    fontFamily: fontes.titulo,
    fontSize: tamanhoTexto.titulo,
    color: cores.creme,
    letterSpacing: 0.6,
  },
  tituloGrande: {
    fontFamily: fontes.tituloForte,
    fontSize: tamanhoTexto.tituloGrande,
    color: cores.creme,
    letterSpacing: 0.8,
  },
  rotulo: {
    fontFamily: fontes.tituloSemi,
    fontSize: tamanhoTexto.pequeno,
    color: cores.caramelo,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  corpo: { fontFamily: fontes.texto, fontSize: tamanhoTexto.corpo, color: cores.creme },
  corpoForte: { fontFamily: fontes.textoSemi, fontSize: tamanhoTexto.corpo, color: cores.creme },
  secundario: { fontFamily: fontes.texto, fontSize: tamanhoTexto.pequeno, color: cores.caramelo },
} satisfies Record<string, TextStyle>;

export type VarianteTexto = keyof typeof variantes;

export function Texto({ variante = 'corpo', style, ...resto }: TextProps & { variante?: VarianteTexto }) {
  return <Text {...resto} style={[variantes[variante], style]} />;
}
