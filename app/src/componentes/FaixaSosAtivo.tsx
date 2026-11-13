import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSosAtivoOpcional } from '@/estado/sosAtivo';
import { fontes, useCores } from '@/theme';
import { Icone, Texto } from '@/ui';
import { BotaoSegurar } from '@/ui/BotaoSegurar';

const DURACAO_ENCERRAR_SOS = 1500;

/**
 * Faixa "SOS ativo" em todas as telas enquanto o pedido de ajuda está aberto no servidor.
 * Encerrar exige segurar 1,5 s (evita encerrar sem querer com a moto andando).
 */
export function FaixaSosAtivo() {
  const { t } = useTranslation();
  const cores = useCores();
  const sos = useSosAtivoOpcional();
  if (!sos?.ativo) return null;
  return (
    <SafeAreaView edges={['top']} style={estilos.raiz} pointerEvents="box-none">
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[estilos.faixa, { backgroundColor: cores.sos, borderColor: cores.contornoSos }]}
      >
        <Icone nome="sos" tamanho={28} cor={cores.textoSobreSos} espessura={2.4} />
        <View style={{ flex: 1 }}>
          <Texto style={{ color: cores.textoSobreSos, fontFamily: fontes.textoForte }}>
            {t('sosAtivo.faixa')}
          </Texto>
          <Texto variante="pequeno" style={{ color: cores.textoSobreSos }}>
            {t('sosAtivo.faixaTexto')}
          </Texto>
        </View>
        <BotaoSegurar
          duracao={DURACAO_ENCERRAR_SOS}
          aoCompletar={() => void sos.encerrar()}
          rotulo={t('sosAtivo.encerrarRotulo')}
          dica={t('sosAtivo.encerrarDica')}
          corProgresso={cores.sosPressionado}
          style={[estilos.encerrar, { borderColor: cores.contornoSos }]}
        >
          <Texto
            variante="pequeno"
            maxFontSizeMultiplier={1.2}
            style={{ color: cores.textoSobreSos, textAlign: 'center', fontFamily: fontes.textoForte }}
          >
            {t('sosAtivo.encerrarTexto')}
          </Texto>
        </BotaoSegurar>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  raiz: { position: 'absolute', top: 0, left: 0, right: 0 },
  faixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 8,
    marginTop: 4,
    padding: 8,
    borderRadius: 14,
    borderWidth: 2,
  },
  encerrar: { width: 96, minHeight: 56, borderRadius: 10, borderWidth: 2 },
});
