import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { espaco } from '@/theme';

import { Texto } from './Texto';

const ilustracoes = {
  estrada: require('../../assets/gerados/ilustracoes/ilustra-vazio-estrada.webp'),
  viagem: require('../../assets/gerados/ilustracoes/ilustra-primeira-viagem.webp'),
  boasVindas: require('../../assets/gerados/ilustracoes/ilustra-boas-vindas.webp'),
  nivel: require('../../assets/gerados/ilustracoes/ilustra-nivel-novo.webp'),
} as const;

type Props = {
  ilustracao: keyof typeof ilustracoes;
  titulo: string;
  texto: string;
  children?: React.ReactNode;
};

/** Estado vazio com ilustração (Kit visual). Nunca no modo pilotando. */
export function EstadoVazio({ ilustracao, titulo, texto, children }: Props) {
  return (
    <View style={estilos.base}>
      <Image source={ilustracoes[ilustracao]} style={estilos.imagem} contentFit="cover" accessible={false} />
      <Texto variante="subtitulo" style={estilos.centro}>
        {titulo}
      </Texto>
      <Texto variante="secundario" style={estilos.centro}>
        {texto}
      </Texto>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  base: { alignItems: 'center', gap: espaco.sm, paddingHorizontal: espaco.xl },
  imagem: { width: '100%', aspectRatio: 1.5, borderRadius: 18, marginBottom: espaco.sm },
  centro: { textAlign: 'center' },
});
