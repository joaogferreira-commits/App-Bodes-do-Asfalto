import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ehProducao } from '@/ambiente';
import { TelaFerramenta } from '@/componentes/TelaFerramenta';
import { espaco, useCores } from '@/theme';
import { Cartao, Icone, pinos, Texto } from '@/ui';

const regras = ['formacao', 'distancia', 'sinais', 'abastecer', 'alcool', 'ninguem'];

/** Sobre o clube e o código de conduta na estrada (texto a revisar pela diretoria). */
export default function Sobre() {
  const { t } = useTranslation();
  const cores = useCores();
  return (
    <TelaFerramenta titulo={t('ferramentas.itens.sobre.titulo')}>
      <View style={{ alignItems: 'center', gap: espaco.xs }}>
        <Image
          source={pinos.sede.imagem}
          style={{ width: 110, height: 136 }}
          contentFit="contain"
          accessible={false}
        />
        <Texto variante="titulo">Bodes do Asfalto</Texto>
        <Texto variante="secundario" style={{ textAlign: 'center' }}>
          {t('ferramentas.sobre.lema')}
        </Texto>
      </View>
      <Cartao style={{ gap: espaco.xs }}>
        <Texto variante="destaque">{t('ferramentas.sobre.historiaTitulo')}</Texto>
        <Texto>{t('ferramentas.sobre.historia')}</Texto>
      </Cartao>
      <Texto variante="rotulo">{t('ferramentas.sobre.conduta')}</Texto>
      {regras.map((r, i) => (
        <View key={r} style={{ flexDirection: 'row', gap: espaco.sm, alignItems: 'flex-start' }}>
          <Texto variante="subtitulo" style={{ color: cores.acao, width: 28 }}>
            {i + 1}
          </Texto>
          <Texto style={{ flex: 1 }}>{t(`ferramentas.sobre.regras.${r}`)}</Texto>
        </View>
      ))}
      {!ehProducao() && (
        <View style={{ flexDirection: 'row', gap: espaco.xs, alignItems: 'center' }}>
          <Icone nome="alerta" tamanho={18} cor={cores.textoSec} />
          <Texto variante="pequeno" style={{ flex: 1 }}>
            {t('ferramentas.sobre.revisar')}
          </Texto>
        </View>
      )}
    </TelaFerramenta>
  );
}
