import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  comoGanharXp,
  conquistou,
  exemploIrmao,
  rankingCapitulos,
  niveis,
  nivelDoXp,
  selos,
  type ChaveSelo,
} from '@/dados/conquistas';
import { RankingServidor } from '@/componentes/RankingServidor';
import { useMeuProgresso } from '@/servidor/useGamificacao';
import { espaco, fontes, raios, useCores, useEstilos, type Paleta } from '@/theme';
import { Botao, Cartao, Icone, Texto } from '@/ui';

const formatarXp = (n: number) => n.toLocaleString('pt-BR');

function Barra({ fracao, cor }: { fracao: number; cor: string }) {
  const cores = useCores();
  return (
    <View style={{ height: 10, borderRadius: 5, backgroundColor: cores.superficie3, overflow: 'hidden' }}>
      <View style={{ width: `${Math.round(fracao * 100)}%`, height: '100%', backgroundColor: cor }} />
    </View>
  );
}

/**
 * Conquistas: nível com o patch, selos do Passaporte do Bode (conquistados em cores; os que faltam
 * apagados com cadeado e progresso, para dar vontade), desafio do mês e como ganhar XP.
 * Nunca premia velocidade. Números de EXEMPLO até o backend (Etapa 5).
 */
export default function Conquistas() {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const [aberto, setAberto] = useState<ChaveSelo | null>(null);
  const gam = useMeuProgresso();
  const servidor = gam.servidor;
  // No servidor: XP e selos do banco (selo ganho = meta cumprida). Sem servidor: números de exemplo.
  const eu = servidor
    ? {
        ...exemploIrmao,
        xp: gam.dados?.xp ?? 0,
        progresso: Object.fromEntries(
          selos.map((s) => [s.chave, gam.dados?.selos.includes(s.chave) ? s.meta : 0]),
        ) as Record<ChaveSelo, number>,
      }
    : exemploIrmao;
  const nivel = nivelDoXp(eu.xp);
  const feitos = selos.filter((s) => conquistou(s.chave, eu.progresso)).length;
  const seloAberto = selos.find((s) => s.chave === aberto);

  return (
    <SafeAreaView edges={['top']} style={[estilos.tela, { backgroundColor: cores.fundo }]}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <Texto variante="titulo">{t('abas.conquistas')}</Texto>
        {!servidor && <Texto variante="pequeno">{t('conquistas.exemplo')}</Texto>}

        {/* Nível atual */}
        <Cartao style={estilos.nivel}>
          <Image source={nivel.atual.imagem} style={estilos.patch} contentFit="contain" accessible={false} />
          <View style={{ flex: 1, gap: espaco.xs }}>
            <Texto variante="rotulo">{t('conquistas.seuNivel')}</Texto>
            <Texto variante="subtitulo">{t(`conquistas.niveis.${nivel.atual.chave}`)}</Texto>
            <Texto variante="numero" style={{ fontSize: 34, lineHeight: 38 }}>
              {t('conquistas.xp', { xp: formatarXp(eu.xp) })}
            </Texto>
            <Barra fracao={nivel.progresso} cor={cores.acao} />
            {nivel.proximo && (
              <Texto variante="secundario">
                {t('conquistas.faltam', {
                  xp: formatarXp(nivel.falta),
                  nivel: t(`conquistas.niveis.${nivel.proximo.chave}`),
                })}
              </Texto>
            )}
          </View>
        </Cartao>

        {/* Todos os níveis: os próximos aparecem apagados */}
        <View style={estilos.niveis}>
          {niveis.map((n) => {
            const alcancado = eu.xp >= n.xpMinimo;
            return (
              <View
                key={n.chave}
                style={estilos.nivelItem}
                accessible
                accessibilityLabel={t(`conquistas.niveis.${n.chave}`)}
              >
                <Image
                  source={n.imagem}
                  style={[estilos.nivelImagem, !alcancado && { opacity: 0.3 }]}
                  contentFit="contain"
                  accessible={false}
                />
                <Texto
                  variante="pequeno"
                  style={[estilos.centro, alcancado && { color: cores.texto }]}
                  numberOfLines={2}
                >
                  {t(`conquistas.niveis.${n.chave}`)}
                </Texto>
                {alcancado ? (
                  <Icone nome="check" tamanho={20} cor={cores.verdePosto} espessura={2.6} />
                ) : (
                  <Texto variante="pequeno" style={estilos.centro}>
                    {t('conquistas.xpCurto', { xp: formatarXp(n.xpMinimo) })}
                  </Texto>
                )}
              </View>
            );
          })}
        </View>

        {/* Passaporte do Bode */}
        <View style={estilos.titulo}>
          <Texto variante="subtitulo">{t('conquistas.passaporte')}</Texto>
          <Texto variante="secundario">{t('conquistas.contagem', { feitos, total: selos.length })}</Texto>
        </View>
        <View style={estilos.grade}>
          {selos.map((s) => {
            const ok = conquistou(s.chave, eu.progresso);
            const atual = Math.min(eu.progresso[s.chave], s.meta);
            return (
              <Pressable
                key={s.chave}
                accessibilityRole="button"
                accessibilityLabel={`${t(`conquistas.selos.${s.chave}.nome`)}, ${ok ? t('conquistas.conquistado') : t('conquistas.progresso', { atual, meta: s.meta })}`}
                onPress={() => setAberto(s.chave)}
                style={({ pressed }) => [estilos.selo, pressed && { backgroundColor: cores.superficie3 }]}
              >
                <View>
                  <Image
                    source={s.imagem}
                    style={[estilos.seloImagem, !ok && { opacity: 0.28 }]}
                    contentFit="contain"
                    accessible={false}
                  />
                  {!ok && (
                    <View
                      style={[
                        estilos.cadeado,
                        { backgroundColor: cores.superficie, borderColor: cores.linhaForte },
                      ]}
                    >
                      <Icone nome="cadeado" tamanho={18} cor={cores.texto} />
                    </View>
                  )}
                </View>
                <Texto style={estilos.seloNome} numberOfLines={2}>
                  {t(`conquistas.selos.${s.chave}.nome`)}
                </Texto>
                {ok ? (
                  <Texto variante="pequeno" style={{ color: cores.verdePosto }}>
                    {t('conquistas.conquistado')}
                  </Texto>
                ) : (
                  <View style={{ alignSelf: 'stretch', gap: 4 }}>
                    <Barra fracao={atual / s.meta} cor={cores.ouro} />
                    <Texto variante="pequeno" style={estilos.centro}>
                      {t('conquistas.progresso', { atual, meta: s.meta })}
                    </Texto>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {servidor ? (
          <>
            <Botao
              titulo={t('desafios.verTodos')}
              icone="trofeu"
              variante="secundario"
              onPress={() => router.push('/desafios')}
            />
            <RankingServidor />
          </>
        ) : (
          <>
            <Cartao destaque style={{ gap: espaco.xs }}>
              <View style={estilos.linha}>
                <Icone nome="trofeu" tamanho={26} cor={cores.ouro} />
                <Texto variante="rotulo" style={{ color: cores.ouro }}>
                  {t('conquistas.desafioMes')}
                </Texto>
              </View>
              <Texto variante="destaque">{t(`conquistas.desafios.${eu.desafio.chave}`)}</Texto>
              <Barra fracao={eu.desafio.atual / eu.desafio.meta} cor={cores.ouro} />
              <Texto variante="secundario">
                {t('conquistas.desafioProgresso', { atual: eu.desafio.atual, meta: eu.desafio.meta })}
              </Texto>
              <Botao
                titulo={t('desafios.verTodos')}
                icone="trofeu"
                variante="secundario"
                onPress={() => router.push('/desafios')}
              />
            </Cartao>

            {/* Ranking do mês (posição relativa, sem velocidade) */}
            <Cartao style={estilos.linha}>
              <Texto variante="numero" style={{ fontSize: 40, lineHeight: 44, color: cores.acao }}>
                {t('conquistas.posicao', { n: eu.posicaoCapitulo })}
              </Texto>
              <View style={{ flex: 1 }}>
                <Texto variante="corpoForte">{t('conquistas.rankingTitulo')}</Texto>
                <Texto variante="secundario">{t('conquistas.rankingTexto', { km: eu.kmMes })}</Texto>
              </View>
            </Cartao>

            {/* Ranking entre capítulos (km do mês somados) */}
            <Texto variante="subtitulo">{t('conquistas.capitulosTitulo')}</Texto>
            <Cartao semPadding>
              {rankingCapitulos.map((c, i) => (
                <View
                  key={c.nome}
                  style={[
                    estilos.xpLinha,
                    i > 0 && { borderTopWidth: 1, borderTopColor: cores.linhaSuave },
                    c.meu && { backgroundColor: cores.superficie3 },
                  ]}
                >
                  <Texto
                    variante="subtitulo"
                    style={{ width: 36, color: i === 0 ? cores.ouro : cores.textoSec }}
                  >
                    {i + 1}
                  </Texto>
                  <Texto style={{ flex: 1, fontFamily: c.meu ? fontes.textoForte : fontes.textoMedio }}>
                    {c.nome}
                  </Texto>
                  <Texto variante="corpoForte">{t('rota.km', { km: c.km.toLocaleString('pt-BR') })}</Texto>
                </View>
              ))}
            </Cartao>
          </>
        )}

        {/* Como ganhar XP */}
        <Texto variante="subtitulo">{t('conquistas.comoGanhar')}</Texto>
        <Cartao semPadding>
          {comoGanharXp.map((x, i) => (
            <View
              key={x.chave}
              style={[estilos.xpLinha, i > 0 && { borderTopWidth: 1, borderTopColor: cores.linhaSuave }]}
            >
              <Texto style={{ flex: 1 }}>{t(`conquistas.ganhar.${x.chave}`)}</Texto>
              <Texto style={{ fontFamily: fontes.textoForte, color: cores.acao }}>+{x.xp}</Texto>
            </View>
          ))}
        </Cartao>
        <Texto variante="secundario">{t('conquistas.semVelocidade')}</Texto>
      </ScrollView>

      {/* Detalhe do selo */}
      <Modal
        visible={!!seloAberto}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setAberto(null)}
      >
        <Pressable
          style={estilos.fundoModal}
          onPress={() => setAberto(null)}
          accessibilityLabel={t('comum.fechar')}
        >
          {seloAberto && (
            <Pressable
              style={[estilos.folha, { backgroundColor: cores.superficie }]}
              onPress={() => undefined}
            >
              <Image
                source={seloAberto.imagem}
                style={estilos.seloGrande}
                contentFit="contain"
                accessible={false}
              />
              <Texto variante="subtitulo" style={estilos.centro}>
                {t(`conquistas.selos.${seloAberto.chave}.nome`)}
              </Texto>
              <Texto style={estilos.centro}>{t(`conquistas.selos.${seloAberto.chave}.como`)}</Texto>
              <Texto variante="corpoForte" style={[estilos.centro, { color: cores.acao }]}>
                {t('conquistas.recompensa', { xp: seloAberto.xp })}
              </Texto>
              <Texto variante="secundario" style={estilos.centro}>
                {conquistou(seloAberto.chave, eu.progresso)
                  ? t('conquistas.conquistado')
                  : t('conquistas.progresso', {
                      atual: eu.progresso[seloAberto.chave],
                      meta: seloAberto.meta,
                    })}
              </Texto>
              <Botao
                titulo={t('comum.fechar')}
                variante="secundario"
                grande
                onPress={() => setAberto(null)}
              />
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const criarEstilos = (cores: Paleta) =>
  StyleSheet.create({
    tela: { flex: 1 },
    conteudo: { padding: espaco.lg, gap: espaco.lg, paddingBottom: espaco.xxxl },
    nivel: { flexDirection: 'row', gap: espaco.md, alignItems: 'center' },
    patch: { width: 104, height: 116 },
    niveis: { flexDirection: 'row', justifyContent: 'space-between' },
    nivelItem: { flex: 1, alignItems: 'center', gap: 2 },
    nivelImagem: { width: 60, height: 66 },
    centro: { textAlign: 'center' },
    titulo: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
    selo: {
      width: '31%',
      flexGrow: 1,
      alignItems: 'center',
      gap: 6,
      padding: espaco.sm,
      borderRadius: raios.cartao,
      borderWidth: 1,
      borderColor: cores.linha,
      backgroundColor: cores.superficie2,
    },
    seloImagem: { width: 80, height: 84 },
    cadeado: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    seloNome: { fontSize: 15, fontFamily: fontes.textoSemi, textAlign: 'center', color: cores.texto },
    linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
    xpLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: espaco.sm,
      padding: espaco.md,
      minHeight: 52,
    },
    fundoModal: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
    folha: {
      borderTopLeftRadius: raios.folha,
      borderTopRightRadius: raios.folha,
      padding: espaco.xl,
      paddingBottom: espaco.xxxl,
      gap: espaco.sm,
      alignItems: 'stretch',
    },
    seloGrande: { width: 150, height: 160, alignSelf: 'center' },
  });
