import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { PeriodoRanking } from '@/servidor/desafios';
import { useMeuProgresso, useRanking } from '@/servidor/useGamificacao';
import { espaco, fontes, useCores } from '@/theme';
import { Cartao, Chip, Texto } from '@/ui';

/**
 * Ranking por XP (nunca velocidade nem tempo): top 50 do clube ou do meu capítulo, no mês ou desde sempre.
 * Quem escolheu sair do ranking não aparece (e vê o aviso de que está fora).
 */
export function RankingServidor() {
  const { t } = useTranslation();
  const cores = useCores();
  const { dados } = useMeuProgresso();
  const [escopo, setEscopo] = useState<'geral' | 'capitulo'>('geral');
  const [periodo, setPeriodo] = useState<PeriodoRanking>('mes');
  const { linhas, carregando } = useRanking(
    escopo === 'capitulo' ? (dados?.capituloId ?? null) : null,
    periodo,
    dados?.id ?? null,
  );

  return (
    <View style={{ gap: espaco.sm }}>
      <Texto variante="subtitulo">{t('conquistas.rankingXp')}</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
        <Chip
          rotulo={t('conquistas.rankingGeral')}
          ativo={escopo === 'geral'}
          onPress={() => setEscopo('geral')}
        />
        {!!dados?.capituloId && (
          <Chip
            rotulo={t('conquistas.rankingCapitulo')}
            ativo={escopo === 'capitulo'}
            onPress={() => setEscopo('capitulo')}
          />
        )}
        <Chip
          rotulo={t('conquistas.rankingMes')}
          ativo={periodo === 'mes'}
          onPress={() => setPeriodo('mes')}
        />
        <Chip
          rotulo={t('conquistas.rankingSempre')}
          ativo={periodo === 'sempre'}
          onPress={() => setPeriodo('sempre')}
        />
      </View>
      {dados?.foraDoRanking && <Texto variante="secundario">{t('conquistas.foraDoRanking')}</Texto>}
      <Cartao semPadding>
        {!carregando && linhas.length === 0 && (
          <View style={{ padding: espaco.md }}>
            <Texto>{t('conquistas.rankingVazio')}</Texto>
          </View>
        )}
        {linhas.map((l, i) => (
          <View
            key={l.usuarioId}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: espaco.sm,
                padding: espaco.md,
                minHeight: 52,
              },
              i > 0 && { borderTopWidth: 1, borderTopColor: cores.linhaSuave },
              l.eu && { backgroundColor: cores.superficie3 },
            ]}
          >
            <Texto
              variante="subtitulo"
              style={{ width: 40, color: l.posicao === 1 ? cores.ouro : cores.textoSec }}
            >
              {l.posicao}
            </Texto>
            <Texto
              style={{ flex: 1, fontFamily: l.eu ? fontes.textoForte : fontes.textoMedio }}
              numberOfLines={1}
            >
              {l.apelido?.trim() || l.nome}
            </Texto>
            <Texto variante="corpoForte">{t('conquistas.xp', { xp: l.xp.toLocaleString('pt-BR') })}</Texto>
          </View>
        ))}
      </Cartao>
      <Texto variante="pequeno">{t('conquistas.semVelocidade')}</Texto>
    </View>
  );
}
