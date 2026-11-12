import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Campo, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { useMeusPosts } from '@/estado/meusPosts';
import { escolherFoto } from '@/feed/foto';
import { espaco, raios } from '@/theme';
import { Botao, Texto } from '@/ui';

/** Novo story: uma foto (sem localização) e uma legenda curta; some em 24 h. */
export default function NovoStory() {
  const { t } = useTranslation();
  const { publicarStory } = useMeusPosts();
  const [foto, setFoto] = useState<string>();
  const [legenda, setLegenda] = useState('');
  return (
    <TelaFerramenta titulo={t('story.novo')} explicacao={t('story.explica')}>
      {foto && (
        <Image
          source={{ uri: foto }}
          style={{ width: '100%', aspectRatio: 9 / 12, borderRadius: raios.cartao }}
          contentFit="cover"
          accessible={false}
        />
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
        <View style={{ flex: 1, minWidth: 140 }}>
          <Botao
            titulo={t('publicar.camera')}
            icone="camera"
            variante="secundario"
            onPress={() => void escolherFoto('camera').then((u) => u && setFoto(u))}
          />
        </View>
        <View style={{ flex: 1, minWidth: 140 }}>
          <Botao
            titulo={t('publicar.galeria')}
            icone="camadas"
            variante="secundario"
            onPress={() => void escolherFoto('galeria').then((u) => u && setFoto(u))}
          />
        </View>
      </View>
      <Campo rotulo={t('story.legenda')} valor={legenda} aoMudar={(v) => setLegenda(v.slice(0, 80))} />
      <Texto variante="pequeno">{t('publicar.semLocal')}</Texto>
      <Botao
        titulo={t('story.publicar')}
        grande
        icone="check"
        desativado={!foto}
        onPress={() => {
          if (!foto) return;
          publicarStory(foto, legenda.trim());
          router.back();
        }}
      />
    </TelaFerramenta>
  );
}
