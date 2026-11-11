import { StyleSheet, View, type ViewProps } from 'react-native';

import { cores, espaco, raios } from '@/theme';

import { Profundidade } from './Profundidade';

type Props = ViewProps & { overlock?: boolean; destaque?: boolean };

/**
 * Cartão "bordado": fundo sarja, profundidade costurada e, opcionalmente,
 * a borda overlock (laranja com contorno escuro e pesponto creme por dentro).
 * A textura de sarja e a borda em imagem entram quando os arquivos convertidos chegarem;
 * até lá a borda é desenhada em código.
 */
export function CartaoBordado({ overlock, destaque, style, children, ...resto }: Props) {
  return (
    <View style={[estilos.externo, style]} {...resto}>
      <Profundidade nivel={destaque ? 'patch' : 'costurado'} raio={raios.cartao} />
      <View style={[estilos.cartao, overlock && estilos.overlockFora]}>
        <View style={overlock ? estilos.overlockDentro : undefined}>
          {overlock && <View pointerEvents="none" style={estilos.pesponto} />}
          <View style={estilos.conteudo}>{children}</View>
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  externo: { borderRadius: raios.cartao },
  cartao: { backgroundColor: cores.sarja, borderRadius: raios.cartao, overflow: 'hidden' },
  overlockFora: { borderWidth: 1.5, borderColor: cores.laranjaEscuro },
  overlockDentro: { borderWidth: 4, borderColor: cores.laranja, borderRadius: raios.cartao - 1.5 },
  pesponto: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    margin: 4,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: cores.creme,
    borderRadius: raios.cartao - 8,
    opacity: 0.85,
  },
  conteudo: { padding: espaco.lg },
});
