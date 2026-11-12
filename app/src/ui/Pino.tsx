import { StyleSheet, View, type ViewStyle } from 'react-native';

import { fontes, paletaNoite, sombra, useCores, type NomeCor } from '@/theme';

import { Icone, type NomeIcone } from './icones';
import { Texto } from './Texto';

export type TipoPino = 'sede' | 'posto' | 'loja' | 'agape' | 'oficina' | 'socorro' | 'alerta';
type Forma = 'escudo' | 'circulo' | 'quadrado' | 'losango';

/**
 * Pino = forma + pictograma + cor (R23, R44): nunca só a cor, por causa dos ~8 % de daltônicos.
 * "agrupa": sede e Ágape nunca são agrupados no mapa.
 */
export const pinos: Record<TipoPino, { icone: NomeIcone; cor: NomeCor; forma: Forma; agrupa: boolean }> = {
  sede: { icone: 'sede', cor: 'ouro', forma: 'escudo', agrupa: false },
  agape: { icone: 'agape', cor: 'ouro', forma: 'circulo', agrupa: false },
  posto: { icone: 'posto', cor: 'verdePosto', forma: 'quadrado', agrupa: true },
  loja: { icone: 'loja', cor: 'azulRio', forma: 'escudo', agrupa: true },
  oficina: { icone: 'oficina', cor: 'textoSec', forma: 'quadrado', agrupa: true },
  socorro: { icone: 'socorro', cor: 'acao', forma: 'circulo', agrupa: false },
  alerta: { icone: 'alerta', cor: 'alerta', forma: 'losango', agrupa: false },
};

export const corDoPino = (tipo: TipoPino) => paletaNoite[pinos[tipo].cor];

const formas: Record<Forma, ViewStyle> = {
  escudo: { borderRadius: 6, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  circulo: { borderRadius: 22 },
  quadrado: { borderRadius: 10 },
  losango: { borderRadius: 8, transform: [{ rotate: '45deg' }], width: 36, height: 36 },
};

type Props = { tipo: TipoPino; rotulo?: string; descricao: string };

/** Pino do mapa: forma própria por tipo, borda e ícone na cor do tipo; etiqueta opcional embaixo. */
export function Pino({ tipo, rotulo, descricao }: Props) {
  const c = useCores();
  const { icone, cor: nomeCor, forma } = pinos[tipo];
  const cor = c[nomeCor];
  return (
    <View accessible accessibilityLabel={descricao} style={estilos.coluna}>
      <View
        testID={`pino-${forma}`}
        style={[estilos.caixa, formas[forma], { borderColor: cor, backgroundColor: c.superficie }]}
      >
        <View style={forma === 'losango' ? { transform: [{ rotate: '-45deg' }] } : undefined}>
          <Icone nome={icone} tamanho={22} cor={cor} />
        </View>
      </View>
      {rotulo && (
        <View style={[estilos.etiqueta, { backgroundColor: c.superficie, borderColor: c.linha }]}>
          <Texto style={[estilos.textoEtiqueta, { color: c.texto }]} maxFontSizeMultiplier={1.3}>
            {rotulo}
          </Texto>
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  coluna: { alignItems: 'center' },
  caixa: {
    width: 44,
    height: 44,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: sombra.pino,
  },
  etiqueta: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  textoEtiqueta: { fontSize: 13, fontFamily: fontes.textoSemi },
});
