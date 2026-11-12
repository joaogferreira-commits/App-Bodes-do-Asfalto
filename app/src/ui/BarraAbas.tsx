import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cores, fontes, toque } from '@/theme';

import { Icone } from './icones';
import { Texto } from './Texto';

export const abas = ['mapa', 'feed', 'passeios', 'conquistas', 'perfil'] as const;
export type Aba = (typeof abas)[number];

type Props = { ativa: Aba; onTrocar: (aba: Aba) => void };

/** Barra inferior com as 5 abas (Interface v2): ícone 24 + rótulo 13; ativa em laranja. */
export function BarraAbas({ ativa, onTrocar }: Props) {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[estilos.barra, { paddingBottom: Math.max(bottom, 10) }]} accessibilityRole="tablist">
      {abas.map((aba) => {
        const selecionada = aba === ativa;
        const cor = selecionada ? cores.acao : cores.textoApagado;
        return (
          <Pressable
            key={aba}
            accessibilityRole="tab"
            accessibilityState={{ selected: selecionada }}
            accessibilityLabel={t(`abas.${aba}`)}
            onPress={() => onTrocar(aba)}
            style={estilos.aba}
          >
            <Icone nome={aba} cor={cor} espessura={1.9} />
            <Texto
              style={[
                estilos.rotulo,
                { color: cor, fontFamily: selecionada ? fontes.textoSemi : fontes.textoMedio },
              ]}
              numberOfLines={1}
            >
              {t(`abas.${aba}`)}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: cores.superficie,
    borderTopWidth: 1,
    borderTopColor: cores.linhaSuave,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  aba: { flex: 1, minHeight: toque.minimo, alignItems: 'center', justifyContent: 'center', gap: 4 },
  rotulo: { fontSize: 13 },
});
