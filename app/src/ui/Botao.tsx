import { Pressable, StyleSheet, View } from 'react-native';

import { cores, espaco, fontes, raios, tamanhoTexto, toque } from '@/theme';

import { Profundidade } from './Profundidade';
import { Texto } from './Texto';

export type VarianteBotao = 'principal' | 'secundario' | 'sos';

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: VarianteBotao;
  desativado?: boolean;
  icone?: React.ReactNode;
};

/** Botão do app. Mínimo de 48 px de altura; SOS usa só o vermelho. */
export function Botao({ titulo, onPress, variante = 'principal', desativado, icone }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: !!desativado }}
      disabled={desativado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.base,
        variante === 'principal' && { backgroundColor: pressed ? cores.laranjaEscuro : cores.laranja },
        variante === 'sos' && { backgroundColor: pressed ? cores.laranjaEscuro : cores.vermelho },
        variante === 'secundario' && estilos.secundario,
        pressed && estilos.pressionado,
        desativado && { opacity: 0.5 },
      ]}
    >
      {variante !== 'secundario' && (
        <Profundidade nivel={variante === 'sos' ? 'flutuante' : 'costurado'} raio={raios.botao} />
      )}
      <View style={estilos.conteudo}>
        {icone}
        <Texto style={[estilos.texto, { color: variante === 'principal' ? cores.noite : cores.creme }]}>
          {titulo}
        </Texto>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: toque.minimo,
    borderRadius: raios.botao,
    paddingHorizontal: espaco.lg,
    justifyContent: 'center',
  },
  secundario: {
    borderWidth: 1.5,
    borderColor: cores.linhaEscura,
    backgroundColor: 'transparent',
  },
  pressionado: { transform: [{ translateY: 1 }] },
  conteudo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espaco.xs },
  texto: { fontFamily: fontes.textoForte, fontSize: tamanhoTexto.corpo },
});
