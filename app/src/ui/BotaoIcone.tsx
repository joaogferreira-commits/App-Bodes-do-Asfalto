import { Pressable, StyleSheet, View } from 'react-native';

import { cores, raios, sombra, toque } from '@/theme';

import { Icone, type NomeIcone } from './icones';
import { Texto } from './Texto';

type Props = {
  icone: NomeIcone;
  rotulo: string;
  onPress: () => void;
  corIcone?: string;
  legenda?: string;
  flutuante?: boolean;
};

/** Botão quadrado só com ícone (48 px). O rótulo vai para a acessibilidade. */
export function BotaoIcone({ icone, rotulo, onPress, corIcone = cores.texto, legenda, flutuante }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.base,
        legenda ? estilos.comLegenda : null,
        flutuante && { boxShadow: sombra.flutuante },
        pressed && { backgroundColor: cores.superficie2 },
      ]}
    >
      <View style={[estilos.centro, legenda ? estilos.linha : null]}>
        <Icone nome={icone} tamanho={22} cor={corIcone} />
        {legenda && (
          <Texto style={estilos.legenda} numberOfLines={1}>
            {legenda}
          </Texto>
        )}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    width: toque.minimo,
    height: toque.minimo,
    borderRadius: raios.botao,
    borderWidth: 1,
    borderColor: cores.linha,
    backgroundColor: 'rgba(22,18,14,0.94)',
    justifyContent: 'center',
  },
  comLegenda: { width: undefined, paddingHorizontal: 12 },
  centro: { alignItems: 'center', justifyContent: 'center' },
  linha: { flexDirection: 'row', gap: 6 },
  legenda: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: cores.texto },
});
