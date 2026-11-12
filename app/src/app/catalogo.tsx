import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cores, espaco } from '@/theme';
import {
  Avatar,
  BarraAbas,
  Botao,
  BotaoIcone,
  caminhosIcones,
  Cartao,
  Chip,
  Divisoria,
  Icone,
  Pino,
  Texto,
  type Aba,
  type NomeIcone,
} from '@/ui';

const filtros = ['tudo', 'irmaos', 'postos', 'sedes', 'lojas'] as const;
const corFiltro: Record<(typeof filtros)[number], string | undefined> = {
  tudo: undefined,
  irmaos: cores.acao,
  postos: cores.verdePosto,
  sedes: cores.ouro,
  lojas: cores.azulRio,
};

/** Catálogo de componentes (Interface v2): o dono revisa o visual aqui. */
export default function Catalogo() {
  const { t } = useTranslation();
  const [filtro, setFiltro] = useState<(typeof filtros)[number]>('tudo');
  const [aba, setAba] = useState<Aba>('mapa');
  const nada = () => undefined;

  return (
    <SafeAreaView style={estilos.tela}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <View style={estilos.topo}>
          <BotaoIcone icone="voltar" rotulo={t('comum.voltar')} onPress={() => router.back()} />
          <Texto variante="titulo">{t('catalogo.titulo')}</Texto>
        </View>

        <Texto variante="rotulo">{t('catalogo.botoes')}</Texto>
        <Botao titulo={t('catalogo.principal')} grande icone="navegar" onPress={nada} />
        <View style={estilos.linha}>
          <View style={{ flex: 1 }}>
            <Botao
              titulo={t('catalogo.secundario')}
              variante="secundario"
              icone="postoRota"
              corIcone={cores.verdePosto}
              onPress={nada}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Botao titulo={t('catalogo.contorno')} variante="contorno" onPress={nada} />
          </View>
        </View>
        <Botao titulo={t('catalogo.sos')} variante="sos" onPress={nada} />

        <Divisoria />
        <Texto variante="rotulo">{t('catalogo.chips')}</Texto>
        <View style={estilos.quebra}>
          {filtros.map((f) => (
            <Chip
              key={f}
              rotulo={t(`mapa.filtros.${f}`)}
              corPonto={corFiltro[f]}
              ativo={filtro === f}
              onPress={() => setFiltro(f)}
            />
          ))}
        </View>

        <Divisoria />
        <Texto variante="rotulo">{t('catalogo.cartoes')}</Texto>
        <Cartao>
          <Texto variante="rotulo" style={{ color: cores.acao }}>
            NOV 22 · CAPÍTULO CUIABÁ
          </Texto>
          <Texto variante="subtitulo" style={{ marginTop: 4 }}>
            {t('catalogo.cartaoTitulo')}
          </Texto>
          <Texto variante="secundario">{t('catalogo.cartaoTexto')}</Texto>
          <View style={[estilos.linha, { marginTop: espaco.sm }]}>
            <View style={{ flex: 1 }}>
              <Botao titulo={t('mapa.vou')} onPress={nada} />
            </View>
            <View style={{ flex: 1 }}>
              <Botao titulo="Talvez" variante="contorno" onPress={nada} />
            </View>
          </View>
        </Cartao>

        <Divisoria />
        <Texto variante="rotulo">{t('catalogo.avatares')}</Texto>
        <View style={estilos.quebra}>
          <Avatar nome="Zé Ferreira" status="aberto" rotuloStatus={t('catalogo.statusAberto')} />
          <Avatar nome="Edu Prado" status="estrada" rotuloStatus={t('catalogo.statusEstrada')} />
          <Avatar nome="Marcos Ferrugem" status="cafe" rotuloStatus={t('catalogo.statusCafe')} />
          <Avatar nome="Ivan Coruja" status="naoPerturbe" rotuloStatus={t('catalogo.statusNaoPerturbe')} />
        </View>

        <Divisoria />
        <Texto variante="rotulo">{t('catalogo.pinos')}</Texto>
        <View style={estilos.quebra}>
          <Pino tipo="sede" descricao="Sede" />
          <Pino tipo="posto" rotulo="R$ 6,29" descricao="Posto" />
          <Pino tipo="loja" descricao="Loja" />
          <Pino tipo="agape" descricao="Ágape" />
          <Pino tipo="oficina" descricao="Oficina" />
          <Pino tipo="socorro" descricao="Socorro" />
          <Pino tipo="alerta" descricao="Alerta" />
        </View>

        <Divisoria />
        <Texto variante="rotulo">{t('catalogo.icones')}</Texto>
        <View style={estilos.icones}>
          {(Object.keys(caminhosIcones) as NomeIcone[]).map((nome) => (
            <View key={nome} style={estilos.icone}>
              <Icone nome={nome} tamanho={28} />
            </View>
          ))}
        </View>

        <Divisoria />
        <Texto variante="rotulo">{t('catalogo.barra')}</Texto>
      </ScrollView>
      <BarraAbas ativa={aba} onTrocar={setAba} />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.lg, gap: espaco.md, paddingBottom: espaco.xxxl },
  topo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  linha: { flexDirection: 'row', gap: espaco.sm },
  quebra: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm, alignItems: 'center' },
  icones: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs },
  icone: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.linhaSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
