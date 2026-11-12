import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { TelaFerramenta } from '@/componentes/TelaFerramenta';
import { placarEntreCapitulos, placarExemplo, tabelaXpKm, xpDoDesafio, type Desafio } from '@/dados/desafios';
import { useDesafios } from '@/estado/useDesafios';
import { espaco, fontes, raios, useCores } from '@/theme';
import { Botao, Cartao, Icone, Texto } from '@/ui';

/** Desafios do clube: ativos, os que aguardam aprovação e a tabela de XP. Nada de velocidade. */
export default function Desafios() {
  const { t } = useTranslation();
  const cores = useCores();
  const ds = useDesafios();
  const ativos = ds.todos.filter((d) => d.situacao === 'ativo');
  const aguardando = ds.criados.filter((d) => d.situacao === 'aguardando');
  const diasAte = (fim: string) => Math.max(0, Math.ceil((Date.parse(fim) - Date.now()) / 86400000));

  const Cartaozinho = ({ d }: { d: Desafio }) => {
    const dentro = d.id in ds.entrei;
    const prog = ds.progresso(d);
    return (
      <Cartao style={{ gap: espaco.xs, borderColor: d.origem === 'irmao' ? cores.linha : cores.ouro }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.xs }}>
          <Icone nome="trofeu" tamanho={22} cor={d.origem === 'irmao' ? cores.acao : cores.ouro} />
          <Texto variante="rotulo" style={{ flex: 1, color: d.origem === 'irmao' ? cores.acao : cores.ouro }}>
            {t(`desafios.origem.${d.origem}`)}
          </Texto>
          <Texto style={{ fontFamily: fontes.titulo, fontSize: 22, color: cores.ouro }}>
            +{xpDoDesafio(d)} XP
          </Texto>
        </View>
        <Texto variante="destaque">{d.titulo}</Texto>
        <Texto variante="secundario">
          {t(`desafios.meta.${d.tipo}`, { n: d.meta })} · {t('desafios.faltam', { n: diasAte(d.fim) })} ·{' '}
          {t('desafios.participantes', { n: d.participantes + (dentro ? 1 : 0) })}
        </Texto>
        {d.origem === 'capitulos' && (
          <View style={{ gap: 4, marginTop: 4 }}>
            {placarEntreCapitulos(placarExemplo).map((p, i) => (
              <Texto key={p.capitulo} variante={i === 0 ? 'corpoForte' : undefined}>
                {p.capitulo}: {t('desafios.mediaKm', { n: p.media })}
              </Texto>
            ))}
            <Texto variante="pequeno">{t('desafios.mediaExplica')}</Texto>
          </View>
        )}
        {dentro && d.tipo === 'km' && (
          <View style={{ gap: 4 }}>
            <View
              style={{ height: 10, borderRadius: 5, backgroundColor: cores.superficie3, overflow: 'hidden' }}
            >
              <View
                style={{
                  width: `${Math.min(100, (prog / d.meta) * 100)}%`,
                  height: 10,
                  backgroundColor: cores.ouro,
                }}
              />
            </View>
            <Texto variante="pequeno">{t('desafios.progresso', { atual: prog, meta: d.meta })}</Texto>
          </View>
        )}
        <Botao
          titulo={dentro ? t('desafios.participando') : t('desafios.participar')}
          icone={dentro ? 'check' : 'mais'}
          variante={dentro ? 'secundario' : 'principal'}
          onPress={() => (dentro ? ds.sair(d.id) : ds.participar(d.id))}
        />
      </Cartao>
    );
  };

  return (
    <TelaFerramenta titulo={t('desafios.titulo')} explicacao={t('desafios.explica')}>
      <Botao titulo={t('desafios.criar')} icone="mais" grande onPress={() => router.push('/desafios/novo')} />
      {ativos.map((d) => (
        <Cartaozinho key={d.id} d={d} />
      ))}
      {aguardando.length > 0 && (
        <View style={{ gap: espaco.sm }}>
          <Texto variante="rotulo">{t('desafios.aguardando')}</Texto>
          {aguardando.map((d) => (
            <Cartao key={d.id} style={{ gap: espaco.xs }}>
              <Texto variante="destaque">{d.titulo}</Texto>
              <Texto variante="secundario">{t('desafios.aguardandoExplica')}</Texto>
              <Botao
                titulo={t('desafios.aprovarTeste')}
                variante="contorno"
                onPress={() => ds.aprovarTeste(d.id)}
              />
            </Cartao>
          ))}
        </View>
      )}
      <Cartao style={{ gap: espaco.xs }}>
        <Texto variante="destaque">{t('desafios.tabelaTitulo')}</Texto>
        {tabelaXpKm.map((f, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 6,
              borderBottomWidth: i < tabelaXpKm.length - 1 ? 1 : 0,
              borderColor: cores.linha,
            }}
          >
            <Texto>
              {f.ate === Infinity
                ? t('desafios.acimaDe', { n: tabelaXpKm[i - 1]!.ate })
                : t('desafios.ate', { n: f.ate })}
            </Texto>
            <Texto style={{ fontFamily: fontes.textoForte, color: cores.ouro }}>{f.xp} XP</Texto>
          </View>
        ))}
        <Texto variante="pequeno">{t('desafios.tabelaExplica')}</Texto>
      </Cartao>
      <View style={{ padding: espaco.sm, borderRadius: raios.cartao, backgroundColor: cores.superficie2 }}>
        <Texto variante="pequeno">{t('desafios.regras')}</Texto>
      </View>
    </TelaFerramenta>
  );
}
