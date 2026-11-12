import { StyleSheet, View } from 'react-native';

import { cores, sombra } from '@/theme';

import { Icone, type NomeIcone } from './icones';
import { Texto } from './Texto';

export type TipoPino = 'sede' | 'posto' | 'loja' | 'agape' | 'oficina' | 'socorro' | 'alerta';

export const pinos: Record<TipoPino, { icone: NomeIcone; cor: string }> = {
  sede: { icone: 'sede', cor: cores.ouro },
  posto: { icone: 'posto', cor: cores.verdePosto },
  loja: { icone: 'loja', cor: cores.azulRio },
  agape: { icone: 'agape', cor: cores.ouro },
  oficina: { icone: 'oficina', cor: cores.textoSec },
  socorro: { icone: 'socorro', cor: cores.acao },
  alerta: { icone: 'alerta', cor: cores.alerta },
};

type Props = { tipo: TipoPino; rotulo?: string; descricao: string };

/** Pino do mapa: quadrado escuro com borda e ícone na cor do tipo; etiqueta opcional embaixo. */
export function Pino({ tipo, rotulo, descricao }: Props) {
  const { icone, cor } = pinos[tipo];
  return (
    <View accessible accessibilityLabel={descricao} style={estilos.coluna}>
      <View style={[estilos.caixa, { borderColor: cor }]}>
        <Icone nome={icone} tamanho={22} cor={cor} />
      </View>
      {rotulo && (
        <View style={estilos.etiqueta}>
          <Texto style={estilos.textoEtiqueta}>{rotulo}</Texto>
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  coluna: { alignItems: 'center' },
  caixa: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#1F1A14',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: sombra.pino,
  },
  etiqueta: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(11,9,7,0.85)',
  },
  textoEtiqueta: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: cores.texto },
});
