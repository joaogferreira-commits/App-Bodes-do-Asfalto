import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cores, espaco } from '@/theme';
import { Avatar, Cartao, Icone, Texto } from '@/ui';

export default function Perfil() {
  const { t } = useTranslation();
  return (
    <SafeAreaView edges={['top']} style={estilos.tela}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <Texto variante="titulo">{t('perfil.titulo')}</Texto>
        <View style={estilos.cabecalho}>
          <Avatar nome="Irmão Teste" status="aberto" tamanho={72} />
          <View style={{ gap: 2 }}>
            <Texto variante="destaque">{t('perfil.visitante')}</Texto>
            <Texto variante="secundario">{t('perfil.capitulo')}</Texto>
          </View>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push('/catalogo')}>
          <Cartao style={estilos.linha}>
            <Icone nome="camadas" cor={cores.acao} />
            <View style={{ flex: 1 }}>
              <Texto variante="corpoForte">{t('perfil.catalogo')}</Texto>
              <Texto variante="secundario">{t('perfil.catalogoDesc')}</Texto>
            </View>
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <Icone nome="voltar" cor={cores.textoSec} />
            </View>
          </Cartao>
        </Pressable>
        <Texto variante="pequeno" style={{ textAlign: 'center' }}>
          {t('perfil.versao')}
        </Texto>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.lg, gap: espaco.xl },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
});
