import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { normalizar } from '@/busca/buscar';
import {
  categorias,
  formatarPreco,
  type CategoriaClassificado,
  type Classificado,
} from '@/dados/classificados';
import { useClassificados } from '@/estado/classificados';
import { espaco, fontes, raios, toque, useCores, useEstilos, type Paleta } from '@/theme';
import { Botao, BotaoIcone, Chip, Icone, Texto } from '@/ui';

/** Classificados entre irmãos: busca, categorias, grade de fotos com preço em destaque. */
export default function Classificados() {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const { todos, favoritos } = useClassificados();
  const [cat, setCat] = useState<CategoriaClassificado | 'todos' | 'favoritos'>('todos');
  const [busca, setBusca] = useState('');
  const lista = todos
    .filter((c) =>
      cat === 'todos' ? true : cat === 'favoritos' ? favoritos.includes(c.id) : c.categoria === cat,
    )
    .filter((c) => !busca || normalizar(`${c.titulo} ${c.descricao} ${c.cidade}`).includes(normalizar(busca)))
    .sort((a, b) => Number(!!a.vendido) - Number(!!b.vendido) || Number(!!b.destaque) - Number(!!a.destaque));

  const cartao = ({ item: c }: { item: Classificado }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${c.titulo}, ${formatarPreco(c.preco)}, ${c.cidade}${c.vendido ? `, ${t('classificados.vendido')}` : ''}`}
      onPress={() => router.push(`/classificados/${c.id}`)}
      style={({ pressed }) => [
        estilos.cartao,
        c.destaque && { borderColor: cores.ouro, borderWidth: 2 },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View>
        <Image
          source={c.fotos[0]}
          style={[estilos.foto, c.vendido && { opacity: 0.4 }]}
          contentFit="cover"
          accessible={false}
        />
        {c.fotos.length > 1 && (
          <View style={[estilos.selo, { right: 6, backgroundColor: cores.superficie }]}>
            <Icone nome="camera" tamanho={14} cor={cores.texto} />
            <Texto variante="pequeno" style={{ color: cores.texto }}>
              {c.fotos.length}
            </Texto>
          </View>
        )}
        {(c.destaque || c.vendido) && (
          <View
            style={[estilos.selo, { left: 6, backgroundColor: c.vendido ? cores.textoApagado : cores.ouro }]}
          >
            <Texto variante="pequeno" style={{ color: cores.fundo, fontFamily: fontes.textoForte }}>
              {c.vendido ? t('classificados.vendido') : t('classificados.destaque')}
            </Texto>
          </View>
        )}
      </View>
      <View style={{ padding: espaco.sm, gap: 2 }}>
        <Texto
          variante="subtitulo"
          style={{ color: c.vendido ? cores.textoApagado : cores.acao }}
          numberOfLines={1}
        >
          {formatarPreco(c.preco)}
        </Texto>
        <Texto variante="corpoForte" numberOfLines={2}>
          {c.titulo}
        </Texto>
        <Texto variante="pequeno" numberOfLines={1}>
          {[c.ano, c.km && `${c.km} km`, c.cidade].filter(Boolean).join(' · ')}
        </Texto>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <FlatList
        data={lista}
        keyExtractor={(c) => c.id}
        numColumns={2}
        columnWrapperStyle={{ gap: espaco.sm }}
        contentContainerStyle={{ padding: espaco.md, gap: espaco.sm, paddingBottom: espaco.xxxl }}
        ListHeaderComponent={
          <View style={{ gap: espaco.sm, marginBottom: espaco.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}>
              <BotaoIcone icone="voltar" rotulo={t('comum.voltar')} onPress={() => router.back()} />
              <Texto variante="titulo" style={{ flex: 1 }}>
                {t('classificados.titulo')}
              </Texto>
            </View>
            <Botao
              titulo={t('classificados.anunciar')}
              icone="mais"
              grande
              onPress={() => router.push('/classificados/novo')}
            />
            <View style={[estilos.busca, { borderColor: cores.linhaForte }]}>
              <Icone nome="busca" tamanho={20} cor={cores.textoSec} />
              <TextInput
                value={busca}
                onChangeText={setBusca}
                placeholder={t('classificados.buscar')}
                placeholderTextColor={cores.textoApagado}
                accessibilityLabel={t('classificados.buscar')}
                style={estilos.entrada}
              />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
              {(['todos', ...categorias, 'favoritos'] as const).map((k) => (
                <Chip
                  key={k}
                  rotulo={t(`classificados.categorias.${k}`)}
                  ativo={cat === k}
                  onPress={() => setCat(k)}
                />
              ))}
            </View>
            <Texto variante="pequeno">{t('classificados.aviso')}</Texto>
          </View>
        }
        ListEmptyComponent={<Texto variante="secundario">{t('busca.nada')}</Texto>}
        renderItem={cartao}
      />
    </SafeAreaView>
  );
}

const criarEstilos = (cores: Paleta) =>
  StyleSheet.create({
    cartao: {
      flex: 1,
      maxWidth: '50%',
      borderRadius: raios.cartao,
      borderWidth: 1,
      borderColor: cores.linha,
      backgroundColor: cores.superficie2,
      overflow: 'hidden',
    },
    foto: { width: '100%', aspectRatio: 1, backgroundColor: cores.superficie3 },
    selo: {
      position: 'absolute',
      top: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: raios.pilula,
    },
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
  });
