import { StyleSheet, View } from 'react-native';

import { fontes, paletaNoite, useCores, type Paleta } from '@/theme';

import { Icone, type NomeIcone } from './icones';
import { Texto } from './Texto';

export type StatusIrmao = 'aberto' | 'estrada' | 'cafe' | 'naoPerturbe' | 'nenhum';

/** Cor do anel por status. "Na estrada" usa o jeans clareado (≥ 3:1 no fundo). */
export function coresDoStatus(c: Paleta): Record<StatusIrmao, string> {
  return {
    aberto: c.acao,
    estrada: c.estrada,
    cafe: c.ouro,
    naoPerturbe: c.textoApagado,
    nenhum: c.linhaForte,
  };
}
export const corDoStatus = coresDoStatus(paletaNoite);

/**
 * Nada só por cor (R23): cada status também muda o traço do anel e ganha um selo com ícone.
 * aberto = contínuo; na estrada = tracejado + moto; café = pontilhado + xícara; não perturbe = selo "—".
 */
const tracoDoStatus: Record<StatusIrmao, 'solid' | 'dashed' | 'dotted'> = {
  aberto: 'solid',
  estrada: 'dashed',
  cafe: 'dotted',
  naoPerturbe: 'solid',
  nenhum: 'solid',
};
const seloDoStatus: Partial<Record<StatusIrmao, NomeIcone>> = {
  estrada: 'moto',
  cafe: 'agape',
  naoPerturbe: 'menos',
};

type Props = { nome: string; status?: StatusIrmao; tamanho?: number; rotuloStatus?: string };

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '';
  return (primeira + ultima).toUpperCase();
}

/** Avatar redondo com anel de status. Até o irmão subir foto, mostra as iniciais. */
export function Avatar({ nome, status = 'nenhum', tamanho = 44, rotuloStatus }: Props) {
  const c = useCores();
  const cor = coresDoStatus(c)[status];
  const selo = seloDoStatus[status];
  const tamSelo = Math.max(18, Math.round(tamanho * 0.4));
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={rotuloStatus ? `${nome}, ${rotuloStatus}` : nome}
      style={[
        estilos.base,
        {
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho / 2,
          borderColor: cor,
          borderStyle: tracoDoStatus[status],
          backgroundColor: c.superficie3,
        },
      ]}
    >
      <Texto
        style={{ fontFamily: fontes.titulo, fontSize: Math.max(13, tamanho * 0.34), color: c.texto }}
        maxFontSizeMultiplier={1}
      >
        {iniciais(nome)}
      </Texto>
      {selo && (
        <View
          testID={`selo-${status}`}
          style={[
            estilos.selo,
            {
              width: tamSelo,
              height: tamSelo,
              borderRadius: tamSelo / 2,
              backgroundColor: cor,
              borderColor: c.fundo,
            },
          ]}
        >
          <Icone nome={selo} tamanho={tamSelo - 6} cor={c.fundo} espessura={2.4} />
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  base: { borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  selo: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
