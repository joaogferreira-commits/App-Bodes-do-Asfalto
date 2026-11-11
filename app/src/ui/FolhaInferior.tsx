import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cores, espaco, raios } from '@/theme';

import { Profundidade } from './Profundidade';

type Props = { visivel: boolean; onFechar: () => void; rotuloFechar: string; children: React.ReactNode };

/** Folha inferior: raio 22, alça bordada, profundidade 2. */
export function FolhaInferior({ visivel, onFechar, rotuloFechar, children }: Props) {
  const { bottom } = useSafeAreaInsets();
  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar}>
      <Pressable
        style={estilos.fundo}
        onPress={onFechar}
        accessibilityLabel={rotuloFechar}
        accessibilityRole="button"
      />
      <View style={[estilos.folha, { paddingBottom: espaco.xl + bottom }]}>
        <Profundidade nivel="patch" raio={raios.folha} />
        <View style={estilos.alca} />
        {children}
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  folha: {
    backgroundColor: cores.sarja,
    borderTopLeftRadius: raios.folha,
    borderTopRightRadius: raios.folha,
    borderTopWidth: 2,
    borderColor: cores.laranja,
    padding: espaco.xl,
    gap: espaco.md,
  },
  alca: {
    alignSelf: 'center',
    width: 48,
    borderTopWidth: 3,
    borderStyle: 'dashed',
    borderColor: cores.caramelo,
    marginBottom: espaco.xs,
  },
});
