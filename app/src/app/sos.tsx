import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Coordenada } from '@/navegacao/destinos';
import { usePerfilOpcional } from '@/estado/perfil';
import { linkWhatsApp } from '@/ferramentas/calculos';
import { mensagemSOS } from '@/seguranca/sos';
import { espaco, fontes, useCores } from '@/theme';
import { Botao, Cartao, Icone, Texto } from '@/ui';

/**
 * SOS (versão sem servidor): pega a posição, monta a mensagem com o link do mapa e a ficha de emergência
 * e deixa tudo a UM toque — WhatsApp de cada contato, compartilhar no grupo do comboio, ligar 192/193.
 * Quando o Supabase existir, o aviso ao comboio por push sai sozinho (Etapa 4).
 */
export default function Sos() {
  const { t } = useTranslation();
  const cores = useCores();
  const perfil = usePerfilOpcional();
  const [posicao, setPosicao] = useState<Coordenada | null>(null);
  const [buscando, setBuscando] = useState(true);
  const [ficha, setFicha] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
    void AsyncStorage.getItem('bodes.fichaMedica')
      .then((v) => v && setFicha(JSON.parse(v) as Record<string, string>))
      .catch(() => undefined);
    void (async () => {
      const { granted } = await Location.requestForegroundPermissionsAsync().catch(() => ({
        granted: false,
      }));
      if (granted) {
        const r = await Location.getLastKnownPositionAsync().catch(() => null);
        if (r) setPosicao({ lat: r.coords.latitude, lng: r.coords.longitude });
        const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(
          () => null,
        );
        if (p) setPosicao({ lat: p.coords.latitude, lng: p.coords.longitude });
      }
      setBuscando(false);
    })();
  }, []);

  const texto = mensagemSOS({
    nome: perfil?.perfil.nome || t('perfil.voce'),
    posicao,
    agora: new Date(),
    ficha,
    textos: {
      titulo: t('sos.mensagemTitulo'),
      semPosicao: t('sos.semPosicao'),
      sangue: t('ferramentas.ficha.sangue'),
      alergias: t('ferramentas.ficha.alergias'),
      remedios: t('ferramentas.ficha.remedios'),
      plano: t('ferramentas.ficha.plano'),
      rodape: t('sos.rodape'),
    },
  });
  const contatos = perfil?.contatos ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <ScrollView contentContainerStyle={{ padding: espaco.lg, gap: espaco.md, paddingBottom: espaco.xxxl }}>
        <View style={{ alignItems: 'center', gap: espaco.xs }}>
          <Icone nome="sos" tamanho={64} cor={cores.sos} espessura={2.4} />
          <Texto variante="titulo" style={{ color: cores.sos, textAlign: 'center' }}>
            {t('sos.titulo')}
          </Texto>
          <Texto style={{ textAlign: 'center' }}>
            {buscando ? t('sos.buscando') : posicao ? t('sos.posicaoPronta') : t('sos.semPosicao')}
          </Texto>
        </View>

        <Botao
          titulo={t('sos.ligar192')}
          variante="sos"
          grande
          icone="socorro"
          onPress={() => void Linking.openURL('tel:192')}
        />
        <Botao
          titulo={t('sos.ligar193')}
          variante="sos"
          grande
          icone="alerta"
          onPress={() => void Linking.openURL('tel:193')}
        />

        <Texto variante="rotulo">{t('sos.avisar')}</Texto>
        {contatos.length === 0 && (
          <Cartao style={{ gap: espaco.xs, borderColor: cores.alerta }}>
            <Texto>{t('sos.semContatos')}</Texto>
            <Botao
              titulo={t('contatos.adicionar')}
              variante="secundario"
              onPress={() => router.push('/contatos')}
            />
          </Cartao>
        )}
        {contatos.map((c) => (
          <Botao
            key={c.id}
            titulo={t('sos.whatsPara', { nome: c.nome })}
            icone="comentario"
            grande
            onPress={() => void Linking.openURL(linkWhatsApp(texto, c.telefone))}
          />
        ))}
        <Botao
          titulo={t('sos.grupo')}
          icone="compartilhar"
          variante="secundario"
          grande
          onPress={() => void Share.share({ message: texto })}
        />

        <Cartao style={{ gap: 4 }}>
          <Texto variante="pequeno">{t('sos.previa')}</Texto>
          <Texto style={{ fontFamily: fontes.textoMedio }}>{texto}</Texto>
        </Cartao>
        <Texto variante="pequeno">{t('sos.limite')}</Texto>
        <Botao titulo={t('sos.estouBem')} variante="contorno" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}
