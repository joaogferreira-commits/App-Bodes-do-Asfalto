import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { fontes, sombra, useCores } from '@/theme';

type Props = { flutuante?: boolean; style?: ViewStyle };

/**
 * Pedido de ajuda aos irmãos, sempre à mão (pedido do dono em 12/11/2026): abre a tela de SOS,
 * onde o irmão escolhe ligar 192/193, avisar contatos e o grupo. Abrir a tela não envia nada sozinho.
 */
export function BotaoSOS({ flutuante, style }: Props) {
  const { t } = useTranslation();
  const cores = useCores();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('sos.botaoAjuda')}
      accessibilityHint={t('sos.botaoAjudaDica')}
      hitSlop={6}
      onPress={() => router.push('/sos')}
      style={({ pressed }) => [
        estilos.botao,
        {
          backgroundColor: cores.sos,
          borderColor: cores.contornoSos,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
        flutuante && { boxShadow: sombra.flutuante },
        style,
      ]}
    >
      <Text maxFontSizeMultiplier={1.2} style={[estilos.texto, { color: cores.textoSobreSos }]}>
        SOS
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botao: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: { fontFamily: fontes.titulo, fontSize: 22, letterSpacing: 0.5 },
});
