import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { TelaFerramenta } from '@/componentes/TelaFerramenta';
import { bateVoltaPadrao, useViagem } from '@/estado/viagem';
import { gruposFerramentas } from '@/ferramentas/catalogo';
import { espaco, fontes, raios, useCores, useEstilos, type Paleta } from '@/theme';
import { Icone, Texto } from '@/ui';

/** Central de ferramentas: tudo o que o irmão usa antes, durante (parado) e depois da estrada. */
export default function Ferramentas() {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const viagem = useViagem();
  return (
    <TelaFerramenta titulo={t('ferramentas.titulo')} explicacao={t('ferramentas.explicacao')}>
      {gruposFerramentas.map((g) => (
        <View key={g.grupo} style={{ gap: espaco.sm }}>
          <Texto variante="rotulo">{t(`ferramentas.grupos.${g.grupo}`)}</Texto>
          <View style={estilos.grade}>
            {g.itens.map((f) => (
              <Pressable
                key={f.chave}
                accessibilityRole="button"
                accessibilityLabel={t(`ferramentas.itens.${f.chave}.titulo`)}
                onPress={() => {
                  if (f.chave === 'bateVolta') viagem.definirBateVolta(viagem.bateVolta ?? bateVoltaPadrao);
                  router.push(f.rota as Href);
                }}
                style={({ pressed }) => [estilos.item, pressed && { backgroundColor: cores.superficie3 }]}
              >
                <Icone nome={f.icone} tamanho={30} cor={cores[f.cor]} espessura={2.2} />
                <Texto style={estilos.titulo} numberOfLines={2}>
                  {t(`ferramentas.itens.${f.chave}.titulo`)}
                </Texto>
                <Texto variante="pequeno" numberOfLines={2}>
                  {t(`ferramentas.itens.${f.chave}.resumo`)}
                </Texto>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </TelaFerramenta>
  );
}

const criarEstilos = (cores: Paleta) =>
  StyleSheet.create({
    grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
    item: {
      width: '47%',
      flexGrow: 1,
      minHeight: 118,
      gap: 6,
      padding: espaco.md,
      borderRadius: raios.cartao,
      borderWidth: 1,
      borderColor: cores.linha,
      backgroundColor: cores.superficie2,
    },
    titulo: { fontFamily: fontes.textoForte, fontSize: 17, color: cores.texto },
  });
