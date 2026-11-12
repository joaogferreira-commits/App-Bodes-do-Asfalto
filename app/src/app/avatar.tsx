import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarMontado } from '@/componentes/AvatarMontado';
import { avatarPadrao, opcoesAvatar, useAvatar, type OpcoesAvatar } from '@/estado/avatar';
import { espaco, raios, useCores, useEstilos, type Paleta } from '@/theme';
import { Botao, BotaoIcone, Chip, Texto } from '@/ui';

const corDe = (parte: 'fundo' | 'pele' | 'capacete') => opcoesAvatar[parte];

function Cores({
  parte,
  valor,
  aoEscolher,
}: {
  parte: 'fundo' | 'pele' | 'capacete';
  valor: number;
  aoEscolher: (i: number) => void;
}) {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  return (
    <View style={estilos.linha} accessibilityRole="radiogroup" accessibilityLabel={t(`avatar.${parte}`)}>
      {corDe(parte).map((cor, i) => (
        <Pressable
          key={cor}
          accessibilityRole="radio"
          accessibilityState={{ checked: valor === i }}
          accessibilityLabel={t('avatar.opcao', { n: i + 1 })}
          onPress={() => aoEscolher(i)}
          style={[
            estilos.cor,
            {
              backgroundColor: cor,
              borderColor: valor === i ? cores.acao : cores.linha,
              borderWidth: valor === i ? 4 : 1,
            },
          ]}
        />
      ))}
    </View>
  );
}

/** Montar o avatar: escolhas grandes, prévia ao vivo. Avatar por IA chega depois (1 grátis por conta). */
export default function CriarAvatar() {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const { avatar, salvar } = useAvatar();
  const [a, setA] = useState<OpcoesAvatar>(avatar ?? avatarPadrao);
  const mudar = (parte: keyof OpcoesAvatar, i: number) => setA((v) => ({ ...v, [parte]: i }));

  return (
    <SafeAreaView style={[estilos.tela, { backgroundColor: cores.fundo }]}>
      <View style={estilos.topo}>
        <BotaoIcone icone="voltar" rotulo={t('comum.voltar')} onPress={() => router.back()} />
        <Texto variante="subtitulo">{t('avatar.titulo')}</Texto>
      </View>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <View style={{ alignItems: 'center' }}>
          <AvatarMontado opcoes={a} tamanho={180} />
        </View>
        <Texto variante="rotulo">{t('avatar.fundo')}</Texto>
        <Cores parte="fundo" valor={a.fundo} aoEscolher={(i) => mudar('fundo', i)} />
        <Texto variante="rotulo">{t('avatar.pele')}</Texto>
        <Cores parte="pele" valor={a.pele} aoEscolher={(i) => mudar('pele', i)} />
        <Texto variante="rotulo">{t('avatar.capacete')}</Texto>
        <Cores parte="capacete" valor={a.capacete} aoEscolher={(i) => mudar('capacete', i)} />
        <Texto variante="rotulo">{t('avatar.barba')}</Texto>
        <View style={estilos.linha}>
          {opcoesAvatar.barba.map((b, i) => (
            <Chip
              key={b}
              rotulo={t(`avatar.barbas.${b}`)}
              ativo={a.barba === i}
              onPress={() => mudar('barba', i)}
            />
          ))}
        </View>
        <Texto variante="rotulo">{t('avatar.oculos')}</Texto>
        <View style={estilos.linha}>
          {opcoesAvatar.oculos.map((o, i) => (
            <Chip
              key={o}
              rotulo={t(`avatar.oculosTipos.${o}`)}
              ativo={a.oculos === i}
              onPress={() => mudar('oculos', i)}
            />
          ))}
        </View>
        <Texto variante="secundario">{t('avatar.ia')}</Texto>
        <Botao
          titulo={t('avatar.salvar')}
          grande
          icone="check"
          onPress={() => {
            salvar(a);
            router.back();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const criarEstilos = (_c: Paleta) =>
  StyleSheet.create({
    tela: { flex: 1 },
    topo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm, padding: espaco.md },
    conteudo: { padding: espaco.lg, gap: espaco.sm, paddingBottom: espaco.xxxl },
    linha: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
    cor: { width: 48, height: 48, borderRadius: raios.pilula },
  });
