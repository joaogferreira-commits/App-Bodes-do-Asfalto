import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, Share, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Coordenada } from '@/navegacao/destinos';
import { usePerfilOpcional } from '@/estado/perfil';
import { linkWhatsApp } from '@/ferramentas/calculos';
import { ehUrgente, MAX_MENSAGEM_AJUDA, mensagemSOS, tiposAjuda, type TipoAjuda } from '@/seguranca/sos';
import { useBloqueioEmMovimento } from '@/seguranca/useBloqueioEmMovimento';
import { espaco, fontes, raios, useCores, useEstilos, type Paleta } from '@/theme';
import { Botao, Cartao, Icone, Texto } from '@/ui';

/**
 * SOS (versão sem servidor): pega a posição, monta a mensagem com o link do mapa e a ficha de emergência
 * e deixa tudo a UM toque — WhatsApp de cada contato, compartilhar no grupo do comboio, ligar 192/193.
 * Quando o Supabase existir, o aviso ao comboio por push sai sozinho (Etapa 4).
 */
export default function Sos() {
  const { t, i18n } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const emMovimento = useBloqueioEmMovimento();
  const [tipo, setTipo] = useState<TipoAjuda | null>(null);
  const [mensagem, setMensagem] = useState('');
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

  const montar = (tipoEscolhido: TipoAjuda | null, livre: string) =>
    mensagemSOS({
      nome: perfil?.perfil.nome || t('perfil.voce'),
      apelido: perfil?.perfil.apelido,
      tipo: tipoEscolhido ? t(`sos.tipos.${tipoEscolhido}`) : null,
      mensagem: livre,
      posicao,
      agora: new Date(),
      idioma: i18n.language,
      ficha,
      textos: {
        titulo: t('sos.mensagemTitulo'),
        quem: t('sos.quem'),
        oQueHouve: t('sos.oQueHouve'),
        onde: t('sos.onde'),
        enviadoAs: (hora, data) => t('sos.enviadoAs', { hora, data }),
        semPosicao: t('sos.semPosicao'),
        sangue: t('ferramentas.ficha.sangue'),
        alergias: t('ferramentas.ficha.alergias'),
        remedios: t('ferramentas.ficha.remedios'),
        plano: t('ferramentas.ficha.plano'),
        rodape: t('sos.rodape'),
      },
    });
  const texto = montar(tipo, mensagem);
  const contatos = perfil?.contatos ?? [];

  const enviar = (corpo: string) => {
    const primeiro = contatos[0];
    void (primeiro
      ? Linking.openURL(linkWhatsApp(corpo, primeiro.telefone))
      : Share.share({ message: corpo }));
  };

  // Guarda o tipo escolhido na sessão de ajuda atual (só no aparelho).
  const escolher = (id: TipoAjuda) => {
    const novo = tipo === id && !emMovimento ? null : id;
    setTipo(novo);
    void AsyncStorage.setItem(
      'bodes.sosSessao',
      JSON.stringify({ tipo: novo, em: new Date().toISOString() }),
    ).catch(() => undefined);
    // Em movimento: sem digitar, um toque basta e já envia.
    if (emMovimento && novo) enviar(montar(novo, ''));
  };

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

        <Texto variante="rotulo">{t('sos.tipoTitulo')}</Texto>
        <View style={estilos.grade}>
          {tiposAjuda.map((x) => {
            const ativo = tipo === x.id;
            return (
              <Pressable
                key={x.id}
                accessibilityRole="button"
                accessibilityState={{ selected: ativo }}
                accessibilityLabel={t(`sos.tipos.${x.id}`)}
                onPress={() => escolher(x.id)}
                style={[
                  estilos.tipo,
                  ativo && { borderColor: cores.sos, backgroundColor: cores.superficie3 },
                ]}
              >
                <Icone
                  nome={x.icone}
                  tamanho={28}
                  cor={x.urgente ? cores.sos : cores.texto}
                  espessura={2.2}
                />
                <Texto style={{ textAlign: 'center', fontFamily: fontes.textoMedio }}>
                  {t(`sos.tipos.${x.id}`)}
                </Texto>
              </Pressable>
            );
          })}
        </View>
        {emMovimento ? (
          <Texto variante="pequeno">{t('sos.umToque')}</Texto>
        ) : (
          <TextInput
            value={mensagem}
            onChangeText={setMensagem}
            maxLength={MAX_MENSAGEM_AJUDA}
            multiline
            placeholder={t('sos.acrescentar')}
            placeholderTextColor={cores.textoApagado}
            accessibilityLabel={t('sos.acrescentar')}
            style={estilos.entrada}
          />
        )}
        {ehUrgente(tipo) && (
          <Cartao style={{ borderColor: cores.sos }}>
            <Texto style={{ color: cores.sos, fontFamily: fontes.textoMedio }}>{t('sos.urgente')}</Texto>
          </Cartao>
        )}

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

const criarEstilos = (cores: Paleta) => ({
  grade: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: espaco.sm },
  tipo: {
    flexBasis: '47%' as const,
    flexGrow: 1,
    minHeight: 80,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    padding: espaco.sm,
    borderRadius: raios.cartao,
    borderWidth: 2,
    borderColor: cores.linha,
    backgroundColor: cores.superficie2,
  },
  entrada: {
    minHeight: 72,
    fontSize: 17,
    fontFamily: fontes.textoMedio,
    color: cores.texto,
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: raios.cartao,
    padding: espaco.sm,
    textAlignVertical: 'top' as const,
  },
});
