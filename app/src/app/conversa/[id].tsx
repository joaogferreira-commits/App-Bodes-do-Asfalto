import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRascunho } from '@/estado/rascunho';
import { useAcessoOpcional } from '@/acesso/acesso';
import { podeEscrever, respostasRapidas, type Mensagem } from '@/dados/conversas';
import { useConversas } from '@/estado/conversas';
import { espaco, fontes, raios, useCores, useEstilos, type Paleta } from '@/theme';
import { BotaoIcone, Botao, Chip, Icone, Texto } from '@/ui';
import { abrirMenu, avisar } from '@/ui/dialogo';

/** Uma conversa (1:1 ou grupo). Pilotando, a tela fica travada pela trava global (só voz). */
export default function Conversa() {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const { id } = useLocalSearchParams<{ id: string }>();
  const chat = useConversas();
  // Papel real vem do servidor; no modo local o irmão é membro comum.
  const papel = useAcessoOpcional()?.papel ?? 'membro';
  const [texto, setTexto, limpaTexto] = useRascunho(`conversa.${id}`, '');
  const lista = useRef<FlatList<Mensagem>>(null);
  const c = chat.conversas.find((x) => x.id === id);
  const { marcarLida, carregarMensagens, servidor } = chat;
  const ultimaId = chat.mensagens.filter((m) => m.conversa === id).at(-1)?.id;

  useEffect(() => {
    if (id) marcarLida(id);
    if (id) void carregarMensagens(id);
    // marca como lida e carrega as mensagens ao abrir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    // no servidor, mensagem que chega com a conversa aberta já nasce lida
    if (id && servidor && ultimaId) marcarLida(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ultimaId]);

  if (!c) return null;
  const mensagens = chat.mensagens.filter((m) => m.conversa === c.id);
  const escreve = podeEscrever(c, papel, chat.bloqueados);
  const silenciada = chat.silenciadas.includes(c.id);

  const enviar = (msg: string, rapida?: boolean) => {
    const limpo = msg.trim();
    if (!limpo) return;
    chat.enviar(c.id, limpo, rapida);
    if (!rapida) {
      setTexto('');
      limpaTexto();
    }
    setTimeout(() => lista.current?.scrollToEnd({ animated: true }), 50);
  };

  const opcoes = () =>
    abrirMenu({
      titulo: c.titulo,
      opcoes: [
        {
          rotulo: silenciada ? t('chat.ativarSom') : t('chat.silenciar'),
          icone: 'voz',
          onPress: () => chat.alternarSilencio(c.id),
        },
        ...(c.tipo === 'direto' && c.com
          ? [
              {
                rotulo: t('chat.bloquear', { nome: c.com }),
                icone: 'bloquear',
                destrutivo: true,
                onPress: () =>
                  avisar(t('chat.bloquearPergunta', { nome: c.com }), t('chat.bloquearExplica'), [
                    { text: t('comum.cancelar'), style: 'cancel' },
                    {
                      text: t('chat.bloquearCurto'),
                      style: 'destructive',
                      onPress: () => chat.bloquear(c.com!, c.comId),
                    },
                  ]),
              },
            ]
          : []),
      ],
    });

  const tocarMensagem = (m: Mensagem) => {
    if (m.minha) return;
    abrirMenu({
      titulo: m.autor,
      mensagem: m.texto,
      opcoes: [
        { rotulo: 'TFA', icone: 'aceno', onPress: () => chat.tfa(m.id) },
        {
          rotulo: t('chat.denunciar'),
          icone: 'bandeira',
          destrutivo: true,
          onPress: () => {
            chat.denunciar(m.id);
            avisar(t('chat.denunciada'));
          },
        },
        ...(c.tipo !== 'avisos'
          ? [
              {
                rotulo: t('chat.bloquear', { nome: m.autor }),
                icone: 'bloquear',
                onPress: () => chat.bloquear(m.autor, m.autorId),
              },
            ]
          : []),
      ],
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <View style={estilos.topo}>
        <BotaoIcone icone="voltar" rotulo={t('comum.voltar')} onPress={() => router.back()} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Texto variante="destaque" numberOfLines={1} accessibilityRole="header">
            {c.titulo}
          </Texto>
          <Texto variante="pequeno">
            {c.tipo === 'direto' ? t('chat.tipos.direto') : t('chat.participantes', { n: c.participantes })}
          </Texto>
        </View>
        <BotaoIcone icone="opcoes" rotulo={t('chat.opcoes')} onPress={opcoes} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={lista}
          data={mensagens}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: espaco.md, gap: espaco.sm }}
          onContentSizeChange={() => lista.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={
            chat.temMais(c.id) ? (
              <Botao
                titulo={t('chat.anteriores')}
                variante="contorno"
                onPress={() => void chat.carregarAnteriores(c.id)}
              />
            ) : c.aguardandoAceno ? (
              <View style={estilos.aviso}>
                <Icone nome="aceno" tamanho={28} cor={cores.acao} />
                <Texto style={{ flex: 1 }}>{t('chat.acenoEnviado', { nome: c.com })}</Texto>
              </View>
            ) : c.tipo === 'avisos' ? (
              <View style={estilos.aviso}>
                <Icone nome="alerta" tamanho={24} cor={cores.ouro} />
                <Texto style={{ flex: 1 }}>{t('chat.avisosExplica')}</Texto>
              </View>
            ) : undefined
          }
          renderItem={({ item: m }) => (
            <Pressable
              onLongPress={() => tocarMensagem(m)}
              onPress={() => tocarMensagem(m)}
              accessibilityRole="text"
              accessibilityLabel={`${m.minha ? t('chat.voce') : m.autor}: ${m.texto}`}
              style={[estilos.bolha, m.minha ? estilos.minha : estilos.dele]}
            >
              {!m.minha && c.tipo !== 'direto' && (
                <Texto style={{ color: cores.acao, fontFamily: fontes.textoForte, fontSize: 15 }}>
                  {m.autor}
                </Texto>
              )}
              <Texto style={m.minha ? { color: cores.textoSobreAcao } : undefined}>{m.texto}</Texto>
              <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'flex-end', alignItems: 'center' }}>
                {(m.tfa ?? 0) + (chat.meusTfa.includes(m.id) ? 1 : 0) > 0 && (
                  <Texto variante="pequeno" style={{ color: m.minha ? cores.textoSobreAcao : cores.ouro }}>
                    TFA {(m.tfa ?? 0) + (chat.meusTfa.includes(m.id) ? 1 : 0)}
                  </Texto>
                )}
                <Texto variante="pequeno" style={m.minha ? { color: cores.textoSobreAcao } : undefined}>
                  {new Date(m.quando).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </Texto>
              </View>
            </Pressable>
          )}
        />

        {escreve ? (
          <View style={estilos.rodape}>
            {chat.falhaEnvio && (
              <Texto variante="pequeno" style={{ color: cores.alerta }}>
                {t('chat.falhaEnvio')}
              </Texto>
            )}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: espaco.xs }}
            >
              {respostasRapidas.map((r) => (
                <Chip
                  key={r}
                  rotulo={t(`chat.rapidas.${r}`)}
                  onPress={() => enviar(t(`chat.rapidas.${r}`), true)}
                />
              ))}
            </ScrollView>
            <View style={estilos.linhaEnvio}>
              <TextInput
                value={texto}
                onChangeText={setTexto}
                placeholder={t('chat.escreva')}
                placeholderTextColor={cores.textoSec}
                accessibilityLabel={t('chat.escreva')}
                multiline
                maxLength={1000}
                style={estilos.campo}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('chat.enviar')}
                disabled={!texto.trim()}
                onPress={() => enviar(texto)}
                style={[estilos.enviar, { opacity: texto.trim() ? 1 : 0.4 }]}
              >
                <Icone nome="navegar" tamanho={24} cor={cores.textoSobreAcao} />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={estilos.rodape}>
            <Texto variante="secundario" style={{ textAlign: 'center' }}>
              {c.aguardandoAceno
                ? t('chat.aguardandoAceno')
                : c.tipo === 'avisos'
                  ? t('chat.soDiretoria')
                  : t('chat.bloqueado')}
            </Texto>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const criarEstilos = (c: Paleta) =>
  StyleSheet.create({
    topo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: espaco.sm,
      paddingHorizontal: espaco.sm,
      paddingVertical: espaco.xs,
      borderBottomWidth: 1,
      borderColor: c.linha,
    },
    aviso: {
      flexDirection: 'row',
      gap: espaco.sm,
      alignItems: 'center',
      padding: espaco.md,
      borderRadius: raios.cartao,
      backgroundColor: c.superficie2,
      marginBottom: espaco.sm,
    },
    bolha: {
      maxWidth: '85%',
      padding: espaco.sm,
      paddingHorizontal: espaco.md,
      borderRadius: raios.cartao,
      gap: 4,
    },
    minha: { alignSelf: 'flex-end', backgroundColor: c.acao, borderBottomRightRadius: 4 },
    dele: { alignSelf: 'flex-start', backgroundColor: c.superficie2, borderBottomLeftRadius: 4 },
    rodape: {
      padding: espaco.sm,
      gap: espaco.sm,
      borderTopWidth: 1,
      borderColor: c.linha,
      backgroundColor: c.superficie,
    },
    linhaEnvio: { flexDirection: 'row', alignItems: 'flex-end', gap: espaco.sm },
    campo: {
      flex: 1,
      minHeight: 52,
      maxHeight: 140,
      borderRadius: raios.botao,
      borderWidth: 1,
      borderColor: c.linha,
      paddingHorizontal: espaco.md,
      paddingVertical: 12,
      color: c.texto,
      fontFamily: fontes.texto,
      fontSize: 17,
    },
    enviar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: c.acao,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
