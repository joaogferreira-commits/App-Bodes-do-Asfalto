import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { espaco, fontes, raios, toque, useCores } from '@/theme';
import { BotaoIcone, Texto } from '@/ui';

/** Moldura das telas de ferramenta: voltar, título, explicação curta e conteúdo rolável. */
export function TelaFerramenta({
  titulo,
  explicacao,
  children,
}: {
  titulo: string;
  explicacao?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const cores = useCores();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <View style={estilos.topo}>
        <BotaoIcone icone="voltar" rotulo={t('comum.voltar')} onPress={() => router.back()} />
        <Texto variante="subtitulo" style={{ flex: 1 }} numberOfLines={2}>
          {titulo}
        </Texto>
      </View>
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        {explicacao && <Texto variante="secundario">{explicacao}</Texto>}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Campo de texto/número grande (56 dp), com rótulo visível. */
export function Campo({
  rotulo,
  valor,
  aoMudar,
  teclado = 'default',
  sufixo,
  linhas,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  teclado?: KeyboardTypeOptions;
  sufixo?: string;
  linhas?: number;
}) {
  const cores = useCores();
  return (
    <View style={{ gap: 4, flex: 1 }}>
      <Texto variante="pequeno">{rotulo}</Texto>
      <View style={[estilos.campo, { borderColor: cores.linhaForte, backgroundColor: cores.superficie }]}>
        <TextInput
          value={valor}
          onChangeText={aoMudar}
          keyboardType={teclado}
          accessibilityLabel={rotulo}
          multiline={!!linhas}
          numberOfLines={linhas}
          style={[
            estilos.entrada,
            { color: cores.texto },
            linhas ? { minHeight: linhas * 24, textAlignVertical: 'top' } : null,
          ]}
          placeholderTextColor={cores.textoApagado}
        />
        {sufixo && <Texto variante="secundario">{sufixo}</Texto>}
      </View>
    </View>
  );
}

/** Número a partir do texto digitado (aceita vírgula). */
export const numero = (v: string) => {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

/** Resultado em destaque (número grande + rótulo). */
export function Resultado({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Texto variante="numero" style={{ fontSize: 34, lineHeight: 38 }}>
        {valor}
      </Texto>
      <Texto variante="pequeno" style={{ textAlign: 'center' }}>
        {rotulo}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm, padding: espaco.md },
  conteudo: { padding: espaco.lg, gap: espaco.md, paddingBottom: espaco.xxxl },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    minHeight: toque.botaoGrande,
    paddingHorizontal: espaco.md,
    borderRadius: raios.botao,
    borderWidth: 1,
  },
  entrada: { flex: 1, fontSize: 18, fontFamily: fontes.textoSemi, paddingVertical: 10 },
});
