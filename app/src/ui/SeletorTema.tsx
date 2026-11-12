import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { espaco, fontes, raios, toque, useCores, useTema, type PreferenciaTema } from '@/theme';

import { Icone, type NomeIcone } from './icones';
import { Texto } from './Texto';

const opcoes: { chave: PreferenciaTema; icone: NomeIcone }[] = [
  { chave: 'auto', icone: 'auto' },
  { chave: 'noite', icone: 'lua' },
  { chave: 'sol', icone: 'sol' },
];

/** Escolha da aparência (R17): Automático, Noite ou Sol, sempre à mão. */
export function SeletorTema() {
  const { t } = useTranslation();
  const c = useCores();
  const { preferencia, definirPreferencia } = useTema();
  return (
    <View style={{ gap: espaco.xs }}>
      <View accessibilityRole="radiogroup" accessibilityLabel={t('tema.titulo')} style={estilos.linha}>
        {opcoes.map((o) => {
          const ativo = o.chave === preferencia;
          return (
            <Pressable
              key={o.chave}
              accessibilityRole="radio"
              accessibilityState={{ checked: ativo }}
              accessibilityLabel={t(`tema.${o.chave}`)}
              onPress={() => definirPreferencia(o.chave)}
              style={[
                estilos.opcao,
                {
                  borderColor: ativo ? c.acao : c.linha,
                  borderWidth: ativo ? 3 : 1,
                  backgroundColor: ativo ? c.superficie3 : c.superficie2,
                },
              ]}
            >
              <Icone nome={o.icone} tamanho={24} cor={ativo ? c.acao : c.texto} />
              <Texto
                style={{
                  fontFamily: ativo ? fontes.textoForte : fontes.textoSemi,
                  fontSize: 15,
                  color: c.texto,
                }}
                maxFontSizeMultiplier={1.5}
              >
                {t(`tema.${o.chave}`)}
              </Texto>
            </Pressable>
          );
        })}
      </View>
      <Texto variante="secundario">{t('tema.explica')}</Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', gap: espaco.xs },
  opcao: {
    flex: 1,
    minHeight: toque.botaoGrande + 16,
    borderRadius: raios.botao,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: espaco.xs,
  },
});
