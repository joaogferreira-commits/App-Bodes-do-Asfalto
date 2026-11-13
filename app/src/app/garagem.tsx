import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useRascunho } from '@/estado/rascunho';
import { Campo, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { usePerfil, type Moto } from '@/estado/perfil';
import { escolherFoto } from '@/feed/foto';
import { espaco, raios, useCores } from '@/theme';
import { Botao, Cartao, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

type Rascunho = Omit<Moto, 'id' | 'principal'> & { id?: string };
const vazio: Rascunho = { marca: '', modelo: '', ano: '', apelido: '', km: '' };

/** Garagem: várias motos (marca, modelo, ano, apelido, foto, km); a principal aparece no perfil. */
export default function Garagem() {
  const { t } = useTranslation();
  const cores = useCores();
  const { motos, salvarMoto, apagarMoto, tornarPrincipal } = usePerfil();
  // Vindo do perfil ("Editar moto"), já abre a ficha daquela moto.
  const { editar } = useLocalSearchParams<{ editar?: string }>();
  const [rascunho, setRascunho, limpaFicha] = useRascunho<Rascunho | null>(
    `garagem.${editar ?? 'ficha'}`,
    (() => {
      const alvo = editar ? motos.find((m) => m.id === editar) : undefined;
      return alvo ? { ...alvo } : motos.length ? null : vazio;
    })(),
  );
  const fechar = () => {
    setRascunho(null);
    limpaFicha();
  };
  const muda = (k: keyof Rascunho) => (v: string) => setRascunho((r) => (r ? { ...r, [k]: v } : r));

  const salvar = () => {
    if (!rascunho) return;
    if (!rascunho.marca.trim() || !rascunho.modelo.trim()) return avisar(t('garagem.falta'));
    salvarMoto({ ...rascunho, marca: rascunho.marca.trim(), modelo: rascunho.modelo.trim() });
    fechar();
  };

  const ficha = rascunho && (
    <Cartao style={{ gap: espaco.sm }}>
      <Texto variante="destaque">{rascunho.id ? t('garagem.editar') : t('garagem.nova')}</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm }}>
        <Campo rotulo={t('garagem.marca')} valor={rascunho.marca} aoMudar={muda('marca')} />
        <Campo rotulo={t('garagem.modelo')} valor={rascunho.modelo} aoMudar={muda('modelo')} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm }}>
        <Campo rotulo={t('garagem.ano')} valor={rascunho.ano} aoMudar={muda('ano')} teclado="numeric" />
        <Campo
          rotulo={t('garagem.km')}
          valor={rascunho.km}
          aoMudar={muda('km')}
          teclado="numeric"
          sufixo="km"
        />
      </View>
      <Campo rotulo={t('garagem.apelido')} valor={rascunho.apelido} aoMudar={muda('apelido')} />
      {rascunho.foto && (
        <Image
          source={{ uri: rascunho.foto }}
          style={{ width: '100%', aspectRatio: 2, borderRadius: raios.cartao }}
          contentFit="cover"
          accessible={false}
        />
      )}
      <Botao
        titulo={rascunho.foto ? t('garagem.trocarFoto') : t('garagem.foto')}
        icone="camera"
        variante="secundario"
        onPress={() =>
          void escolherFoto('galeria').then((u) => u && setRascunho((r) => (r ? { ...r, foto: u } : r)))
        }
      />
      <Botao titulo={t('publicar.salvar')} grande icone="check" onPress={salvar} />
      {motos.length > 0 && <Botao titulo={t('comum.cancelar')} variante="contorno" onPress={fechar} />}
    </Cartao>
  );

  return (
    <TelaFerramenta titulo={t('garagem.titulo')} explicacao={t('garagem.explica')}>
      {motos.map((m) =>
        rascunho?.id === m.id ? (
          <View key={m.id}>{ficha}</View>
        ) : (
          <Cartao
            key={m.id}
            semPadding
            style={{
              overflow: 'hidden',
              borderColor: m.principal ? cores.acao : cores.linha,
              borderWidth: m.principal ? 2 : 1,
            }}
          >
            {m.foto && (
              <Image
                source={{ uri: m.foto }}
                style={{ width: '100%', aspectRatio: 2 }}
                contentFit="cover"
                accessibilityLabel={`${m.marca} ${m.modelo}`}
              />
            )}
            <View style={{ padding: espaco.md, gap: 4 }}>
              {m.principal && (
                <Texto variante="rotulo" style={{ color: cores.acao }}>
                  {t('garagem.principal')}
                </Texto>
              )}
              <Texto variante="destaque">
                {m.marca} {m.modelo}
              </Texto>
              <Texto variante="secundario">
                {[
                  m.ano,
                  m.apelido && t('garagem.apelidoTexto', { apelido: m.apelido }),
                  m.km && t('garagem.kmTexto', { km: m.km }),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Texto>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs, marginTop: espaco.xs }}>
                <Botao
                  titulo={t('publicar.editar')}
                  icone="editar"
                  variante="secundario"
                  onPress={() => setRascunho({ ...m })}
                />
                {!m.principal && (
                  <Botao
                    titulo={t('garagem.tornarPrincipal')}
                    variante="contorno"
                    onPress={() => tornarPrincipal(m.id)}
                  />
                )}
                <Botao
                  titulo={t('publicar.excluir')}
                  variante="contorno"
                  onPress={() =>
                    avisar(t('garagem.excluirPergunta'), undefined, [
                      { text: t('comum.cancelar'), style: 'cancel' },
                      { text: t('publicar.excluir'), style: 'destructive', onPress: () => apagarMoto(m.id) },
                    ])
                  }
                />
              </View>
            </View>
          </Cartao>
        ),
      )}

      {rascunho && !rascunho.id ? (
        ficha
      ) : (
        <Botao titulo={t('garagem.adicionar')} icone="mais" grande onPress={() => setRascunho(vazio)} />
      )}
    </TelaFerramenta>
  );
}
