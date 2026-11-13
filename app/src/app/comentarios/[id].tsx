import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Campo, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { useMeusPosts } from '@/estado/meusPosts';
import { useModeracao } from '@/feed/moderacao';
import * as feed from '@/servidor/feed';
import { espaco } from '@/theme';
import { Avatar, Botao, Cartao, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

/** Comentários de EXEMPLO (até a etapa social) + os do irmão, que ele pode apagar. */
const exemplos = [
  { id: 'x1', autor: 'Zé Ferreira', texto: 'Que estrada linda! Na próxima eu vou junto.' },
  { id: 'x2', autor: 'Ivan Coruja', texto: 'TFA, irmão. Boa estrada!' },
];

export default function Comentarios() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { comentarios, comentar, apagarComentario, servidor } = useMeusPosts();
  const { confirmarDenuncia, confirmarBloqueio } = useModeracao();
  const [texto, setTexto] = useState('');
  const [doServidor, setDoServidor] = useState<feed.ComentarioServidor[]>([]);
  const meus = comentarios[id] ?? [];
  // Com o servidor ligado não há comentários de exemplo.
  const lista: { id: string; autor: string; autorId?: string; texto: string; meu: boolean }[] = servidor
    ? doServidor
    : [...exemplos.map((e) => ({ ...e, meu: false })), ...meus];

  const recarregar = useCallback(async () => {
    if (!servidor) return;
    try {
      setDoServidor(await feed.listarComentarios(id));
    } catch {
      avisar(t('feed.erroAcao'));
    }
  }, [servidor, id, t]);
  useEffect(() => {
    void Promise.resolve().then(recarregar);
  }, [recarregar]);

  const apagar = (cid: string) => {
    if (!servidor) return apagarComentario(id, cid);
    feed
      .apagarComentario(cid)
      .then(recarregar)
      .catch(() => avisar(t('feed.erroAcao')));
  };
  const enviar = () => {
    const limpo = texto.trim();
    if (!servidor) {
      comentar(id, limpo, t('perfil.voce'));
      setTexto('');
      return;
    }
    feed
      .comentar(id, limpo)
      .then(() => {
        setTexto('');
        return recarregar();
      })
      .catch(() => avisar(t('feed.erroAcao')));
  };

  return (
    <TelaFerramenta titulo={t('comentarios.titulo')}>
      {lista.map((c) => (
        <Cartao key={c.id} style={{ flexDirection: 'row', gap: espaco.sm, alignItems: 'flex-start' }}>
          <Avatar nome={c.autor} tamanho={40} />
          <View style={{ flex: 1 }}>
            <Texto variante="corpoForte">{c.autor}</Texto>
            <Texto>{c.texto}</Texto>
          </View>
          {c.meu ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('comentarios.apagar')}
              onPress={() =>
                avisar(t('comentarios.apagar'), undefined, [
                  { text: t('comum.cancelar'), style: 'cancel' },
                  {
                    text: t('comentarios.apagar'),
                    style: 'destructive',
                    onPress: () => apagar(c.id),
                  },
                ])
              }
              hitSlop={10}
            >
              <Texto variante="pequeno">{t('comentarios.apagar')}</Texto>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('feed.denunciar')}
              onPress={() =>
                servidor
                  ? confirmarDenuncia('comentario', c.id)
                  : avisar(t('feed.denunciar'), t('feed.denunciaRecebida'))
              }
              hitSlop={10}
            >
              <Texto variante="pequeno">{t('comentarios.denunciar')}</Texto>
            </Pressable>
          )}
          {servidor && !c.meu && c.autorId && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('feed.bloquear', { nome: c.autor })}
              onPress={() => confirmarBloqueio(c.autorId!, c.autor, () => void recarregar())}
              hitSlop={10}
            >
              <Texto variante="pequeno">{t('feed.bloquearConfirmar')}</Texto>
            </Pressable>
          )}
        </Cartao>
      ))}
      <Campo rotulo={t('comentarios.escrever')} valor={texto} aoMudar={setTexto} linhas={2} />
      <Botao
        titulo={t('comentarios.enviar')}
        icone="comentario"
        desativado={!texto.trim()}
        onPress={enviar}
      />
    </TelaFerramenta>
  );
}
