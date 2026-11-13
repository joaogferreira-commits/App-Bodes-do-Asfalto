import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { Passeio } from '@/dados/passeios';
import { clienteConsultas } from '@/servidor/consulta';
import { CHAVE_PASSEIOS, responderPasseio } from '@/servidor/passeios';
import { avisar } from '@/ui/dialogo';
import { espaco, raios, useCores, useEstilos, type Paleta } from '@/theme';
import { Avatar, Botao, Icone, Texto, type NomeIcone } from '@/ui';

function Linha({ icone, texto }: { icone: NomeIcone; texto: string }) {
  const cores = useCores();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.xs }}>
      <Icone nome={icone} tamanho={20} cor={cores.textoSec} />
      <Texto variante="secundario" style={{ flex: 1 }}>
        {texto}
      </Texto>
    </View>
  );
}

/** Cartão de passeio (Feed e aba Passeios): imagem, quando, saída → destino, km, terra, quem vai, Vou/Talvez. */
export function CartaoPasseio({ passeio: p }: { passeio: Passeio }) {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const [presenca, setPresenca] = useState<'vou' | 'talvez' | null>(p.minhaPresenca ?? null);
  // No servidor a contagem já inclui a minha presença; no exemplo somamos o toque local.
  const soma = (qual: 'vou' | 'talvez') => (!p.servidor && presenca === qual ? 1 : 0);
  const escolher = (qual: 'vou' | 'talvez') => {
    const novo = presenca === qual ? null : qual;
    const anterior = presenca;
    setPresenca(novo);
    if (!p.servidor) return;
    void responderPasseio(p.id, novo).then((ok) => {
      if (ok) void clienteConsultas.invalidateQueries({ queryKey: CHAVE_PASSEIOS });
      else {
        setPresenca(anterior);
        avisar(t('passeios.erroPresenca'));
      }
    });
  };
  const passado = p.quando === 'passados';
  return (
    <View style={[estilos.cartao, p.oficial && { borderColor: cores.acao, borderWidth: 2 }]}>
      <View>
        <Image source={p.imagem} style={estilos.imagem} contentFit="cover" accessible={false} />
        <View style={[estilos.data, { backgroundColor: cores.superficie }]}>
          <Texto variante="corpoForte">{p.dia}</Texto>
          <Texto variante="pequeno">{p.hora}</Texto>
        </View>
      </View>
      <View style={estilos.corpo}>
        <Texto variante="rotulo" style={{ color: p.oficial ? cores.acao : cores.textoSec }}>
          {p.oficial
            ? t('passeios.oficial', { capitulo: p.capitulo })
            : t('passeios.deIrmao', { nome: p.organizador })}
        </Texto>
        <Texto variante="subtitulo">{p.titulo}</Texto>
        <Linha icone="sede" texto={t('passeios.trajeto', { saida: p.saida, destino: p.destino })} />
        {p.km > 0 && (
          <Linha
            icone={p.tipoEstrada}
            texto={t('passeios.distancia', {
              km: p.km,
              duracao: p.duracao,
              estrada: t(`rota.${p.tipoEstrada}`),
            })}
          />
        )}
        {p.terraPct > 0 && (
          <View style={estilos.barra} accessible accessibilityLabel={t('feed.terraPct', { pct: p.terraPct })}>
            <View style={{ flex: 100 - p.terraPct, backgroundColor: cores.asfalto }} />
            <View style={{ flex: p.terraPct, backgroundColor: cores.terra }} />
          </View>
        )}
        <Texto>{p.descricao}</Texto>
        <View style={estilos.quemVai}>
          <View style={{ flexDirection: 'row' }}>
            {p.confirmados.slice(0, 4).map((n, i) => (
              <View key={n} style={{ marginLeft: i === 0 ? 0 : -10 }}>
                <Avatar nome={n} tamanho={34} />
              </View>
            ))}
          </View>
          <Texto variante="secundario" style={{ flex: 1 }}>
            {passado
              ? t('passeios.foram', { n: p.vou })
              : t('feed.confirmados', {
                  vou: p.vou + soma('vou'),
                  talvez: p.talvez + soma('talvez'),
                })}
          </Texto>
        </View>
        {!passado && (
          <View style={{ flexDirection: 'row', gap: espaco.xs }}>
            <View style={{ flex: 1 }}>
              <Botao
                titulo={t('mapa.vou')}
                variante={presenca === 'vou' ? 'principal' : 'secundario'}
                icone={presenca === 'vou' ? 'check' : undefined}
                grande
                onPress={() => escolher('vou')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Botao
                titulo={t('feed.talvez')}
                variante={presenca === 'talvez' ? 'principal' : 'contorno'}
                grande
                onPress={() => escolher('talvez')}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const criarEstilos = (cores: Paleta) =>
  StyleSheet.create({
    cartao: {
      borderRadius: raios.cartao,
      borderWidth: 1,
      borderColor: cores.linha,
      backgroundColor: cores.superficie2,
      overflow: 'hidden',
    },
    imagem: { width: '100%', aspectRatio: 2.2, backgroundColor: cores.superficie3 },
    data: {
      position: 'absolute',
      left: espaco.sm,
      bottom: espaco.sm,
      paddingHorizontal: espaco.sm,
      paddingVertical: 4,
      borderRadius: raios.botao,
    },
    corpo: { padding: espaco.md, gap: espaco.xs },
    barra: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 },
    quemVai: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm, marginVertical: espaco.xs },
  });
