import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Switch, View } from 'react-native';

import { useAcesso } from '@/acesso/acesso';
import { Campo, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { EMAIL_SUPORTE, WHATSAPP_SUPORTE } from '@/config/suporte';
import { lerErros, textoDosErros } from '@/erros/registro';
import { useRascunho } from '@/estado/rascunho';
import { linkWhatsApp } from '@/ferramentas/calculos';
import { prepararFoto } from '@/feed/foto';
import {
  CATEGORIAS_SUPORTE,
  MAX_TEXTO_SUPORTE,
  dadosDoAparelho,
  enviarPedido,
  meusPedidos,
  type CategoriaSuporte,
  type PedidoSuporte,
} from '@/servidor/suporte';
import { espaco, raios, useCores } from '@/theme';
import { Botao, Cartao, Chip, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

type Rascunho = { categoria: CategoriaSuporte; texto: string };

/**
 * Ajuda (CLAUDE.md, Suporte): texto, print e dados do aparelho chegam ao painel; e-mail e WhatsApp do suporte.
 * O envio ao servidor só existe no modo servidor; no modo local ficam só os contatos.
 */
export default function Ajuda() {
  const { t, i18n } = useTranslation();
  const cores = useCores();
  const acesso = useAcesso();
  const servidor = acesso.modo === 'supabase';
  const [r, setR, limpar] = useRascunho<Rascunho>('ajuda', { categoria: 'duvida', texto: '' });
  const [print, setPrint] = useState<string | null>(null);
  const [enviarAparelho, setEnviarAparelho] = useState(false);
  const [incluirErros, setIncluirErros] = useState(false);
  const [temErros, setTemErros] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [pedidos, setPedidos] = useState<PedidoSuporte[] | null>(null);
  const aparelho = dadosDoAparelho(i18n.language);

  const carregar = useCallback(async () => {
    try {
      setPedidos(await meusPedidos());
    } catch {
      setPedidos([]);
    }
  }, []);

  useEffect(() => {
    let vivo = true;
    void lerErros().then((l) => vivo && setTemErros(l.length > 0));
    if (servidor)
      void meusPedidos()
        .then((p) => vivo && setPedidos(p))
        .catch(() => vivo && setPedidos([]));
    return () => {
      vivo = false;
    };
  }, [servidor]);

  const anexar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return avisar(t('ajuda.semPermissao'));
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      exif: false,
    });
    const uri = res.canceled ? null : res.assets?.[0]?.uri;
    if (uri) setPrint(await prepararFoto(uri)); // reduz e remove o EXIF (localização da foto)
  };

  const enviar = async () => {
    if (!r.texto.trim()) return avisar(t('ajuda.textoFalta'));
    setEnviando(true);
    try {
      const erros = incluirErros ? textoDosErros(await lerErros()) : undefined;
      await enviarPedido({
        texto: r.texto,
        categoria: r.categoria,
        aparelho: enviarAparelho ? aparelho : null,
        printUri: print,
        erros,
      });
      limpar();
      setR({ categoria: 'duvida', texto: '' });
      setPrint(null);
      setIncluirErros(false);
      avisar(t('ajuda.enviado'));
      await carregar();
    } catch {
      avisar(t('ajuda.erroEnviar'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <TelaFerramenta titulo={t('ajuda.titulo')} explicacao={t('ajuda.explica')}>
      <Botao
        titulo={t('ajuda.email')}
        icone="comentario"
        variante="secundario"
        onPress={() =>
          void Linking.openURL(`mailto:${EMAIL_SUPORTE}?subject=${encodeURIComponent(t('ajuda.assunto'))}`)
        }
      />
      {!!WHATSAPP_SUPORTE && (
        <Botao
          titulo={t('ajuda.whatsapp')}
          icone="comentario"
          variante="secundario"
          onPress={() => void Linking.openURL(linkWhatsApp(t('ajuda.mensagemWhats'), WHATSAPP_SUPORTE))}
        />
      )}

      {servidor && (
        <>
          <Texto variante="rotulo">{t('ajuda.categoria')}</Texto>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
            {CATEGORIAS_SUPORTE.map((c) => (
              <Chip
                key={c}
                rotulo={t(`ajuda.categorias.${c}`)}
                ativo={r.categoria === c}
                onPress={() => setR((a) => ({ ...a, categoria: c }))}
              />
            ))}
          </View>
          <Campo
            rotulo={t('ajuda.texto')}
            valor={r.texto}
            aoMudar={(v) => setR((a) => ({ ...a, texto: v.slice(0, MAX_TEXTO_SUPORTE) }))}
            linhas={5}
          />

          {print ? (
            <Cartao style={{ gap: espaco.sm }}>
              <Image
                source={{ uri: print }}
                style={{ width: '100%', height: 160, borderRadius: raios.cartao }}
                contentFit="cover"
                accessibilityLabel={t('ajuda.printAnexado')}
              />
              <Botao titulo={t('ajuda.removerPrint')} variante="contorno" onPress={() => setPrint(null)} />
            </Cartao>
          ) : (
            <Botao
              titulo={t('ajuda.anexarPrint')}
              icone="camera"
              variante="secundario"
              onPress={() => void anexar()}
            />
          )}

          <Cartao style={{ gap: espaco.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm, minHeight: 56 }}>
              <Texto variante="corpoForte" style={{ flex: 1 }}>
                {t('ajuda.dadosAparelho')}
              </Texto>
              <Switch
                accessibilityLabel={t('ajuda.dadosAparelho')}
                value={enviarAparelho}
                onValueChange={setEnviarAparelho}
                trackColor={{ false: cores.linhaForte, true: cores.acao }}
              />
            </View>
            <Texto variante="secundario">
              {t('ajuda.dadosAparelhoLista', {
                app: aparelho.app,
                so: aparelho.so,
                modelo: aparelho.modelo,
                idioma: aparelho.idioma,
              })}
            </Texto>
            {temErros && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm, minHeight: 56 }}>
                <Texto variante="corpoForte" style={{ flex: 1 }}>
                  {t('ajuda.incluirErros')}
                </Texto>
                <Switch
                  accessibilityLabel={t('ajuda.incluirErros')}
                  value={incluirErros}
                  onValueChange={setIncluirErros}
                  trackColor={{ false: cores.linhaForte, true: cores.acao }}
                />
              </View>
            )}
          </Cartao>

          <Botao
            titulo={enviando ? t('ajuda.enviando') : t('ajuda.enviar')}
            grande
            desativado={enviando}
            onPress={() => void enviar()}
          />

          <Texto variante="rotulo">{t('ajuda.meusPedidos')}</Texto>
          {pedidos?.length === 0 && <Texto variante="secundario">{t('ajuda.nenhumPedido')}</Texto>}
          {pedidos?.map((p) => (
            <Cartao key={p.id} style={{ gap: espaco.xs }}>
              <Texto variante="secundario">
                {t(`ajuda.categorias.${p.categoria}`)} · {t(`ajuda.status.${p.status}`)}
              </Texto>
              <Texto>{p.texto}</Texto>
              {!!p.resposta && (
                <Texto variante="corpoForte">{t('ajuda.resposta', { texto: p.resposta })}</Texto>
              )}
            </Cartao>
          ))}
        </>
      )}
    </TelaFerramenta>
  );
}
