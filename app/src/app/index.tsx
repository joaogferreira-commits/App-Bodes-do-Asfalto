import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cores, espaco, tema } from '@/theme';
import { CartaoBordado, Texto } from '@/ui';

type Item = { chave: 'catalogo' | 'mapa' | 'navegacao'; rota?: Href };

const itens: Item[] = [
  { chave: 'catalogo', rota: '/catalogo' },
  { chave: 'mapa', rota: '/mapa' },
  { chave: 'navegacao', rota: '/navegacao' },
];

/** Menu da versão de teste da Etapa 0. */
export default function MenuDeTestes() {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={estilos.tela}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <Texto variante="rotulo">{tema.marca.nome}</Texto>
        <Texto variante="tituloGrande">{t('testes.titulo')}</Texto>
        <Texto variante="secundario">{t('testes.subtitulo')}</Texto>
        <View style={estilos.lista}>
          {itens.map(({ chave, rota }) => (
            <Pressable
              key={chave}
              accessibilityRole="button"
              accessibilityState={{ disabled: !rota }}
              disabled={!rota}
              onPress={() => rota && router.push(rota)}
            >
              <CartaoBordado overlock={!!rota} style={!rota && { opacity: 0.55 }}>
                <Texto variante="titulo">{t(`testes.${chave}`)}</Texto>
                <Texto variante="secundario">{rota ? t(`testes.${chave}Desc`) : t('testes.emBreve')}</Texto>
              </CartaoBordado>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.noite },
  conteudo: { padding: espaco.xl, gap: espaco.xs },
  lista: { marginTop: espaco.xl, gap: espaco.lg },
});
