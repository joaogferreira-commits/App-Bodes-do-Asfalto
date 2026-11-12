import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { lerPrecoCombustivel, type AcaoFicha, type Ficha } from '@/map/fichas';
import { espaco, fontes, raios, useCores } from '@/theme';
import { Avatar, Botao, BotaoIcone, Icone, pinos, Texto, type NomeIcone, type StatusIrmao } from '@/ui';

const iconeDaAcao: Record<AcaoFicha, NomeIcone> = {
  rota: 'navegar',
  acenar: 'aceno',
  perfil: 'perfil',
  informarPreco: 'posto',
  vitrine: 'loja',
  salvar: 'salvar',
  vou: 'check',
  falarContato: 'comentario',
  site: 'compartilhar',
};

type Props = {
  ficha: Ficha | null;
  /** status do irmão, para o anel do avatar */
  status?: StatusIrmao;
  /** ações já feitas (ex.: aceno enviado, salvo, "vou") para mostrar o estado */
  feitas?: AcaoFicha[];
  aoFechar: () => void;
  aoAgir: (acao: AcaoFicha, extra?: string) => void;
};

/**
 * Ficha que sobe de baixo ao tocar num ícone do mapa: o que é, informações curtas e no máximo
 * 2 ações grandes (público 40–60 anos: poucos itens, botões de 48 dp+).
 */
export function FichaMapa({ ficha, status, feitas = [], aoFechar, aoAgir }: Props) {
  const { t } = useTranslation();
  const cores = useCores();
  const [preco, setPreco] = useState<string | null>(null);
  const [erroPreco, setErroPreco] = useState(false);

  const fechar = () => {
    setPreco(null);
    setErroPreco(false);
    aoFechar();
  };

  return (
    <Modal visible={!!ficha} transparent animationType="slide" onRequestClose={fechar}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }}
        onPress={fechar}
        accessibilityRole="button"
        accessibilityLabel={t('comum.fechar')}
      />
      {ficha && (
        <SafeAreaView
          edges={['bottom']}
          style={{
            backgroundColor: cores.superficie,
            borderTopLeftRadius: raios.folha,
            borderTopRightRadius: raios.folha,
            borderTopWidth: 1,
            borderColor: cores.linha,
            maxHeight: '70%',
          }}
        >
          <ScrollView
            contentContainerStyle={{ padding: espaco.lg, gap: espaco.md }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.md }}>
              {ficha.tipo === 'irmao' ? (
                <Avatar nome={ficha.titulo} status={status} tamanho={56} />
              ) : (
                <Image
                  source={pinos[ficha.tipo].imagem}
                  style={{ width: 44, height: 56 }}
                  contentFit="contain"
                  accessible={false}
                />
              )}
              <View style={{ flex: 1 }}>
                <Texto variante="subtitulo" accessibilityRole="header">
                  {ficha.titulo}
                </Texto>
                <Texto variante="secundario">{t(ficha.subtitulo, ficha.subtituloValores ?? {})}</Texto>
              </View>
              <BotaoIcone icone="fechar" rotulo={t('comum.fechar')} onPress={fechar} />
            </View>

            {ficha.linhas.map((l) => (
              <View key={l.chave} style={{ flexDirection: 'row', gap: espaco.sm, alignItems: 'flex-start' }}>
                <Icone nome={l.icone} tamanho={22} cor={cores.textoSec} />
                <Texto style={{ flex: 1 }}>{t(l.chave, l.valores ?? {})}</Texto>
              </View>
            ))}

            {preco !== null ? (
              <View style={{ gap: espaco.sm }}>
                <Texto variante="rotulo">{t('ficha.precoPergunta')}</Texto>
                <TextInput
                  value={preco}
                  onChangeText={(v) => {
                    setPreco(v);
                    setErroPreco(false);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="6,29"
                  placeholderTextColor={cores.textoSec}
                  accessibilityLabel={t('ficha.precoPergunta')}
                  style={{
                    minHeight: 56,
                    borderRadius: raios.botao,
                    borderWidth: 1,
                    borderColor: erroPreco ? cores.sos : cores.linha,
                    paddingHorizontal: espaco.md,
                    color: cores.texto,
                    fontFamily: fontes.titulo,
                    fontSize: 28,
                  }}
                />
                {erroPreco && <Texto style={{ color: cores.sos }}>{t('ficha.precoInvalido')}</Texto>}
                <Botao
                  titulo={t('ficha.precoEnviar')}
                  icone="check"
                  onPress={() => {
                    const v = lerPrecoCombustivel(preco);
                    if (!v) return setErroPreco(true);
                    aoAgir('informarPreco', v);
                    setPreco(null);
                  }}
                />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
                {ficha.acoes.map((a, i) => {
                  const feita = feitas.includes(a);
                  return (
                    <View key={a} style={{ flexGrow: 1, flexBasis: '45%' }}>
                      <Botao
                        titulo={t(feita ? `ficha.acoesFeitas.${a}` : `ficha.acoes.${a}`)}
                        icone={feita ? 'check' : iconeDaAcao[a]}
                        variante={i === 0 && !feita ? 'principal' : 'secundario'}
                        onPress={() => (a === 'informarPreco' ? setPreco('') : aoAgir(a))}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      )}
    </Modal>
  );
}
