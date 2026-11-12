import { Text, type TextProps, type TextStyle } from 'react-native';

import { fontes, tamanhoTexto, useEstilos, type Paleta } from '@/theme';

/**
 * Variantes de texto (R16, R18, R19):
 * - Barlow Condensed só em números (≥ 32 px) e títulos (≥ 24 px);
 * - Inter com peso 500–600 no texto claro sobre fundo escuro (nada de 400 no corpo);
 * - o rótulo em caixa alta agora é Inter (condensada pequena lê mal num relance).
 */
const criarVariantes = (c: Paleta) =>
  ({
    numero: {
      fontFamily: fontes.titulo,
      fontSize: tamanhoTexto.numero,
      color: c.texto,
      lineHeight: 54,
      fontVariant: ['tabular-nums'],
    },
    titulo: { fontFamily: fontes.titulo, fontSize: tamanhoTexto.titulo, color: c.texto, lineHeight: 36 },
    subtitulo: {
      fontFamily: fontes.titulo,
      fontSize: tamanhoTexto.subtitulo,
      color: c.texto,
      lineHeight: 28,
    },
    rotulo: {
      fontFamily: fontes.textoSemi,
      fontSize: tamanhoTexto.minimo,
      color: c.textoSec,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    destaque: { fontFamily: fontes.textoSemi, fontSize: tamanhoTexto.destaque, color: c.texto },
    corpo: { fontFamily: fontes.textoMedio, fontSize: tamanhoTexto.corpo, color: c.texto, lineHeight: 24 },
    corpoForte: { fontFamily: fontes.textoSemi, fontSize: tamanhoTexto.corpo, color: c.texto },
    secundario: {
      fontFamily: fontes.textoMedio,
      fontSize: tamanhoTexto.pequeno,
      color: c.textoSec,
      lineHeight: 21,
    },
    pequeno: { fontFamily: fontes.textoMedio, fontSize: tamanhoTexto.minimo, color: c.textoSec },
  }) satisfies Record<string, TextStyle>;

export type VarianteTexto = keyof ReturnType<typeof criarVariantes>;

/** Texto do app. A fonte do sistema sempre amplia (allowFontScaling); limite só onde for passado. */
export function Texto({ variante = 'corpo', style, ...resto }: TextProps & { variante?: VarianteTexto }) {
  const variantes = useEstilos(criarVariantes);
  return <Text allowFontScaling {...resto} style={[variantes[variante], style]} />;
}
