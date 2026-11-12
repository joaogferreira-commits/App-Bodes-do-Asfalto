import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { escalaMaxima, fontes, toque, useCores, useEstilos, type Paleta } from '@/theme';

import { Icone } from './icones';
import { Texto } from './Texto';

export const abas = ['mapa', 'feed', 'conversas', 'passeios', 'ferramentas', 'perfil'] as const;
export type Aba = (typeof abas)[number];

type Props = { ativa: Aba; onTrocar: (aba: Aba) => void; selos?: Partial<Record<Aba, number>> };

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
    selo: {
      position: 'absolute',
      top: -6,
      right: -12,
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

/**
 * Barra inferior com as 6 abas (Conversas entrou em 12/11/2026 por decisão do dono), sempre com rótulo visível (R22, R24).
 * A aba ativa ganha cor, peso e um traço em cima (não só a cor, R23).
 */
export function BarraAbas({ ativa, onTrocar, selos }: Props) {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const c = useCores();
  const estilos = useEstilos(criarEstilos);
  return (
    <View style={[estilos.barra, { paddingBottom: Math.max(bottom, 8) }]} accessibilityRole="tablist">
      {abas.map((aba) => {
        const selecionada = aba === ativa;
        const cor = selecionada ? c.acao : c.textoSec;
        const selo = selos?.[aba] ?? 0;
        return (
          <Pressable
            key={aba}
            accessibilityRole="tab"
            accessibilityState={{ selected: selecionada }}
            accessibilityLabel={
              selo ? `${t(`abas.${aba}`)}, ${t('chat.naoLidasN', { n: selo })}` : t(`abas.${aba}`)
            }
            onPress={() => onTrocar(aba)}
            style={[estilos.aba, { minHeight: toque.minimo + 8 }]}
          >
            <View style={[estilos.indicador, { backgroundColor: selecionada ? c.acao : 'transparent' }]} />
            <View>
              <Icone
                nome={aba === 'ferramentas' ? 'grade' : aba === 'conversas' ? 'comentario' : aba}
                cor={cor}
                espessura={selecionada ? 2.4 : 2}
                tamanho={26}
              />
              {selo > 0 && (
                <View style={[estilos.selo, { backgroundColor: c.acao, borderColor: c.superficie }]}>
                  <Texto
                    style={{ color: c.textoSobreAcao, fontSize: 13, fontFamily: fontes.textoForte }}
                    maxFontSizeMultiplier={1.2}
                  >
                    {selo > 9 ? '9+' : selo}
                  </Texto>
                </View>
              )}
            </View>
            <Texto
              style={[
                estilos.rotulo,
                { color: cor, fontFamily: selecionada ? fontes.textoForte : fontes.textoSemi },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
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
