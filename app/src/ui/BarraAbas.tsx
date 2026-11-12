import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { escalaMaxima, fontes, toque, useCores, useEstilos, type Paleta } from '@/theme';

import { Icone } from './icones';
import { Texto } from './Texto';

export const abas = ['mapa', 'feed', 'passeios', 'conquistas', 'perfil'] as const;
export type Aba = (typeof abas)[number];

type Props = { ativa: Aba; onTrocar: (aba: Aba) => void };

const criarEstilos = (c: Paleta) =>
  StyleSheet.create({
    barra: {
      flexDirection: 'row',
      backgroundColor: c.superficie,
      borderTopWidth: 1,
      borderTopColor: c.linha,
      paddingTop: 6,
      paddingHorizontal: 4,
    },
    aba: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 3 },
    indicador: { width: 32, height: 3, borderRadius: 2, marginBottom: 2 },
    rotulo: { fontSize: 13 },
  });

/**
 * Barra inferior com as 5 abas, sempre com rótulo visível (R22, R24).
 * A aba ativa ganha cor, peso e um traço em cima (não só a cor, R23).
 */
export function BarraAbas({ ativa, onTrocar }: Props) {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const c = useCores();
  const estilos = useEstilos(criarEstilos);
  return (
    <View style={[estilos.barra, { paddingBottom: Math.max(bottom, 8) }]} accessibilityRole="tablist">
      {abas.map((aba) => {
        const selecionada = aba === ativa;
        const cor = selecionada ? c.acao : c.textoSec;
        return (
          <Pressable
            key={aba}
            accessibilityRole="tab"
            accessibilityState={{ selected: selecionada }}
            accessibilityLabel={t(`abas.${aba}`)}
            onPress={() => onTrocar(aba)}
            style={[estilos.aba, { minHeight: toque.minimo + 8 }]}
          >
            <View style={[estilos.indicador, { backgroundColor: selecionada ? c.acao : 'transparent' }]} />
            <Icone nome={aba} cor={cor} espessura={selecionada ? 2.4 : 2} tamanho={26} />
            <Texto
              style={[
                estilos.rotulo,
                { color: cor, fontFamily: selecionada ? fontes.textoForte : fontes.textoSemi },
              ]}
              numberOfLines={1}
              maxFontSizeMultiplier={escalaMaxima.barra}
            >
              {t(`abas.${aba}`)}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}
