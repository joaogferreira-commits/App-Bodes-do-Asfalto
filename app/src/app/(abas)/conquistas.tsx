import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cores, espaco } from '@/theme';
import { EstadoVazio, Texto } from '@/ui';

export default function Tela() {
  const { t } = useTranslation();
  return (
    <SafeAreaView edges={['top']} style={estilos.tela}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <Texto variante="titulo" style={estilos.titulo}>
          {t('abas.conquistas')}
        </Texto>
        <EstadoVazio
          ilustracao="viagem"
          titulo={t('vazios.conquistasTitulo')}
          texto={t('vazios.conquistasTexto')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingVertical: espaco.xl, gap: espaco.xl },
  titulo: { paddingHorizontal: espaco.lg },
});
