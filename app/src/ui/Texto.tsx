import { Text, type TextProps, type TextStyle } from 'react-native';

import { cores, fontes, tamanhoTexto } from '@/theme';

const variantes = {
  numero: { fontFamily: fontes.titulo, fontSize: tamanhoTexto.numero, color: cores.texto, lineHeight: 52 },
  titulo: { fontFamily: fontes.titulo, fontSize: tamanhoTexto.titulo, color: cores.texto, lineHeight: 36 },
  subtitulo: {
    fontFamily: fontes.titulo,
    fontSize: tamanhoTexto.subtitulo,
    color: cores.texto,
    lineHeight: 28,
  },
  rotulo: {
    fontFamily: fontes.tituloSemi,
    fontSize: tamanhoTexto.minimo,
    color: cores.textoSec,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  destaque: { fontFamily: fontes.textoSemi, fontSize: tamanhoTexto.destaque, color: cores.texto },
  corpo: { fontFamily: fontes.texto, fontSize: tamanhoTexto.corpo, color: cores.texto, lineHeight: 24 },
  corpoForte: { fontFamily: fontes.textoSemi, fontSize: tamanhoTexto.corpo, color: cores.texto },
  secundario: {
    fontFamily: fontes.texto,
    fontSize: tamanhoTexto.pequeno,
    color: cores.textoSec,
    lineHeight: 21,
  },
  pequeno: { fontFamily: fontes.textoMedio, fontSize: tamanhoTexto.minimo, color: cores.textoSec },
} satisfies Record<string, TextStyle>;

export type VarianteTexto = keyof typeof variantes;

export function Texto({ variante = 'corpo', style, ...resto }: TextProps & { variante?: VarianteTexto }) {
  return <Text {...resto} style={[variantes[variante], style]} />;
}
