import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { espaco, useCores } from '@/theme';
import { Botao, Icone, Texto } from '@/ui';

import { liberarGarupa } from './liberacaoGarupa';

/**
 * Cobre feed, passeios, conquistas e perfil quando a moto anda (R3).
 * Só oferece duas saídas grandes: o modo pilotando ou o mapa.
 */
export function TelaEmMovimento({ aoIrAoMapa }: { aoIrAoMapa: () => void }) {
  const { t } = useTranslation();
  const c = useCores();
  return (
    <View
      testID="tela-em-movimento"
      accessibilityViewIsModal
      style={[StyleSheet.absoluteFill, estilos.base, { backgroundColor: c.fundo }]}
    >
      <Icone nome="moto" tamanho={64} cor={c.acao} />
      <Texto variante="titulo" style={estilos.centro}>
        {t('movimento.titulo')}
      </Texto>
      <Texto style={estilos.centro}>{t('movimento.texto')}</Texto>
      <Texto variante="secundario" style={estilos.centro}>
        {t('movimento.garupaAviso')}
      </Texto>
      <View style={estilos.botoes}>
        <Botao
          titulo={t('movimento.pilotando')}
          grande
          icone="navegar"
          onPress={() => router.push('/rota')}
        />
        <Botao titulo={t('movimento.mapa')} grande variante="secundario" icone="mapa" onPress={aoIrAoMapa} />
        <Botao titulo={t('movimento.garupa')} variante="secundario" icone="perfil" onPress={() => liberarGarupa()} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', gap: espaco.md, padding: espaco.xl },
  centro: { textAlign: 'center' },
  botoes: { alignSelf: 'stretch', gap: espaco.sm, marginTop: espaco.md },
});
