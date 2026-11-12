import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { TelaFerramenta } from '@/componentes/TelaFerramenta';
import { passeiosExemplo } from '@/dados/passeios';
import { postsExemplo } from '@/dados/feed';
import { useMeusPosts } from '@/estado/meusPosts';
import { espaco } from '@/theme';
import { Avatar, Cartao, Texto } from '@/ui';

/** Posts que o irmão salvou para ver depois (marcador no feed). */
export default function Salvos() {
  const { t } = useTranslation();
  const { salvos, posts, postsServidor } = useMeusPosts();
  const itens = salvos
    .map((id) => {
      const srv = postsServidor.find((p) => p.id === id);
      if (srv) return { id, autor: srv.autorNome, texto: srv.texto };
      const meu = posts.find((p) => p.id === id);
      if (meu) return { id, autor: t('perfil.voce'), texto: meu.texto };
      const p = postsExemplo.find((x) => x.id === id);
      if (!p) return null;
      const texto =
        'texto' in p
          ? p.texto
          : p.tipo === 'passeio'
            ? (passeiosExemplo.find((x) => x.id === p.passeioId)?.titulo ?? '')
            : p.tipo === 'enquete'
              ? p.pergunta
              : '';
      return { id, autor: p.autor.nome, texto };
    })
    .filter((x): x is { id: string; autor: string; texto: string } => !!x);

  return (
    <TelaFerramenta titulo={t('salvos.titulo')}>
      {itens.length === 0 && <Texto variante="secundario">{t('salvos.vazio')}</Texto>}
      {itens.map((i) => (
        <Pressable key={i.id} accessibilityRole="button" onPress={() => router.navigate('/feed')}>
          <Cartao style={{ flexDirection: 'row', gap: espaco.sm, alignItems: 'center' }}>
            <Avatar nome={i.autor} tamanho={44} />
            <View style={{ flex: 1 }}>
              <Texto variante="corpoForte">{i.autor}</Texto>
              <Texto variante="secundario" numberOfLines={2}>
                {i.texto}
              </Texto>
            </View>
          </Cartao>
        </Pressable>
      ))}
    </TelaFerramenta>
  );
}
