import { Pressable, StyleSheet, View } from 'react-native';

import { cores, espaco, fontes, raios, tamanhoTexto, toque } from '@/theme';

import { Icone, type NomeIcone } from './icones';
import { Texto } from './Texto';

export type VarianteBotao = 'principal' | 'secundario' | 'contorno' | 'sos';

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: VarianteBotao;
  grande?: boolean;
  desativado?: boolean;
  icone?: NomeIcone;
  corIcone?: string;
};

const fundo: Record<VarianteBotao, string> = {
  principal: cores.acao,
  secundario: cores.superficie2,
  contorno: 'transparent',
  sos: cores.sos,
};
const fundoPressionado: Record<VarianteBotao, string> = {
  principal: cores.acaoPressionada,
  secundario: cores.superficie3,
  contorno: cores.superficie2,
  sos: '#A1241B',
};
const corTexto: Record<VarianteBotao, string> = {
  principal: cores.fundo,
  secundario: cores.texto,
  contorno: cores.texto,
  sos: cores.textoSobreSos,
};

/** Botão do app: 52 px (56 no grande), raio 14. SOS usa só o vermelho. */
export function Botao({
  titulo,
  onPress,
  variante = 'principal',
  grande,
  desativado,
  icone,
  corIcone,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: !!desativado }}
      disabled={desativado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.base,
        {
          minHeight: grande ? toque.botaoGrande : toque.botao,
          backgroundColor: pressed ? fundoPressionado[variante] : fundo[variante],
        },
        variante === 'secundario' && estilos.borda,
        variante === 'contorno' && estilos.bordaForte,
        desativado && { opacity: 0.5 },
      ]}
    >
      <View style={estilos.conteudo}>
        {icone && <Icone nome={icone} tamanho={22} cor={corIcone ?? corTexto[variante]} />}
        <Texto
          style={[
            estilos.texto,
            { color: corTexto[variante], fontSize: grande ? tamanhoTexto.corpo : tamanhoTexto.pequeno + 1 },
          ]}
          numberOfLines={1}
        >
          {titulo}
        </Texto>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: { borderRadius: raios.botao, paddingHorizontal: espaco.lg, justifyContent: 'center' },
  borda: { borderWidth: 1, borderColor: cores.linha },
  bordaForte: { borderWidth: 1, borderColor: cores.linhaForte },
  conteudo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espaco.xs },
  texto: { fontFamily: fontes.textoForte },
});
