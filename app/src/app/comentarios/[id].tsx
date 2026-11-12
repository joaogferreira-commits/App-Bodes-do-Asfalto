import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';

import { Campo, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { useMeusPosts } from '@/estado/meusPosts';
import { espaco } from '@/theme';
import { Avatar, Botao, Cartao, Texto } from '@/ui';

/** Comentários de EXEMPLO (até a etapa social) + os do irmão, que ele pode apagar. */
const exemplos = [
  { id: 'x1', autor: 'Zé Ferreira', texto: 'Que estrada linda! Na próxima eu vou junto.' },
  { id: 'x2', autor: 'Ivan Coruja', texto: 'TFA, irmão. Boa estrada!' },
];

export default function Comentarios() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { comentarios, comentar, apagarComentario } = useMeusPosts();
  const [texto, setTexto] = useState('');
  const meus = comentarios[id] ?? [];
  const lista = [...exemplos.map((e) => ({ ...e, meu: false })), ...meus];

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
                Alert.alert(t('comentarios.apagar'), undefined, [
                  { text: t('comum.cancelar'), style: 'cancel' },
                  {
                    text: t('comentarios.apagar'),
                    style: 'destructive',
                    onPress: () => apagarComentario(id, c.id),
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
              onPress={() => Alert.alert(t('feed.denunciar'), t('feed.denunciaRecebida'))}
              hitSlop={10}
            >
              <Texto variante="pequeno">{t('comentarios.denunciar')}</Texto>
            </Pressable>
          )}
        </Cartao>
      ))}
      <Campo rotulo={t('comentarios.escrever')} valor={texto} aoMudar={setTexto} linhas={2} />
      <Botao
        titulo={t('comentarios.enviar')}
        icone="comentario"
        desativado={!texto.trim()}
        onPress={() => {
          comentar(id, texto.trim(), t('perfil.voce'));
          setTexto('');
        }}
      />
    </TelaFerramenta>
  );
}
