import { useCallback, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  espaco,
  fontes,
  raios,
  sombra,
  tamanhoTexto,
  toque,
  useCores,
  useEstilos,
  type Paleta,
} from '@/theme';

import {
  assinarDialogos,
  fecharAtual,
  pedidoAtual,
  type BotaoAviso,
  type OpcaoMenu,
  type PedidoAviso,
  type PedidoMenu,
} from './dialogo';
import { Botao } from './Botao';
import { Icone, caminhosIcones, type NomeIcone } from './icones';
import { Texto } from './Texto';

const criarEstilos = (c: Paleta) =>
  StyleSheet.create({
    fundo: { flex: 1, backgroundColor: 'rgba(10,8,6,0.72)' },
    centro: { flex: 1, justifyContent: 'center', padding: espaco.lg },
    cartao: {
      backgroundColor: c.superficie,
      borderRadius: raios.folha,
      borderWidth: 1,
      borderColor: c.linha,
      padding: espaco.lg,
      gap: espaco.sm,
      maxHeight: '90%',
      boxShadow: sombra.flutuante,
    },
    botoes: { gap: espaco.xs, marginTop: espaco.xs },
    base: { flex: 1, justifyContent: 'flex-end' },
    folha: {
      backgroundColor: c.superficie,
      borderTopLeftRadius: raios.folha,
      borderTopRightRadius: raios.folha,
      borderTopWidth: 1,
      borderColor: c.linha,
      paddingHorizontal: espaco.md,
      paddingTop: espaco.xs,
      boxShadow: sombra.folha,
      maxHeight: '85%',
    },
    alca: {
      alignSelf: 'center',
      width: 44,
      height: 5,
      borderRadius: 4,
      backgroundColor: c.linhaForte,
      marginBottom: espaco.xs,
    },
    tituloFolha: { paddingVertical: espaco.xs, paddingHorizontal: espaco.xs },
    linha: {
      minHeight: toque.botao,
      flexDirection: 'row',
      alignItems: 'center',
      gap: espaco.sm,
      paddingHorizontal: espaco.sm,
      borderRadius: raios.botao,
    },
    rotulo: { flex: 1, fontFamily: fontes.textoSemi, fontSize: tamanhoTexto.corpo, color: c.texto },
    cancelar: {
      minHeight: toque.botao,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: raios.botao,
      borderWidth: 1,
      borderColor: c.linhaForte,
      marginTop: espaco.xs,
    },
  });

const ehIcone = (n?: string): n is NomeIcone => !!n && n in caminhosIcones;

/** Botão de uma janela de aviso: principal (laranja), cancelar (neutro) ou destrutivo (contorno vermelho). */
function BotaoDoAviso({ botao, aoEscolher }: { botao: BotaoAviso; aoEscolher: (b: BotaoAviso) => void }) {
  const c = useCores();
  if (botao.style === 'destructive') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={botao.text}
        testID="dialogo-destrutivo"
        onPress={() => aoEscolher(botao)}
        style={({ pressed }) => [
          {
            minHeight: toque.botao,
            borderRadius: raios.botao,
            borderWidth: 2,
            borderColor: c.sos,
            backgroundColor: pressed ? c.superficie3 : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: espaco.lg,
          },
        ]}
      >
        <Texto variante="corpoForte" style={{ textAlign: 'center' }}>
          {botao.text}
        </Texto>
      </Pressable>
    );
  }
  return (
    <Botao
      titulo={botao.text}
      variante={botao.style === 'cancel' ? 'secundario' : 'principal'}
      onPress={() => aoEscolher(botao)}
    />
  );
}

function JanelaAviso({ pedido, fechar }: { pedido: PedidoAviso; fechar: (b?: BotaoAviso) => void }) {
  const { t } = useTranslation();
  const estilos = useEstilos(criarEstilos);
  const botoes = pedido.botoes.length ? pedido.botoes : [{ text: t('comum.ok') }];
  // Ações primeiro; "cancelar" por último (fica sempre à mão do polegar).
  const ordenados = [
    ...botoes.filter((b) => b.style !== 'cancel'),
    ...botoes.filter((b) => b.style === 'cancel'),
  ];
  const cancelamento = botoes.find((b) => b.style === 'cancel');
  return (
    <Modal
      testID="dialogo-modal"
      transparent
      animationType="fade"
      statusBarTranslucent
      visible
      onRequestClose={() => fechar(cancelamento)}
    >
      <View style={estilos.fundo} accessibilityViewIsModal importantForAccessibility="yes">
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel={t('comum.fechar')}
          testID="dialogo-fundo"
          onPress={() => fechar(cancelamento)}
        />
        <View style={estilos.centro} pointerEvents="box-none">
          <View style={estilos.cartao} accessibilityRole="alert">
            <ScrollView bounces={false} contentContainerStyle={{ gap: espaco.sm }}>
              <Texto variante="subtitulo" accessibilityRole="header">
                {pedido.titulo}
              </Texto>
              {pedido.mensagem ? <Texto>{pedido.mensagem}</Texto> : null}
            </ScrollView>
            <View style={estilos.botoes}>
              {ordenados.map((b, i) => (
                <BotaoDoAviso key={`${b.text}-${i}`} botao={b} aoEscolher={fechar} />
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function LinhaDoMenu({ opcao, aoEscolher }: { opcao: OpcaoMenu; aoEscolher: (o: OpcaoMenu) => void }) {
  const c = useCores();
  const estilos = useEstilos(criarEstilos);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={opcao.rotulo}
      testID={opcao.destrutivo ? 'dialogo-destrutivo' : undefined}
      onPress={() => aoEscolher(opcao)}
      style={({ pressed }) => [
        estilos.linha,
        opcao.destrutivo && { borderWidth: 1.5, borderColor: c.sos },
        pressed && { backgroundColor: c.superficie3 },
      ]}
    >
      {ehIcone(opcao.icone) && (
        <Icone nome={opcao.icone} tamanho={24} cor={opcao.destrutivo ? c.sos : c.textoSec} />
      )}
      <Texto style={estilos.rotulo} maxFontSizeMultiplier={1.5}>
        {opcao.rotulo}
      </Texto>
    </Pressable>
  );
}

function FolhaMenu({ pedido, fechar }: { pedido: PedidoMenu; fechar: (o?: OpcaoMenu) => void }) {
  const { t } = useTranslation();
  const estilos = useEstilos(criarEstilos);
  const insets = useSafeAreaInsets();
  return (
    <Modal
      testID="dialogo-modal"
      transparent
      animationType="slide"
      statusBarTranslucent
      visible
      onRequestClose={() => fechar()}
    >
      <View style={estilos.fundo} accessibilityViewIsModal importantForAccessibility="yes">
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel={t('comum.fechar')}
          testID="dialogo-fundo"
          onPress={() => fechar()}
        />
        <View style={estilos.base} pointerEvents="box-none">
          <View style={[estilos.folha, { paddingBottom: Math.max(insets.bottom, espaco.md) }]}>
            <View style={estilos.alca} />
            {pedido.titulo ? (
              <Texto variante="subtitulo" accessibilityRole="header" style={estilos.tituloFolha}>
                {pedido.titulo}
              </Texto>
            ) : null}
            {pedido.mensagem ? (
              <Texto variante="secundario" style={estilos.tituloFolha} numberOfLines={4}>
                {pedido.mensagem}
              </Texto>
            ) : null}
            <ScrollView bounces={false}>
              {pedido.opcoes.map((o, i) => (
                <LinhaDoMenu key={`${o.rotulo}-${i}`} opcao={o} aoEscolher={fechar} />
              ))}
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('comum.cancelar')}
              onPress={() => fechar()}
              style={estilos.cancelar}
            >
              <Texto variante="corpoForte">{t('comum.cancelar')}</Texto>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** Desenha a janela atual da fila. Montar uma única vez, no layout raiz (dentro do tema). */
export function DialogoHost() {
  const pedido = useSyncExternalStore(assinarDialogos, pedidoAtual, pedidoAtual);
  const fecharAviso = useCallback((b?: BotaoAviso) => {
    fecharAtual();
    b?.onPress?.();
  }, []);
  const fecharMenu = useCallback((o?: OpcaoMenu) => {
    fecharAtual();
    o?.onPress();
  }, []);
  if (!pedido) return null;
  return pedido.tipo === 'aviso' ? (
    <JanelaAviso key={pedido.titulo} pedido={pedido} fechar={fecharAviso} />
  ) : (
    <FolhaMenu key={pedido.titulo ?? 'menu'} pedido={pedido} fechar={fecharMenu} />
  );
}
