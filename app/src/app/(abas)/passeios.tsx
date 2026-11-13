import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CartaoPasseio } from '@/componentes/CartaoPasseio';
import { usePasseios } from '@/servidor/usePasseios';
import { espaco, useCores, useEstilos, type Paleta } from '@/theme';
import { Botao, Chip, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

type Filtro = 'proximos' | 'oficiais' | 'passados';

/** Agenda de passeios: próximos, só oficiais ou passados. Dados de exemplo até a Etapa 2. */
export default function Passeios() {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const [filtro, setFiltro] = useState<Filtro>('proximos');
  const { passeios, servidor, podeCriar } = usePasseios();
  const lista = passeios.filter((p) =>
    filtro === 'passados'
      ? p.quando === 'passados'
      : p.quando === 'proximos' && (filtro !== 'oficiais' || p.oficial),
  );

  return (
    <SafeAreaView edges={['top']} style={[estilos.tela, { backgroundColor: cores.fundo }]}>
      <FlatList
        data={lista}
        keyExtractor={(p) => p.id}
        contentContainerStyle={estilos.conteudo}
        ListHeaderComponent={
          <View style={{ gap: espaco.md }}>
            <View>
              <Texto variante="titulo">{t('abas.passeios')}</Texto>
              <Texto variante="pequeno">{servidor ? t('passeios.subtitulo') : t('passeios.exemplo')}</Texto>
            </View>
            <View style={{ flexDirection: 'row', gap: espaco.xs }}>
              {podeCriar && (
                <View style={{ flex: 1 }}>
                  <Botao
                    titulo={t('passeios.criar')}
                    icone="mais"
                    onPress={() =>
                      servidor
                        ? router.push('/passeio-novo')
                        : avisar(t('comum.emBreve'), t('passeios.criarEmBreve'))
                    }
                  />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Botao
                  titulo={t('rota.bateVolta.chip')}
                  icone="rota"
                  variante="secundario"
                  onPress={() => router.push('/rota')}
                />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: espaco.xs, flexWrap: 'wrap' }}>
              {(['proximos', 'oficiais', 'passados'] as Filtro[]).map((f) => (
                <Chip
                  key={f}
                  rotulo={t(`passeios.filtros.${f}`)}
                  ativo={filtro === f}
                  onPress={() => setFiltro(f)}
                />
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={servidor ? <Texto variante="secundario">{t('passeios.vazio')}</Texto> : <View />}
        renderItem={({ item }) => <CartaoPasseio key={item.id} passeio={item} />}
      />
    </SafeAreaView>
  );
}

const criarEstilos = (_cores: Paleta) =>
  StyleSheet.create({
    tela: { flex: 1 },
    conteudo: { padding: espaco.md, gap: espaco.md, paddingBottom: espaco.xxxl },
  });
