import { Component, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { StyleSheet, TextInput, View } from 'react-native';

import { Botao, Texto } from '@/ui';
import { espaco, raios, useCores, useEstilos, type Paleta } from '@/theme';

import { enviarDetalhes, relatarErro } from './sentry';

const criarEstilos = (c: Paleta) =>
  StyleSheet.create({
    tela: { flex: 1, backgroundColor: c.fundo, justifyContent: 'center', padding: espaco.lg, gap: espaco.md },
    campo: {
      minHeight: 96,
      borderRadius: raios.botao,
      borderWidth: 1,
      borderColor: c.linhaForte,
      backgroundColor: c.superficie,
      color: c.texto,
      padding: espaco.md,
      fontSize: 17,
      textAlignVertical: 'top',
    },
  });

function TelaDeErro({
  idErro,
  aoVoltar,
  aoPedirAjuda,
}: {
  idErro?: string;
  aoVoltar: () => void;
  aoPedirAjuda: () => void;
}) {
  const { t } = useTranslation();
  const e = useEstilos(criarEstilos);
  const cores = useCores();
  const [comentario, setComentario] = useState('');
  const [enviado, setEnviado] = useState(false);
  return (
    <View style={e.tela}>
      <Texto variante="titulo">{t('erros.titulo')}</Texto>
      <Texto>{t('erros.texto')}</Texto>
      {!enviado && (
        <TextInput
          style={e.campo}
          multiline
          value={comentario}
          onChangeText={setComentario}
          placeholder={t('erros.comentario')}
          placeholderTextColor={cores.textoSec}
          accessibilityLabel={t('erros.comentario')}
        />
      )}
      {enviado ? (
        <Texto>{t('erros.enviado')}</Texto>
      ) : (
        <Botao
          titulo={t('erros.enviar')}
          variante="secundario"
          grande
          onPress={() => {
            enviarDetalhes(comentario, idErro);
            setEnviado(true);
          }}
        />
      )}
      <Botao titulo={t('erros.pedirAjuda')} variante="contorno" onPress={aoPedirAjuda} />
      <Botao titulo={t('erros.voltar')} grande onPress={aoVoltar} />
    </View>
  );
}

type Estado = { erro?: Error; idErro?: string };

/** Pega qualquer erro de tela: relata e mostra uma saída em vez de fechar o app. */
export class LimiteDeErro extends Component<{ children: ReactNode }, Estado> {
  state: Estado = {};
  static getDerivedStateFromError(erro: Error): Estado {
    return { erro };
  }
  componentDidCatch(erro: Error) {
    this.setState({ idErro: relatarErro(erro, { origem: 'limite-de-tela' }) });
  }
  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <TelaDeErro
        idErro={this.state.idErro}
        aoVoltar={() => {
          this.setState({ erro: undefined, idErro: undefined });
          router.replace('/');
        }}
        aoPedirAjuda={() => {
          this.setState({ erro: undefined, idErro: undefined });
          router.replace('/ajuda');
        }}
      />
    );
  }
}
