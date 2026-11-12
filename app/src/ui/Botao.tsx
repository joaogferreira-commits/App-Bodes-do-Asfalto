import { Pressable, StyleSheet, View } from 'react-native';

import { espaco, fontes, raios, tamanhoTexto, toque, useCores, useEstilos, type Paleta } from '@/theme';

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

const coresDoBotao = (c: Paleta) => ({
  fundo: { principal: c.acao, secundario: c.superficie2, contorno: 'transparent', sos: c.sos },
  pressionado: {
    principal: c.acaoPressionada,
    secundario: c.superficie3,
    contorno: c.superficie3,
    sos: c.sosPressionado,
  },
  // Texto escuro sobre o laranja (R15): creme sobre laranja reprova no contraste.
  texto: { principal: c.textoSobreAcao, secundario: c.texto, contorno: c.texto, sos: c.textoSobreSos },
});

const criarEstilos = (c: Paleta) =>
  StyleSheet.create({
    base: { borderRadius: raios.botao, paddingHorizontal: espaco.lg, justifyContent: 'center' },
    borda: { borderWidth: 1, borderColor: c.linha },
    bordaForte: { borderWidth: 1, borderColor: c.linhaForte },
    conteudo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espaco.xs },
    texto: { fontFamily: fontes.textoForte, textAlign: 'center' },
  });

/** Botão do app: 52 dp (56 no grande), raio 14. SOS usa só o vermelho. O texto quebra linha, nunca corta. */
export function Botao({
  titulo,
  onPress,
  variante = 'principal',
  grande,
  desativado,
  icone,
  corIcone,
}: Props) {
  const c = useCores();
  const estilos = useEstilos(criarEstilos);
  const paleta = useEstilos(coresDoBotao);
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
          backgroundColor: pressed ? paleta.pressionado[variante] : paleta.fundo[variante],
        },
        variante === 'secundario' && estilos.borda,
        variante === 'contorno' && estilos.bordaForte,
        variante === 'sos' && { borderWidth: 2, borderColor: c.contornoSos },
        desativado && { opacity: 0.5 },
      ]}
    >
      <View style={estilos.conteudo}>
        {icone && <Icone nome={icone} tamanho={22} cor={corIcone ?? paleta.texto[variante]} />}
        <Texto
          style={[
            estilos.texto,
            {
              color: paleta.texto[variante],
              fontSize: grande ? tamanhoTexto.corpo : tamanhoTexto.pequeno + 1,
            },
          ]}
          numberOfLines={2}
          maxFontSizeMultiplier={1.5}
        >
          {titulo}
        </Texto>
      </View>
    </Pressable>
  );
}
