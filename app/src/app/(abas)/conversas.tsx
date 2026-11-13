import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ordenarConversas, type Conversa, type TipoConversa } from '@/dados/conversas';
import { diretorios } from '@/dados/diretorios';
import { avisarResultadoAceno } from '@/estado/avisoAceno';
import { useConversas } from '@/estado/conversas';
import { listarMembros, type MembroChat } from '@/servidor/chat';
import { espaco, fontes, raios, useCores, useEstilos, type Paleta } from '@/theme';
import { Avatar, Botao, BotaoIcone, Chip, Icone, Texto, type NomeIcone } from '@/ui';

const iconeDoTipo: Record<TipoConversa, NomeIcone> = {
  avisos: 'alerta',
  capitulo: 'sede',
  passeio: 'passeios',
  comboio: 'reagrupar',
  agape: 'agape',
  direto: 'perfil',
};

type Filtro = 'todas' | 'grupos' | 'diretas';

/** Conversas: uma lista só, pela última mensagem; Avisos da diretoria fixados no topo. */
export default function Conversas() {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const chat = useConversas();
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [nova, setNova] = useState(false);
  const [busca, setBusca] = useState('');
  const [membros, setMembros] = useState<MembroChat[]>([]);
  const { servidor, recarregar } = chat;

  // Ao abrir a aba: garante o grupo do capítulo e traz conversas, não lidas e acenos do servidor.
  useEffect(() => {
    if (servidor) void recarregar();
  }, [servidor, recarregar]);

  useEffect(() => {
    if (!servidor || !nova) return;
    let vivo = true;
    void listarMembros(busca)
      .then((m) => vivo && setMembros(m))
      .catch(() => vivo && setMembros([]));
    return () => {
      vivo = false;
    };
  }, [servidor, nova, busca]);

  const acenarPara = async (id: string, nome: string) => {
    setNova(false);
    avisarResultadoAceno(await chat.acenar(id), nome, t);
  };
  const aceitar = async (id: string) => {
    const conversa = await chat.aceitarAceno(id);
    if (conversa) router.push(`/conversa/${conversa}`);
  };

  const lista = ordenarConversas(chat.conversas, chat.mensagens).filter((c) =>
    filtro === 'todas' ? true : filtro === 'diretas' ? c.tipo === 'direto' : c.tipo !== 'direto',
  );
  const ultima = (c: Conversa) => chat.mensagens.filter((m) => m.conversa === c.id).at(-1);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: cores.fundo }}>
      <View style={estilos.topo}>
        <Texto variante="titulo" accessibilityRole="header">
          {t('chat.titulo')}
        </Texto>
        <BotaoIcone icone="mais" rotulo={t('chat.nova')} onPress={() => setNova(true)} />
      </View>
      <View style={estilos.filtros}>
        {(['todas', 'grupos', 'diretas'] as const).map((f) => (
          <Chip key={f} rotulo={t(`chat.filtros.${f}`)} ativo={filtro === f} onPress={() => setFiltro(f)} />
        ))}
      </View>
      {!servidor && (
        <Texto variante="pequeno" style={{ paddingHorizontal: espaco.md, paddingBottom: espaco.xs }}>
          {t('chat.modoLocal')}
        </Texto>
      )}
      {servidor && chat.falhaCarga && (
        <Texto variante="pequeno" style={{ paddingHorizontal: espaco.md, color: cores.alerta }}>
          {t('chat.falhaCarga')}
        </Texto>
      )}
      <FlatList
        data={lista}
        ListHeaderComponent={
          servidor && chat.acenosRecebidos.length > 0 ? (
            <View style={estilos.acenos}>
              <Texto variante="subtitulo" accessibilityRole="header">
                {t('chat.acenosRecebidos')}
              </Texto>
              {chat.acenosRecebidos.map((a) => (
                <View key={a.id} style={estilos.linhaAceno}>
                  <Avatar nome={a.nome} tamanho={44} />
                  <Texto variante="destaque" style={{ flex: 1 }} numberOfLines={2}>
                    {t('chat.acenouParaVoce', { nome: a.nome })}
                  </Texto>
                  <View style={{ gap: espaco.xs }}>
                    <Botao titulo={t('chat.aceitar')} onPress={() => void aceitar(a.id)} />
                    <Botao
                      titulo={t('chat.recusar')}
                      variante="contorno"
                      onPress={() => void chat.recusarAceno(a.id)}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          servidor ? (
            <Texto variante="secundario" style={{ padding: espaco.md }}>
              {t('chat.vazio')}
            </Texto>
          ) : undefined
        }
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingBottom: 140 }}
        renderItem={({ item: c }) => {
          const u = ultima(c);
          const n = chat.naoLidas(c.id);
          const silenciada = chat.silenciadas.includes(c.id);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${c.titulo}. ${t(`chat.tipos.${c.tipo}`)}${n ? `. ${t('chat.naoLidasN', { n })}` : ''}`}
              onPress={() => router.push(`/conversa/${c.id}`)}
              style={({ pressed }) => [estilos.linha, pressed && { backgroundColor: cores.superficie2 }]}
            >
              {c.tipo === 'direto' ? (
                <Avatar nome={c.com ?? c.titulo} tamanho={52} />
              ) : (
                <View style={[estilos.iconeGrupo, c.tipo === 'avisos' && { borderColor: cores.ouro }]}>
                  <Icone
                    nome={iconeDoTipo[c.tipo]}
                    tamanho={26}
                    cor={c.tipo === 'avisos' ? cores.ouro : cores.acao}
                  />
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Texto variante="destaque" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {c.titulo}
                  </Texto>
                  {silenciada && <Icone nome="voz" tamanho={16} cor={cores.textoSec} />}
                </View>
                <Texto variante="secundario" numberOfLines={1}>
                  {c.aguardandoAceno
                    ? t('chat.aguardandoAceno')
                    : u
                      ? `${u.minha ? t('chat.voce') : u.autor}: ${u.texto}`
                      : t(`chat.tipos.${c.tipo}`)}
                </Texto>
                {c.terminaEm && (
                  <Texto variante="pequeno" style={{ color: cores.alerta }}>
                    {t('chat.temporario', { quando: c.terminaEm })}
                  </Texto>
                )}
              </View>
              {n > 0 && (
                <View
                  style={[estilos.contador, { backgroundColor: silenciada ? cores.superficie3 : cores.acao }]}
                >
                  <Texto
                    style={{
                      color: silenciada ? cores.texto : cores.textoSobreAcao,
                      fontFamily: fontes.textoForte,
                      fontSize: 15,
                    }}
                  >
                    {n}
                  </Texto>
                </View>
              )}
            </Pressable>
          );
        }}
      />

      <Modal
        visible={nova}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setNova(false)}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(10,8,6,0.72)' }} onPress={() => setNova(false)} />
        <View style={estilos.folha}>
          <Texto variante="subtitulo">{t('chat.novaTitulo')}</Texto>
          <Texto variante="secundario">{t('chat.novaExplica')}</Texto>
          {servidor && (
            <TextInput
              value={busca}
              onChangeText={setBusca}
              placeholder={t('chat.buscarIrmao')}
              placeholderTextColor={cores.textoSec}
              accessibilityLabel={t('chat.buscarIrmao')}
              style={estilos.busca}
            />
          )}
          {(servidor
            ? membros.map((m) => ({
                id: m.id,
                titulo: m.apelido || m.nome,
                subtitulo: m.capitulo ?? '',
              }))
            : diretorios.membros
          ).map((m) => (
            <Pressable
              key={m.id}
              accessibilityRole="button"
              accessibilityLabel={t('chat.acenarPara', { nome: m.titulo })}
              onPress={() => {
                if (servidor) return void acenarPara(m.id, m.titulo);
                setNova(false);
                router.push(`/conversa/${chat.iniciarDireto(m.titulo)}`);
              }}
              style={estilos.linhaMembro}
            >
              <Avatar nome={m.titulo} tamanho={44} />
              <View style={{ flex: 1 }}>
                <Texto variante="destaque">{m.titulo}</Texto>
                <Texto variante="secundario">{m.subtitulo}</Texto>
              </View>
              <Icone nome="aceno" tamanho={24} cor={cores.acao} />
            </Pressable>
          ))}
          <Botao titulo={t('comum.fechar')} variante="contorno" onPress={() => setNova(false)} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const criarEstilos = (c: Paleta) =>
  StyleSheet.create({
    topo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: espaco.md,
      paddingTop: espaco.sm,
    },
    filtros: { flexDirection: 'row', gap: espaco.xs, padding: espaco.md, paddingBottom: espaco.xs },
    linha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: espaco.md,
      paddingHorizontal: espaco.md,
      paddingVertical: espaco.sm,
      minHeight: 76,
      borderBottomWidth: 1,
      borderColor: c.linha,
    },
    iconeGrupo: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 2,
      borderColor: c.linhaForte,
      backgroundColor: c.superficie2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    contador: {
      minWidth: 28,
      height: 28,
      borderRadius: 14,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    folha: {
      backgroundColor: c.superficie,
      borderTopLeftRadius: raios.folha,
      borderTopRightRadius: raios.folha,
      padding: espaco.lg,
      gap: espaco.sm,
      paddingBottom: espaco.xl,
    },
    acenos: {
      margin: espaco.md,
      padding: espaco.md,
      gap: espaco.sm,
      borderRadius: raios.cartao,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.linhaForte,
    },
    linhaAceno: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
    busca: {
      minHeight: 52,
      borderRadius: raios.botao,
      borderWidth: 1,
      borderColor: c.linha,
      paddingHorizontal: espaco.md,
      color: c.texto,
      fontFamily: fontes.texto,
      fontSize: 17,
    },
    linhaMembro: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, minHeight: 56 },
  });
