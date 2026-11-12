import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarMontado } from '@/componentes/AvatarMontado';
import { exemploIrmao, nivelDoXp } from '@/dados/conquistas';
import { perfilExemplo as eu, type Visibilidade } from '@/dados/perfil';
import { useAvatar } from '@/estado/avatar';
import { espaco, fontes, raios, useCores, useEstilos, type Paleta } from '@/theme';
import { Avatar, Botao, Cartao, Icone, pinos, SeletorTema, Texto, type NomeIcone } from '@/ui';

const iconeVisibilidade: Record<Visibilidade, NomeIcone> = {
  ninguem: 'cadeado',
  amigos: 'reagrupar',
  membros: 'visivel',
};

function Secao({ titulo, children, acao }: { titulo: string; children: ReactNode; acao?: ReactNode }) {
  return (
    <View style={{ gap: espaco.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Texto variante="rotulo">{titulo}</Texto>
        {acao}
      </View>
      {children}
    </View>
  );
}

function LinhaMenu({
  icone,
  titulo,
  detalhe,
  onPress,
}: {
  icone: NomeIcone;
  titulo: string;
  detalhe?: string;
  onPress: () => void;
}) {
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      onPress={onPress}
      style={({ pressed }) => [estilos.menu, pressed && { backgroundColor: cores.superficie3 }]}
    >
      <Icone nome={icone} tamanho={24} cor={cores.acao} />
      <View style={{ flex: 1 }}>
        <Texto variante="corpoForte">{titulo}</Texto>
        {detalhe && <Texto variante="secundario">{detalhe}</Texto>}
      </View>
      <View style={{ transform: [{ rotate: '180deg' }] }}>
        <Icone nome="voltar" tamanho={20} cor={cores.textoSec} />
      </View>
    </Pressable>
  );
}

/** Perfil do irmão: avatar, nível, números, moto, capítulo, dados maçônicos opcionais, privacidade e ajustes. */
export default function Perfil() {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const { avatar } = useAvatar();
  const nivel = nivelDoXp(exemploIrmao.xp);
  const emBreve = () => Alert.alert(t('comum.emBreve'), t('perfil.emBreveCadastro'));

  return (
    <SafeAreaView edges={['top']} style={[estilos.tela, { backgroundColor: cores.fundo }]}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        {/* Cabeçalho */}
        <View style={estilos.cabecalho}>
          <View>
            {avatar ? (
              <AvatarMontado opcoes={avatar} tamanho={104} />
            ) : (
              <Avatar nome={eu.nome} status="aberto" tamanho={104} />
            )}
            <Image
              source={nivel.atual.imagem}
              style={estilos.patchNivel}
              contentFit="contain"
              accessible={false}
            />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Texto variante="subtitulo" numberOfLines={2}>
              {eu.nome}
            </Texto>
            <Texto variante="secundario">“{eu.apelido}”</Texto>
            <Texto variante="corpoForte" style={{ color: cores.acao }}>
              {t('perfil.capituloCargo', { capitulo: eu.capitulo, cargo: t(`perfil.cargos.${eu.cargo}`) })}
            </Texto>
            <Texto variante="pequeno">{t('perfil.desde', { ano: eu.desde })}</Texto>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: espaco.xs }}>
          <View style={{ flex: 1 }}>
            <Botao
              titulo={avatar ? t('perfil.editarAvatar') : t('perfil.criarAvatar')}
              icone="perfil"
              onPress={() => router.push('/avatar')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Botao
              titulo={t('perfil.editar')}
              variante="secundario"
              icone="configuracoes"
              onPress={emBreve}
            />
          </View>
        </View>

        {/* Nível e números */}
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/conquistas')}>
          <Cartao style={{ gap: espaco.sm }}>
            <View style={estilos.linha}>
              <Texto variante="destaque" style={{ flex: 1 }}>
                {t(`conquistas.niveis.${nivel.atual.chave}`)} ·{' '}
                {t('conquistas.xp', { xp: exemploIrmao.xp.toLocaleString('pt-BR') })}
              </Texto>
              <Icone nome="trofeu" tamanho={24} cor={cores.ouro} />
            </View>
            <View style={estilos.numeros}>
              {(['kmAno', 'viagens', 'passeios', 'selos'] as const).map((k) => (
                <View key={k} style={estilos.numero}>
                  <Texto variante="subtitulo" style={{ fontVariant: ['tabular-nums'] }}>
                    {eu.numeros[k].toLocaleString('pt-BR')}
                  </Texto>
                  <Texto variante="pequeno" style={{ textAlign: 'center' }}>
                    {t(`perfil.numeros.${k}`)}
                  </Texto>
                </View>
              ))}
            </View>
          </Cartao>
        </Pressable>

        {/* Moto */}
        <Secao
          titulo={t('perfil.minhaMoto')}
          acao={
            <Texto variante="pequeno" style={{ color: cores.acao }} onPress={emBreve}>
              {t('perfil.trocar')}
            </Texto>
          }
        >
          <Cartao semPadding style={{ overflow: 'hidden' }}>
            <Image
              source={eu.moto.imagem}
              style={estilos.moto}
              contentFit="cover"
              accessibilityLabel={eu.moto.modelo}
            />
            <View style={{ padding: espaco.md, gap: 2 }}>
              <Texto variante="destaque">{eu.moto.modelo}</Texto>
              <Texto variante="secundario">
                {t('perfil.motoDetalhe', {
                  ano: eu.moto.ano,
                  apelido: eu.moto.apelido,
                  km: eu.moto.kmNoApp.toLocaleString('pt-BR'),
                })}
              </Texto>
            </View>
          </Cartao>
        </Secao>

        {/* Capítulo */}
        <Secao titulo={t('perfil.meuCapitulo')}>
          <Cartao style={estilos.linha}>
            <Image
              source={pinos.sede.imagem}
              style={{ width: 52, height: 64 }}
              contentFit="contain"
              accessible={false}
            />
            <View style={{ flex: 1 }}>
              <Texto variante="destaque">{t('perfil.capituloNome', { capitulo: eu.capitulo })}</Texto>
              <Texto variante="secundario">
                {t('perfil.capituloInfo', {
                  irmaos: eu.capituloInfo.irmaos,
                  diretor: eu.capituloInfo.diretor,
                  ano: eu.capituloInfo.fundado,
                })}
              </Texto>
            </View>
          </Cartao>
        </Secao>

        {/* Dados maçônicos opcionais */}
        <Secao titulo={t('perfil.maconaria')}>
          <Cartao semPadding>
            {eu.macom.map((m, i) => (
              <Pressable
                key={m.chave}
                accessibilityRole="button"
                accessibilityLabel={`${t(`perfil.macom.${m.chave}`)}: ${m.valor || t('perfil.naoInformado')}, ${t(`perfil.visibilidade.${m.visibilidade}`)}`}
                onPress={emBreve}
                style={[estilos.macom, i > 0 && { borderTopWidth: 1, borderTopColor: cores.linhaSuave }]}
              >
                <View style={{ flex: 1 }}>
                  <Texto variante="pequeno">{t(`perfil.macom.${m.chave}`)}</Texto>
                  <Texto variante="corpoForte" style={!m.valor && { color: cores.textoApagado }}>
                    {m.valor || t('perfil.naoInformado')}
                  </Texto>
                </View>
                <View style={[estilos.selo, { borderColor: cores.linhaForte }]}>
                  <Icone nome={iconeVisibilidade[m.visibilidade]} tamanho={16} cor={cores.textoSec} />
                  <Texto variante="pequeno">{t(`perfil.visibilidade.${m.visibilidade}`)}</Texto>
                </View>
              </Pressable>
            ))}
          </Cartao>
          <Texto variante="pequeno">{t('perfil.maconariaAviso')}</Texto>
        </Secao>

        {/* Privacidade e segurança */}
        <Secao titulo={t('perfil.privacidade')}>
          <Cartao semPadding>
            <LinhaMenu
              icone="visivel"
              titulo={t('perfil.noMapa')}
              detalhe={t(`perfil.mapaModos.${eu.visibilidadeMapa}`)}
              onPress={emBreve}
            />
            <LinhaMenu
              icone="socorro"
              titulo={t('perfil.contatos')}
              detalhe={t('perfil.contatosN', { n: eu.contatos })}
              onPress={emBreve}
            />
            <LinhaMenu
              icone="alerta"
              titulo={t('perfil.notificacoes')}
              detalhe={t('perfil.notificacoesDetalhe')}
              onPress={emBreve}
            />
          </Cartao>
        </Secao>

        <Secao titulo={t('tema.titulo')}>
          <SeletorTema />
        </Secao>

        <Cartao semPadding>
          <LinhaMenu
            icone="comentario"
            titulo={t('perfil.ajuda')}
            detalhe={t('perfil.ajudaDetalhe')}
            onPress={emBreve}
          />
          <LinhaMenu icone="cadeado" titulo={t('perfil.termos')} onPress={emBreve} />
        </Cartao>
        <Botao titulo={t('perfil.sair')} variante="contorno" onPress={emBreve} />

        {/* Toque longo na versão abre o catálogo de componentes (só para o desenvolvimento) */}
        <Texto
          variante="pequeno"
          style={{ textAlign: 'center' }}
          onLongPress={() => router.push('/catalogo')}
        >
          {t('perfil.versao')}
        </Texto>
      </ScrollView>
    </SafeAreaView>
  );
}

const criarEstilos = (cores: Paleta) =>
  StyleSheet.create({
    tela: { flex: 1 },
    conteudo: { padding: espaco.lg, gap: espaco.lg, paddingBottom: espaco.xxxl },
    cabecalho: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
    patchNivel: { position: 'absolute', right: -10, bottom: -10, width: 44, height: 50 },
    linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
    numeros: { flexDirection: 'row' },
    numero: { flex: 1, alignItems: 'center' },
    moto: { width: '100%', aspectRatio: 2, backgroundColor: cores.superficie3 },
    macom: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm, padding: espaco.md, minHeight: 64 },
    selo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: raios.pilula,
      borderWidth: 1,
    },
    menu: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm, padding: espaco.md, minHeight: 64 },
    texto: { fontFamily: fontes.textoSemi },
  });
