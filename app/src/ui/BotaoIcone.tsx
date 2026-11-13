import { Pressable, StyleSheet, View } from 'react-native';

import { fontes, raios, sombra, toque, useCores, useEstilos, type Paleta } from '@/theme';

import { Icone, type NomeIcone } from './icones';
import { Texto } from './Texto';

type Props = {
  icone: NomeIcone;
  rotulo: string;
  onPress: () => void;
  corIcone?: string;
  /** Rótulo visível ao lado do ícone (R22: ícone sempre com rótulo nas ações do mapa). */
  legenda?: string;
  /** Rótulo visível embaixo do ícone (botões laterais do mapa). */
  legendaAbaixo?: boolean;
  flutuante?: boolean;
  /** Ligado (ex.: modo seguir): preenchido com a cor de ação. */
  ativo?: boolean;
};

const criarEstilos = (c: Paleta) =>
  StyleSheet.create({
    base: {
      minWidth: toque.minimo,
      minHeight: toque.minimo,
      borderRadius: raios.botao,
      borderWidth: 1,
      borderColor: c.linha,
      backgroundColor: c.sobreMapa,
      justifyContent: 'center',
    },
    comLegenda: { paddingHorizontal: 12 },
    abaixo: { width: 64, paddingVertical: 6 },
    centro: { alignItems: 'center', justifyContent: 'center' },
    linha: { flexDirection: 'row', gap: 6 },
    coluna: { gap: 2 },
    legenda: { fontSize: 13, fontFamily: fontes.textoSemi, color: c.texto, textAlign: 'center' },
  });

/** Botão de ícone (mínimo 48 dp). Superfície opaca sobre o mapa (R25). */
export function BotaoIcone({
  icone,
  rotulo,
  onPress,
  corIcone,
  legenda,
  legendaAbaixo,
  flutuante,
  ativo,
}: Props) {
  const c = useCores();
  const estilos = useEstilos(criarEstilos);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={ativo === undefined ? undefined : { selected: ativo }}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.base,
        legenda ? (legendaAbaixo ? estilos.abaixo : estilos.comLegenda) : null,
        flutuante && { boxShadow: sombra.flutuante },
        ativo && { backgroundColor: c.acao, borderColor: c.acao },
        pressed && { backgroundColor: c.superficie3 },
      ]}
    >
      <View style={[estilos.centro, legenda ? (legendaAbaixo ? estilos.coluna : estilos.linha) : null]}>
        <Icone
          nome={icone}
          tamanho={24}
          cor={ativo ? c.textoSobreAcao : (corIcone ?? c.texto)}
          espessura={2}
        />
        {legenda && (
          <Texto
            style={[estilos.legenda, ativo && { color: c.textoSobreAcao }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}
          >
            {legenda}
          </Texto>
        )}
      </View>
    </Pressable>
  );
}
