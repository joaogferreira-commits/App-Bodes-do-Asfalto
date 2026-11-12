import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { registrarEvento } from '@/comercial/contadores';
import { negociosExemplo, planoVigente } from '@/dados/negocios';
import { useGuardado } from '@/estado/guardado';
import { useViagem } from '@/estado/viagem';
import { linkWhatsApp } from '@/ferramentas/calculos';
import { espaco, fontes, raios, useCores } from '@/theme';
import { Botao, BotaoIcone, Cartao, Icone, Texto, type NomeIcone } from '@/ui';

const iconeComodidade: Record<string, NomeIcone> = {
  cobertura: 'sede',
  garagem: 'cadeado',
  cafeCedo: 'agape',
  ferramentas: 'oficina',
  guincho: 'alerta',
};

/** Vitrine do negócio: fotos, benefício para irmãos em destaque, comodidades, Rota/WhatsApp/Ligar e "Recomendo". */
export default function Vitrine() {
  const { t } = useTranslation();
  const cores = useCores();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const viagem = useViagem();
  const [recomendei, setRecomendei] = useGuardado<string[]>('negociosRecomendados', []);
  const [jaContou] = useState(() => (id ? registrarEvento(id, 'vitrine') : null));
  void jaContou;
  const n = negociosExemplo.find((x) => x.id === id);
  if (!n) return null;
  const parceiro = planoVigente(n) !== 'gratis';
  const meu = recomendei.includes(n.id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <ScrollView contentContainerStyle={{ paddingBottom: espaco.xxxl }}>
        <View>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {n.fotos.map((foto, i) => (
              <Image
                key={i}
                source={foto}
                style={{ width, aspectRatio: 1.6 }}
                contentFit="cover"
                accessible={false}
              />
            ))}
          </ScrollView>
          <View style={{ position: 'absolute', top: espaco.sm, left: espaco.sm }}>
            <BotaoIcone icone="voltar" rotulo={t('comum.voltar')} onPress={() => router.back()} />
          </View>
        </View>
        <View style={{ padding: espaco.lg, gap: espaco.md }}>
          {parceiro && (
            <Texto variante="rotulo" style={{ color: cores.ouro }}>
              {t('negocios.parceiro')}
            </Texto>
          )}
          <Texto variante="titulo">{n.nome}</Texto>
          <Texto variante="secundario">
            {t(`negocios.categorias.${n.categoria}`)} · {n.cidade} · {t('negocios.deIrmao', { nome: n.dono })}
          </Texto>

          <Cartao style={{ borderColor: cores.verdePosto, borderWidth: 2, gap: 4 }}>
            <Texto variante="rotulo" style={{ color: cores.verdePosto }}>
              {t('negocios.beneficio')}
            </Texto>
            <Texto variante="subtitulo">{n.beneficio}</Texto>
            <Botao
              titulo={t('negocios.mostrarNoBalcao')}
              variante="secundario"
              icone="perfil"
              onPress={() => {
                registrarEvento(n.id, 'beneficio');
                router.push('/sou-membro');
              }}
            />
          </Cartao>

          <Texto>{n.descricao}</Texto>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.xs }}>
            <Icone nome="calendario" tamanho={20} cor={cores.textoSec} />
            <Texto variante="secundario">{n.horario}</Texto>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm }}>
            {n.comodidades.map((c) => (
              <View
                key={c}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: raios.pilula,
                  borderWidth: 1,
                  borderColor: cores.linha,
                }}
              >
                <Icone nome={iconeComodidade[c] ?? 'check'} tamanho={18} cor={cores.acao} />
                <Texto style={{ fontFamily: fontes.textoSemi, fontSize: 15 }}>
                  {t(`negocios.comodidades.${c}`)}
                </Texto>
              </View>
            ))}
          </View>

          {n.posicao && (
            <Botao
              titulo={t('ferramentas.rotaAte', { lugar: n.nome })}
              icone="navegar"
              grande
              onPress={() => {
                registrarEvento(n.id, 'rota');
                viagem.definirBateVolta(null);
                viagem.definirDestino({ chave: 'busca', nome: n.nome, posicao: n.posicao! });
                router.push('/rota');
              }}
            />
          )}
          <View style={{ flexDirection: 'row', gap: espaco.xs }}>
            {n.whatsapp && (
              <View style={{ flex: 1 }}>
                <Botao
                  titulo={t('ferramentas.whatsapp')}
                  icone="comentario"
                  variante="secundario"
                  onPress={() => {
                    registrarEvento(n.id, 'whatsapp');
                    void Linking.openURL(linkWhatsApp(t('negocios.mensagem', { nome: n.nome }), n.whatsapp));
                  }}
                />
              </View>
            )}
            {n.telefone && (
              <View style={{ flex: 1 }}>
                <Botao
                  titulo={t('ferramentas.ligarCurto')}
                  icone="socorro"
                  variante="secundario"
                  onPress={() => {
                    registrarEvento(n.id, 'ligar');
                    void Linking.openURL(`tel:${n.telefone}`);
                  }}
                />
              </View>
            )}
          </View>

          <Cartao style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}>
            <Icone nome="aceno" tamanho={26} cor={cores.ouro} />
            <Texto style={{ flex: 1 }}>
              {t('negocios.recomendacoes', { n: n.recomendacoes + (meu ? 1 : 0) })}
            </Texto>
            <Botao
              titulo={meu ? t('negocios.recomendei') : t('negocios.recomendo')}
              variante={meu ? 'principal' : 'contorno'}
              onPress={() => {
                if (!meu) registrarEvento(n.id, 'recomendo');
                setRecomendei((l) => (meu ? l.filter((x) => x !== n.id) : [...l, n.id]));
              }}
            />
          </Cartao>
          <Texto variante="pequeno">{t('negocios.privacidade')}</Texto>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
