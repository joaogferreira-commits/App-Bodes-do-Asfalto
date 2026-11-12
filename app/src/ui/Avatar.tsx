import { StyleSheet, View } from 'react-native';

import { cores, fontes } from '@/theme';

import { Texto } from './Texto';

export type StatusIrmao = 'aberto' | 'estrada' | 'cafe' | 'naoPerturbe' | 'nenhum';

/** Anel por status (Kit visual): laranja aberto a encontro, azul na estrada, ouro no café, cinza não perturbe. */
export const corDoStatus: Record<StatusIrmao, string> = {
  aberto: cores.acao,
  estrada: cores.azulRio,
  cafe: cores.ouro,
  naoPerturbe: '#6E6458',
  nenhum: cores.linhaForte,
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
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={rotuloStatus ? `${nome}, ${rotuloStatus}` : nome}
      style={[
        estilos.base,
        { width: tamanho, height: tamanho, borderRadius: tamanho / 2, borderColor: corDoStatus[status] },
      ]}
    >
      <Texto
        style={{ fontFamily: fontes.titulo, fontSize: Math.max(13, tamanho * 0.34), color: cores.texto }}
      >
        {iniciais(nome)}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  base: { backgroundColor: '#2A2219', borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
});
