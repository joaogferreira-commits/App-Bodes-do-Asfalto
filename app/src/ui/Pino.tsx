import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { fontes, paletaNoite, useCores, type NomeCor } from '@/theme';

import type { NomeIcone } from './icones';
import { Texto } from './Texto';

export type TipoPino =
  | 'sede'
  | 'posto'
  | 'loja'
  | 'agape'
  | 'oficina'
  | 'socorro'
  | 'alerta'
  | 'monumento'
  | 'turistico'
  | 'restaurante'
  | 'sos'
  | 'rotaBiker';

/**
 * Pinos do mapa = emblemas bordados do kit (docs/assets-originais, convertidos em assets/gerados/pinos).
 * Cada tipo tem desenho próprio (não depende só da cor, R23). "agrupa": sede, Ágape, socorro e SOS
 * nunca são agrupados (R44). "icone" e "cor" servem a legendas e listas.
 */
export const pinos: Record<
  TipoPino,
  { imagem: number; icone: NomeIcone; cor: NomeCor; agrupa: boolean; prioridade: number }
> = {
  sos: {
    imagem: require('../../assets/gerados/pinos/pino-sos.webp'),
    icone: 'sos',
    cor: 'sos',
    agrupa: false,
    prioridade: 0,
  },
  agape: {
    imagem: require('../../assets/gerados/pinos/pino-agape.webp'),
    icone: 'agape',
    cor: 'ouro',
    agrupa: false,
    prioridade: 1,
  },
  socorro: {
    imagem: require('../../assets/gerados/pinos/pino-socorro-fraterno.webp'),
    icone: 'socorro',
    cor: 'acao',
    agrupa: false,
    prioridade: 2,
  },
  sede: {
    imagem: require('../../assets/gerados/pinos/pino-sede.webp'),
    icone: 'sede',
    cor: 'ouro',
    agrupa: false,
    prioridade: 3,
  },
  alerta: {
    imagem: require('../../assets/gerados/pinos/pino-alerta.webp'),
    icone: 'alerta',
    cor: 'alerta',
    agrupa: false,
    prioridade: 4,
  },
  posto: {
    imagem: require('../../assets/gerados/pinos/pino-posto.webp'),
    icone: 'posto',
    cor: 'verdePosto',
    agrupa: true,
    prioridade: 5,
  },
  loja: {
    imagem: require('../../assets/gerados/pinos/pino-loja.webp'),
    icone: 'loja',
    cor: 'azulRio',
    agrupa: true,
    prioridade: 6,
  },
  oficina: {
    imagem: require('../../assets/gerados/pinos/pino-oficina.webp'),
    icone: 'oficina',
    cor: 'textoSec',
    agrupa: true,
    prioridade: 7,
  },
  restaurante: {
    imagem: require('../../assets/gerados/pinos/pino-restaurante.webp'),
    icone: 'agape',
    cor: 'acao',
    agrupa: true,
    prioridade: 8,
  },
  monumento: {
    imagem: require('../../assets/gerados/pinos/pino-monumento.webp'),
    icone: 'sede',
    cor: 'textoSec',
    agrupa: true,
    prioridade: 9,
  },
  rotaBiker: {
    // Monumento da Rota Biker: provisório recolorido do monumento até o desenho próprio (fila de imagens).
    imagem: require('../../assets/gerados/pinos/pino-rota-biker.webp'),
    icone: 'moto',
    cor: 'acao',
    agrupa: true,
    prioridade: 8,
  },
  turistico: {
    imagem: require('../../assets/gerados/pinos/pino-ponto-turistico.webp'),
    icone: 'camadas',
    cor: 'azulRio',
    agrupa: true,
    prioridade: 10,
  },
};

export const corDoPino = (tipo: TipoPino) => paletaNoite[pinos[tipo].cor];

type Props = { tipo: TipoPino; rotulo?: string; descricao: string; tamanho?: number; selecionado?: boolean };

/** Pino do mapa: emblema do tipo (proporção 4:5) com etiqueta opcional embaixo (preço, nome curto). */
export function Pino({ tipo, rotulo, descricao, tamanho = 44, selecionado }: Props) {
  const c = useCores();
  const largura = selecionado ? Math.round(tamanho * 1.3) : tamanho;
  return (
    <View accessible accessibilityLabel={descricao} style={estilos.coluna}>
      <Image
        testID={`pino-${tipo}`}
        source={pinos[tipo].imagem}
        style={{ width: largura, height: Math.round(largura * 1.25) }}
        contentFit="contain"
        accessible={false}
      />
      {rotulo && (
        <View style={[estilos.etiqueta, { backgroundColor: c.superficie, borderColor: c.linhaForte }]}>
          <Texto style={[estilos.textoEtiqueta, { color: c.texto }]} maxFontSizeMultiplier={1.3}>
            {rotulo}
          </Texto>
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  coluna: { alignItems: 'center' },
  etiqueta: { marginTop: 2, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  textoEtiqueta: { fontSize: 13, fontFamily: fontes.textoSemi },
});
