import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cores, espaco } from '@/theme';
import {
  Avatar,
  BarraNavegacao,
  Botao,
  CartaoBordado,
  Chip,
  Divisoria,
  FolhaInferior,
  Texto,
  type NomeIcone,
} from '@/ui';

const filtros = ['chipTudo', 'chipIrmaos', 'chipPostos', 'chipLojas'] as const;

/** Catálogo de componentes (Etapa 0): o dono aprova o visual aqui. */
export default function Catalogo() {
  const { t } = useTranslation();
  const [filtro, setFiltro] = useState<(typeof filtros)[number]>('chipTudo');
  const [aba, setAba] = useState<NomeIcone>('mapa');
  const [folha, setFolha] = useState(false);
  const nada = () => undefined;

  return (
    <SafeAreaView style={estilos.tela}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <Botao titulo={t('comum.voltar')} variante="secundario" onPress={() => router.back()} />
        <Texto variante="tituloGrande">{t('catalogo.titulo')}</Texto>

        <Texto variante="rotulo">{t('catalogo.botoes')}</Texto>
        <Botao titulo={t('catalogo.principal')} onPress={nada} />
        <Botao titulo={t('catalogo.secundario')} variante="secundario" onPress={nada} />
        <Botao titulo={t('catalogo.sos')} variante="sos" onPress={nada} />

        <Divisoria />
        <Texto variante="rotulo">{t('catalogo.chips')}</Texto>
        <View style={estilos.linha}>
          {filtros.map((f) => (
            <Chip key={f} rotulo={t(`catalogo.${f}`)} ativo={filtro === f} onPress={() => setFiltro(f)} />
          ))}
        </View>

        <Divisoria />
        <Texto variante="rotulo">{t('catalogo.cartoes')}</Texto>
        <CartaoBordado>
          <Texto variante="titulo">{t('catalogo.cartaoTitulo')}</Texto>
          <Texto variante="secundario">{t('catalogo.cartaoTexto')}</Texto>
        </CartaoBordado>
        <CartaoBordado overlock destaque>
          <Texto variante="titulo">{t('catalogo.cartaoTitulo')}</Texto>
          <Texto variante="secundario">{t('catalogo.cartaoTexto')}</Texto>
          <View style={estilos.linha}>
            <View style={estilos.flex}>
              <Botao titulo={t('catalogo.principal')} onPress={nada} />
            </View>
            <View style={estilos.flex}>
              <Botao titulo={t('catalogo.secundario')} variante="secundario" onPress={nada} />
            </View>
          </View>
        </CartaoBordado>

        <Divisoria />
        <Texto variante="rotulo">{t('catalogo.avatares')}</Texto>
        <View style={estilos.linha}>
          <Avatar nome="Zé Ferreira" status="aberto" rotuloStatus={t('catalogo.statusAberto')} />
          <Avatar nome="Edu Prado" status="estrada" rotuloStatus={t('catalogo.statusEstrada')} />
          <Avatar nome="Ivan Coruja" status="naoPerturbe" rotuloStatus={t('catalogo.statusNaoPerturbe')} />
          <Avatar nome="Marcos" status="estrada" aproximado />
        </View>

        <Divisoria />
        <Texto variante="rotulo">{t('catalogo.folha')}</Texto>
        <Botao titulo={t('catalogo.abrirFolha')} variante="secundario" onPress={() => setFolha(true)} />

        <Divisoria />
        <Texto variante="rotulo">{t('catalogo.barra')}</Texto>
        <BarraNavegacao ativa={aba} onTrocar={setAba} />
      </ScrollView>

      <FolhaInferior visivel={folha} onFechar={() => setFolha(false)} rotuloFechar={t('comum.fechar')}>
        <Texto variante="titulo">{t('catalogo.folha')}</Texto>
        <Texto>{t('catalogo.folhaTexto')}</Texto>
        <Botao titulo={t('comum.fechar')} onPress={() => setFolha(false)} />
      </FolhaInferior>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.noite },
  conteudo: { padding: espaco.xl, gap: espaco.md, paddingBottom: espaco.xxxl },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm, alignItems: 'center' },
  flex: { flex: 1 },
});
