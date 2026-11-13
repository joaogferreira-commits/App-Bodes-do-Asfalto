import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, Share, StyleSheet, TextInput, View } from 'react-native';

import { ListaAniversarios } from '@/componentes/ListaAniversarios';
import { ListaEventos } from '@/componentes/ListaEventos';
import { ListaLojas } from '@/componentes/ListaLojas';
import { ListaMembros } from '@/componentes/ListaMembros';
import { TelaFerramenta } from '@/componentes/TelaFerramenta';
import { normalizar } from '@/busca/buscar';
import { diretorios, type TipoDiretorio } from '@/dados/diretorios';
import { useViagem } from '@/estado/viagem';
import { linkWhatsApp } from '@/ferramentas/calculos';
import { useClubeNoServidor } from '@/servidor/useClube';
import { espaco, fontes, raios, toque, useCores, useEstilos, type Paleta } from '@/theme';
import { Avatar, Botao, Cartao, Icone, Pino, Texto, type StatusIrmao } from '@/ui';

/**
 * Lista das ferramentas de diretório. Com o servidor ligado, Lojas, Eventos, Membros e Aniversários vêm do banco;
 * as demais listas seguem com os dados do app (telefones) ou ficam escondidas (ver ferramentas/catalogo.ts).
 */
export default function Lista() {
  const servidor = useClubeNoServidor();
  const { tipo } = useLocalSearchParams<{ tipo: TipoDiretorio }>();
  if (servidor && tipo === 'lojas') return <ListaLojas />;
  if (servidor && tipo === 'eventos') return <ListaEventos />;
  if (servidor && tipo === 'membros') return <ListaMembros />;
  if (servidor && tipo === 'aniversarios') return <ListaAniversarios />;
  return <ListaLocal />;
}

function ListaLocal() {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const viagem = useViagem();
  const { tipo } = useLocalSearchParams<{ tipo: TipoDiretorio }>();
  const [filtro, setFiltro] = useState('');
  const itens = (diretorios[tipo] ?? []).filter(
    (i) =>
      !filtro || normalizar(`${i.titulo} ${i.subtitulo} ${i.detalhe ?? ''}`).includes(normalizar(filtro)),
  );

  const irAte = (titulo: string, posicao: { lat: number; lng: number }) => {
    viagem.definirBateVolta(null);
    viagem.definirDestino({ chave: 'busca', nome: titulo, posicao });
    router.push('/rota');
  };

  return (
    <TelaFerramenta
      titulo={t(`ferramentas.itens.${tipo}.titulo`)}
      explicacao={t(`ferramentas.itens.${tipo}.explicacao`)}
    >
      {tipo === 'membros' && (
        <Botao
          titulo={t('ferramentas.indicar')}
          icone="mais"
          onPress={() => void Share.share({ message: t('ferramentas.indicarTexto') })}
        />
      )}
      {itens.length > 4 && (
        <View style={[estilos.busca, { borderColor: cores.linhaForte }]}>
          <Icone nome="busca" tamanho={20} cor={cores.textoSec} />
          <TextInput
            value={filtro}
            onChangeText={setFiltro}
            placeholder={t('ferramentas.filtrar')}
            placeholderTextColor={cores.textoApagado}
            accessibilityLabel={t('ferramentas.filtrar')}
            style={estilos.entrada}
          />
        </View>
      )}
      {itens.map((i) => (
        <Cartao key={i.id} style={{ gap: espaco.sm }}>
          <View style={estilos.linha}>
            {tipo === 'irmaosPerto' || tipo === 'membros' || tipo === 'aniversarios' ? (
              <Avatar nome={i.titulo} status={(i.etiqueta as StatusIrmao) ?? 'nenhum'} tamanho={48} />
            ) : i.pino ? (
              <Pino tipo={i.pino} descricao={i.titulo} tamanho={40} />
            ) : (
              <Icone
                nome={i.icone ?? 'camadas'}
                tamanho={30}
                cor={tipo === 'telefones' ? cores.sos : cores.acao}
              />
            )}
            <View style={{ flex: 1 }}>
              <Texto variante="destaque">{i.titulo}</Texto>
              {!!i.subtitulo && <Texto variante="secundario">{i.subtitulo}</Texto>}
              {tipo === 'irmaosPerto' && i.etiqueta && i.etiqueta !== 'nenhum' && (
                <Texto variante="secundario">{t(`ferramentas.status.${i.etiqueta}`)}</Texto>
              )}
            </View>
            {i.etiqueta && tipo !== 'irmaosPerto' && (
              <View
                style={[estilos.etiqueta, { backgroundColor: cores.superficie3, borderColor: cores.ouro }]}
              >
                <Texto variante="pequeno" style={{ color: cores.ouro }}>
                  {i.etiqueta}
                </Texto>
              </View>
            )}
          </View>
          {i.detalhe && <Texto>{i.detalhe}</Texto>}
          <View style={estilos.acoes}>
            {i.telefone && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('ferramentas.ligar', { numero: i.telefone })}
                onPress={() => void Linking.openURL(`tel:${i.telefone}`)}
                style={[
                  estilos.acao,
                  tipo === 'telefones' && { backgroundColor: cores.sos, borderColor: cores.sos },
                ]}
              >
                <Icone
                  nome="socorro"
                  tamanho={20}
                  cor={tipo === 'telefones' ? cores.textoSobreSos : cores.texto}
                />
                <Texto style={[estilos.textoAcao, tipo === 'telefones' && { color: cores.textoSobreSos }]}>
                  {t('ferramentas.ligarCurto')}
                </Texto>
              </Pressable>
            )}
            {i.whatsapp && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('ferramentas.whatsapp')}
                onPress={() => void Linking.openURL(linkWhatsApp(t('ferramentas.oiIrmao'), i.whatsapp))}
                style={estilos.acao}
              >
                <Icone nome="comentario" tamanho={20} cor={cores.verdePosto} />
                <Texto style={estilos.textoAcao}>{t('ferramentas.whatsapp')}</Texto>
              </Pressable>
            )}
            {tipo === 'irmaosPerto' && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('feed.acenar')}
                onPress={() => undefined}
                style={estilos.acao}
              >
                <Icone nome="aceno" tamanho={20} cor={cores.acao} />
                <Texto style={estilos.textoAcao}>{t('feed.acenar')}</Texto>
              </Pressable>
            )}
            {i.posicao && tipo !== 'irmaosPerto' && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('ferramentas.rotaAte', { lugar: i.titulo })}
                onPress={() => irAte(i.titulo, i.posicao!)}
                style={[estilos.acao, { borderColor: cores.acao }]}
              >
                <Icone nome="navegar" tamanho={18} cor={cores.acao} />
                <Texto style={[estilos.textoAcao, { color: cores.acao }]}>{t('ferramentas.rota')}</Texto>
              </Pressable>
            )}
          </View>
        </Cartao>
      ))}
      {itens.length === 0 && <Texto variante="secundario">{t('busca.nada')}</Texto>}
      <Texto variante="pequeno">
        {t(tipo === 'telefones' ? 'ferramentas.telefonesAviso' : 'ferramentas.exemplo')}
      </Texto>
    </TelaFerramenta>
  );
}

const criarEstilos = (cores: Paleta) =>
  StyleSheet.create({
    linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
    busca: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: espaco.xs,
      minHeight: toque.botao,
      paddingHorizontal: espaco.md,
      borderRadius: raios.botao,
      borderWidth: 1,
      backgroundColor: cores.superficie,
    },
    entrada: { flex: 1, fontSize: 17, fontFamily: fontes.textoMedio, color: cores.texto },
    etiqueta: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: raios.pilula, borderWidth: 1 },
    acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs },
    acao: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 48,
      paddingHorizontal: 14,
      borderRadius: raios.pilula,
      borderWidth: 1,
      borderColor: cores.linha,
    },
    textoAcao: { fontFamily: fontes.textoSemi, fontSize: 15, color: cores.texto },
  });
