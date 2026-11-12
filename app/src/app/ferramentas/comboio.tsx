import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Pressable, View } from 'react-native';

import { TelaFerramenta } from '@/componentes/TelaFerramenta';
import { linkMapa, linkWhatsApp } from '@/ferramentas/calculos';
import { espaco, fontes, raios, useCores } from '@/theme';
import { Botao, Icone, Texto, type NomeIcone } from '@/ui';

const avisos: { chave: string; icone: NomeIcone }[] = [
  { chave: 'pausa', icone: 'agape' },
  { chave: 'combustivel', icone: 'posto' },
  { chave: 'fiqueiPraTras', icone: 'alerta' },
  { chave: 'esperem', icone: 'reagrupar' },
  { chave: 'tudoBem', icone: 'check' },
  { chave: 'pneu', icone: 'oficina' },
];

async function minhaPosicao() {
  const { granted } = await Location.requestForegroundPermissionsAsync().catch(() => ({ granted: false }));
  const p = granted ? await Location.getCurrentPositionAsync({}).catch(() => null) : null;
  return p ? { lat: p.coords.latitude, lng: p.coords.longitude } : null;
}

/**
 * Avisos rápidos do comboio e "onde estou": mensagem pronta com a localização para o grupo do WhatsApp.
 * Pelo app, os avisos chegam ao comboio na etapa dos passeios; até lá, vão pelo WhatsApp.
 */
export default function Comboio() {
  const { t } = useTranslation();
  const cores = useCores();
  const enviar = async (texto: string, comLocal = true) => {
    const p = comLocal ? await minhaPosicao() : null;
    if (comLocal && !p) return Alert.alert(t('rota.erros.semLocalizacao'));
    const msg = p ? `${texto}\n${linkMapa(p.lat, p.lng)}` : texto;
    await Linking.openURL(linkWhatsApp(msg)).catch(() => Alert.alert(t('ferramentas.semWhatsApp')));
  };
  return (
    <TelaFerramenta
      titulo={t('ferramentas.itens.comboio.titulo')}
      explicacao={t('ferramentas.itens.comboio.explicacao')}
    >
      <Botao
        titulo={t('ferramentas.comboio.ondeEstou')}
        icone="localizacao"
        grande
        onPress={() => void enviar(t('ferramentas.comboio.ondeEstouTexto'))}
      />
      <Botao
        titulo={t('ferramentas.comboio.pontoEncontro')}
        icone="sede"
        variante="secundario"
        grande
        onPress={() => void enviar(t('ferramentas.comboio.pontoEncontroTexto'))}
      />
      <Texto variante="rotulo">{t('ferramentas.comboio.rapidos')}</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm }}>
        {avisos.map((a) => (
          <Pressable
            key={a.chave}
            accessibilityRole="button"
            accessibilityLabel={t(`ferramentas.comboio.avisos.${a.chave}`)}
            onPress={() => void enviar(t(`ferramentas.comboio.avisos.${a.chave}`))}
            style={({ pressed }) => ({
              width: '47%',
              flexGrow: 1,
              minHeight: 96,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderRadius: raios.cartao,
              borderWidth: 1,
              borderColor: cores.linha,
              backgroundColor: pressed ? cores.superficie3 : cores.superficie2,
            })}
          >
            <Icone nome={a.icone} tamanho={32} cor={cores.acao} />
            <Texto style={{ fontFamily: fontes.textoForte, textAlign: 'center' }}>
              {t(`ferramentas.comboio.avisos.${a.chave}`)}
            </Texto>
          </Pressable>
        ))}
      </View>
      <Texto variante="pequeno">{t('ferramentas.comboio.parado')}</Texto>
    </TelaFerramenta>
  );
}
