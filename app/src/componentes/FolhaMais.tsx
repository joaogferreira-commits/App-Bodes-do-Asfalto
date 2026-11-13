import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { Filtro } from '@/dados/exemplos';
import { servidorConfigurado } from '@/servidor/supabase';
import {
  espaco,
  fontes,
  raios,
  sombra,
  toque,
  useCores,
  useEstilos,
  type NomeCor,
  type Paleta,
} from '@/theme';
import { Icone, pinos, Texto, type TipoPino } from '@/ui';

/** Grupos que ficam atrás do chip "Mais" (Postos tem chip próprio). */
export const gruposMais: { chave: Filtro; cor: NomeCor }[] = [
  { chave: 'clube', cor: 'ouro' },
  { chave: 'natureza', cor: 'azulRio' },
  { chave: 'cultura', cor: 'textoSec' },
  { chave: 'apoio', cor: 'estrada' },
];

/** Legenda dos pinos por grupo: um ícone de traço de cada tipo, na cor do pino. */
const legendaPontos: { chave: 'postos' | 'natureza' | 'cultura' | 'apoio'; tipos: TipoPino[] }[] = [
  { chave: 'postos', tipos: ['posto', 'oficina_moto', 'borracharia'] },
  { chave: 'natureza', tipos: ['cachoeira', 'mirante', 'praia', 'parque', 'camping'] },
  { chave: 'cultura', tipos: ['museu', 'monumento', 'atracao', 'igreja_historica'] },
  { chave: 'apoio', tipos: ['hospedagem', 'hospital', 'policia_rodoviaria'] },
];

const criarEstilos = (c: Paleta) =>
  StyleSheet.create({
    fundo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(10,8,6,0.6)' },
    folha: {
      backgroundColor: c.superficie,
      borderTopLeftRadius: raios.folha,
      borderTopRightRadius: raios.folha,
      borderTopWidth: 1,
      borderColor: c.linha,
      padding: espaco.md,
      paddingBottom: espaco.xl,
      maxHeight: '85%',
      boxShadow: sombra.folha,
    },
    alca: {
      alignSelf: 'center',
      width: 44,
      height: 5,
      borderRadius: 4,
      backgroundColor: c.linhaForte,
      marginBottom: espaco.xs,
    },
    linha: {
      minHeight: toque.botao,
      flexDirection: 'row',
      alignItems: 'center',
      gap: espaco.sm,
      paddingHorizontal: espaco.sm,
      borderRadius: raios.botao,
    },
    linhaAtiva: { backgroundColor: c.superficie3 },
    rotulo: { flex: 1, fontFamily: fontes.textoSemi, fontSize: 17, color: c.texto },
    ponto: { width: 12, height: 12, borderRadius: 6 },
    legenda: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36 },
    icones: { flexDirection: 'row', gap: 4 },
    amostra: { width: 34, height: 7, borderRadius: 4, overflow: 'hidden', justifyContent: 'center' },
    tracejado: { flexDirection: 'row', gap: 4, paddingHorizontal: 2 },
    traco: { width: 5, height: 3, borderRadius: 2 },
  });

function LinhaEstrada({ terra, rota, texto }: { terra?: boolean; rota?: boolean; texto: string }) {
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const cor = rota ? cores.acao : terra ? cores.terra : cores.asfalto;
  return (
    <View style={estilos.legenda}>
      <View style={[estilos.amostra, { backgroundColor: terra && !rota ? cores.terraEscura : cor }]}>
        {terra && (
          <View style={estilos.tracejado}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[estilos.traco, { backgroundColor: rota ? cores.rotaTerra : cores.terra }]}
              />
            ))}
          </View>
        )}
      </View>
      <Texto variante="pequeno" style={{ color: cores.texto }}>
        {texto}
      </Texto>
    </View>
  );
}

/** "Tipos de ponto": o que significa cada ícone e cada traço do mapa (antes era a legenda sobre o mapa). */
export function LegendaTipos() {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  return (
    <View style={{ gap: espaco.xs }} testID="legenda-tipos">
      <LinhaEstrada texto={t('mapa.legendaAsfalto')} />
      <LinhaEstrada terra texto={t('mapa.legendaTerra')} />
      <LinhaEstrada rota texto={t('mapa.legendaRota')} />
      <LinhaEstrada rota terra texto={t('mapa.legendaRotaTerra')} />
      <Texto variante="rotulo">{t('mapa.legendaPontos.titulo')}</Texto>
      {legendaPontos.map((g) => (
        <View key={g.chave} style={estilos.legenda} testID={`legenda-${g.chave}`}>
          <View style={estilos.icones}>
            {g.tipos.map((tp) => (
              <Icone key={tp} nome={pinos[tp].icone} tamanho={22} cor={cores[pinos[tp].cor]} />
            ))}
          </View>
          <Texto variante="pequeno" style={{ color: cores.texto, flexShrink: 1 }}>
            {t(`mapa.legendaPontos.${g.chave}`)}
          </Texto>
        </View>
      ))}
      {!servidorConfigurado && <Texto variante="pequeno">{t('mapa.dadosExemplo')}</Texto>}
    </View>
  );
}

type Props = {
  aberto: boolean;
  filtro: Filtro;
  aoEscolher: (f: Filtro) => void;
  aoFechar: () => void;
};

/** Folha do chip "Mais": Clube, Natureza, Cultura, Apoio e, por último, "O que significa cada ícone". */
export function FolhaMais({ aberto, filtro, aoEscolher, aoFechar }: Props) {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const [legenda, setLegenda] = useState(false);
  const fechar = () => {
    setLegenda(false);
    aoFechar();
  };
  return (
    <Modal transparent animationType="slide" statusBarTranslucent visible={aberto} onRequestClose={fechar}>
      <View style={estilos.fundo} accessibilityViewIsModal>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel={t('comum.fechar')}
          testID="mais-fundo"
          onPress={fechar}
        />
        <View style={estilos.folha}>
          <View style={estilos.alca} />
          <ScrollView bounces={false} contentContainerStyle={{ gap: espaco.xxs }}>
            {legenda ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('comum.voltar')}
                  onPress={() => setLegenda(false)}
                  style={estilos.linha}
                >
                  <Icone nome="voltar" tamanho={24} cor={cores.textoSec} />
                  <Texto style={estilos.rotulo}>{t('mapa.tiposDePonto')}</Texto>
                </Pressable>
                <LegendaTipos />
              </>
            ) : (
              <>
                <Texto variante="subtitulo" accessibilityRole="header" style={{ padding: espaco.xs }}>
                  {t('mapa.maisTitulo')}
                </Texto>
                {gruposMais.map((g) => (
                  <Pressable
                    key={g.chave}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: filtro === g.chave }}
                    accessibilityLabel={t(`mapa.filtros.${g.chave}`)}
                    onPress={() => {
                      aoEscolher(g.chave);
                      fechar();
                    }}
                    style={[estilos.linha, filtro === g.chave && estilos.linhaAtiva]}
                  >
                    <View style={[estilos.ponto, { backgroundColor: cores[g.cor] }]} />
                    <Texto style={estilos.rotulo}>{t(`mapa.filtros.${g.chave}`)}</Texto>
                    {filtro === g.chave && <Icone nome="check" tamanho={24} cor={cores.acao} />}
                  </Pressable>
                ))}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('mapa.oQueSignifica')}
                  onPress={() => setLegenda(true)}
                  style={estilos.linha}
                >
                  <Icone nome="camadas" tamanho={24} cor={cores.textoSec} />
                  <Texto style={estilos.rotulo}>{t('mapa.oQueSignifica')}</Texto>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
