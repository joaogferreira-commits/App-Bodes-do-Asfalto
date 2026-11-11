import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { cores, espaco, fontes, raios, toque } from '@/theme';

import { Icone, type NomeIcone } from './icones';
import { Profundidade } from './Profundidade';
import { Texto } from './Texto';

export const abas: NomeIcone[] = ['mapa', 'feed', 'passeios', 'conquistas', 'perfil'];

type Props = { ativa: NomeIcone; onTrocar: (aba: NomeIcone) => void };

/** Barra inferior com as 5 abas; indicador ativo em forma de pesponto. */
export function BarraNavegacao({ ativa, onTrocar }: Props) {
  const { t } = useTranslation();
  return (
    <View style={estilos.barra} accessibilityRole="tablist">
      <Profundidade nivel="patch" raio={raios.folha} />
      {abas.map((aba) => {
        const selecionada = aba === ativa;
        return (
          <Pressable
            key={aba}
            accessibilityRole="tab"
            accessibilityState={{ selected: selecionada }}
            accessibilityLabel={t(`abas.${aba}`)}
            onPress={() => onTrocar(aba)}
            style={estilos.aba}
          >
            <Icone
              nome={aba}
              cor={selecionada ? cores.creme : cores.caramelo}
              destaque={selecionada ? cores.laranja : cores.caramelo}
            />
            <Texto
              style={[estilos.rotulo, { color: selecionada ? cores.laranja : cores.caramelo }]}
              numberOfLines={1}
            >
              {t(`abas.${aba}`)}
            </Texto>
            <View style={[estilos.indicador, !selecionada && { opacity: 0 }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: cores.sarja,
    borderRadius: raios.folha,
    borderWidth: 1,
    borderColor: cores.linhaEscura,
    paddingVertical: espaco.xs,
  },
  aba: { flex: 1, minHeight: toque.minimo + 12, alignItems: 'center', justifyContent: 'center', gap: 2 },
  rotulo: { fontFamily: fontes.tituloSemi, fontSize: 13, letterSpacing: 0.5 },
  indicador: {
    width: 22,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: cores.laranja,
    marginTop: 2,
  },
});
