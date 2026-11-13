import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { TipoEstrada } from '@/rotas/tipos';
import { espaco, fontes, raios, sombra, useCores, useEstilos, type Paleta } from '@/theme';
import { Texto } from '@/ui';

import { ESTRADAS, TIPOS_MAPA, VISOES, VOZES, type OpcoesNavegacao } from './opcoes';

type Props = {
  visivel: boolean;
  opcoes: OpcoesNavegacao;
  /** Tipo de estrada em uso na rota (vem do planejamento). */
  estrada: TipoEstrada;
  recalculando: boolean;
  aoMudar: (parcial: Partial<OpcoesNavegacao>) => void;
  aoMudarEstrada: (tipo: TipoEstrada) => void;
  aoFechar: () => void;
};

const ALTURA_BOTAO = 64;

const criarEstilos = (c: Paleta) =>
  StyleSheet.create({
    fundo: { flex: 1, backgroundColor: 'rgba(10,8,6,0.72)' },
    folha: {
      maxHeight: '85%',
      backgroundColor: c.superficie,
      borderTopLeftRadius: raios.folha,
      borderTopRightRadius: raios.folha,
      borderTopWidth: 1,
      borderColor: c.linha,
      boxShadow: sombra.folha,
    },
    conteudo: { padding: espaco.md, gap: espaco.sm },
    linha: { flexDirection: 'row', gap: espaco.xs },
    botao: {
      flex: 1,
      minHeight: ALTURA_BOTAO,
      borderRadius: raios.botao,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: espaco.xs,
    },
    texto: { fontFamily: fontes.textoForte, fontSize: 16, lineHeight: 20, textAlign: 'center' },
  });

function Escolha({
  rotulo,
  ativo,
  aoTocar,
  desativado,
}: {
  rotulo: string;
  ativo: boolean;
  aoTocar: () => void;
  desativado?: boolean;
}) {
  const c = useCores();
  const estilos = useEstilos(criarEstilos);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ selected: ativo, disabled: !!desativado }}
      disabled={desativado}
      onPress={aoTocar}
      style={[
        estilos.botao,
        {
          backgroundColor: ativo ? c.acao : c.superficie3,
          borderColor: ativo ? c.acao : c.linhaForte,
          opacity: desativado ? 0.5 : 1,
        },
      ]}
    >
      <Texto style={[estilos.texto, { color: ativo ? c.fundo : c.texto }]} maxFontSizeMultiplier={1.3}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

/**
 * Folha "Camadas e opções" da navegação. Pensada para quem está pilotando: seis linhas, botões
 * grandes (64 dp), um toque por escolha, sem campos de texto. Fecha tocando fora ou no voltar.
 */
export function FolhaOpcoes({
  visivel,
  opcoes,
  estrada,
  recalculando,
  aoMudar,
  aoMudarEstrada,
  aoFechar,
}: Props) {
  const { t } = useTranslation();
  const estilos = useEstilos(criarEstilos);

  return (
    <Modal visible={visivel} transparent statusBarTranslucent animationType="slide" onRequestClose={aoFechar}>
      <Pressable
        style={estilos.fundo}
        onPress={aoFechar}
        accessibilityRole="button"
        accessibilityLabel={t('opcoesNav.fechar')}
      />
      <View style={estilos.folha} testID="folha-opcoes">
        <ScrollView contentContainerStyle={estilos.conteudo}>
          <Texto variante="subtitulo">
            {recalculando ? t('opcoesNav.recalculando') : t('opcoesNav.titulo')}
          </Texto>

          <Texto variante="rotulo">{t('opcoesNav.transito')}</Texto>
          <View style={estilos.linha}>
            <Escolha
              rotulo={t('opcoesNav.ligado')}
              ativo={opcoes.transito}
              aoTocar={() => aoMudar({ transito: true })}
            />
            <Escolha
              rotulo={t('opcoesNav.desligado')}
              ativo={!opcoes.transito}
              aoTocar={() => aoMudar({ transito: false })}
            />
          </View>

          <Texto variante="rotulo">{t('opcoesNav.mapa')}</Texto>
          <View style={estilos.linha}>
            {TIPOS_MAPA.map((m) => (
              <Escolha
                key={m}
                rotulo={t(`opcoesNav.mapa${m[0]!.toUpperCase()}${m.slice(1)}`)}
                ativo={opcoes.mapa === m}
                aoTocar={() => aoMudar({ mapa: m })}
              />
            ))}
          </View>

          <Texto variante="rotulo">{t('opcoesNav.visao')}</Texto>
          <View style={estilos.linha}>
            {VISOES.map((v) => (
              <Escolha
                key={v}
                rotulo={t(`opcoesNav.visao${v[0]!.toUpperCase()}${v.slice(1)}`)}
                ativo={opcoes.visao === v}
                aoTocar={() => aoMudar({ visao: v })}
              />
            ))}
          </View>

          <Texto variante="rotulo">{t('opcoesNav.voz')}</Texto>
          <View style={estilos.linha}>
            {VOZES.map((v) => (
              <Escolha
                key={v}
                rotulo={t(`opcoesNav.voz${v[0]!.toUpperCase()}${v.slice(1)}`)}
                ativo={opcoes.voz === v}
                aoTocar={() => aoMudar({ voz: v })}
              />
            ))}
          </View>

          <Texto variante="rotulo">{t('opcoesNav.evitar')}</Texto>
          <View style={estilos.linha}>
            <Escolha
              rotulo={t('opcoesNav.evitarPedagios')}
              ativo={opcoes.evitarPedagios}
              aoTocar={() => aoMudar({ evitarPedagios: !opcoes.evitarPedagios })}
            />
            <Escolha
              rotulo={t('opcoesNav.evitarRodovias')}
              ativo={opcoes.evitarRodovias}
              aoTocar={() => aoMudar({ evitarRodovias: !opcoes.evitarRodovias })}
            />
            <Escolha
              rotulo={t('opcoesNav.evitarBalsas')}
              ativo={opcoes.evitarBalsas}
              aoTocar={() => aoMudar({ evitarBalsas: !opcoes.evitarBalsas })}
            />
          </View>

          <Texto variante="rotulo">{t('opcoesNav.estrada')}</Texto>
          <View style={estilos.linha}>
            {ESTRADAS.map((e) => (
              <Escolha
                key={e}
                rotulo={t(`opcoesNav.estrada${e[0]!.toUpperCase()}${e.slice(1)}`)}
                ativo={estrada === e}
                desativado={recalculando}
                aoTocar={() => aoMudarEstrada(e)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
