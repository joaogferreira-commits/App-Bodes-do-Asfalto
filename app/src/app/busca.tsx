import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buscarEnderecos, buscarNoClube, type Resultado } from '@/busca/buscar';
import { lugaresExemplo, lugaresReais } from '@/dados/exemplos';
import { useViagem } from '@/estado/viagem';
import { servidorConfigurado } from '@/servidor/supabase';
import type { Coordenada } from '@/navegacao/destinos';
import { formatarKm } from '@/rotas/formato';
import { espaco, fontes, raios, toque, useCores, useEstilos, type Paleta } from '@/theme';
import { BotaoIcone, Icone, Pino, Texto } from '@/ui';

/** Busca do mapa: lugares do clube e endereços. Tocar num resultado abre o planejamento da rota. */
export default function Busca() {
  const { t } = useTranslation();
  const cores = useCores();
  const estilos = useEstilos(criarEstilos);
  const viagem = useViagem();
  const [termo, setTermo] = useState('');
  const [perto, setPerto] = useState<Coordenada | null>(null);
  const [enderecos, setEnderecos] = useState<Resultado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [semRede, setSemRede] = useState(false);

  // Posição só se a permissão já foi dada (não pede aqui).
  useEffect(() => {
    void (async () => {
      const { granted } = await Location.getForegroundPermissionsAsync().catch(() => ({ granted: false }));
      if (!granted) return;
      const p = await Location.getLastKnownPositionAsync().catch(() => null);
      if (p) setPerto({ lat: p.coords.latitude, lng: p.coords.longitude });
    })();
  }, []);

  // Endereços: espera o irmão parar de digitar (0,4 s) para não sobrecarregar o servidor.
  useEffect(() => {
    let ativo = true;
    const id = setTimeout(() => {
      if (termo.trim().length < 3) {
        setEnderecos([]);
        return;
      }
      setBuscando(true);
      buscarEnderecos(termo, perto)
        .then((r) => {
          if (!ativo) return;
          setEnderecos(r);
          setSemRede(false);
        })
        .catch(() => ativo && setSemRede(true))
        .finally(() => ativo && setBuscando(false));
    }, 400);
    return () => {
      ativo = false;
      clearTimeout(id);
    };
  }, [termo, perto]);

  const doClube = useMemo(
    () => buscarNoClube(termo, perto, servidorConfigurado ? lugaresReais : lugaresExemplo),
    [termo, perto],
  );
  const resultados = [...doClube, ...enderecos];

  const escolher = (r: Resultado) => {
    viagem.definirBateVolta(null);
    viagem.definirDestino({ chave: 'busca', nome: r.nome, posicao: r.posicao });
    router.replace('/rota');
  };

  const aviso =
    termo.trim().length < 2
      ? t('busca.dica')
      : buscando
        ? t('busca.buscando')
        : semRede
          ? t('busca.semRede')
          : resultados.length === 0 && termo.trim().length >= 3
            ? t('busca.nada')
            : null;

  return (
    <SafeAreaView style={[estilos.tela, { backgroundColor: cores.fundo }]}>
      <View style={estilos.topo}>
        <BotaoIcone icone="voltar" rotulo={t('comum.voltar')} onPress={() => router.back()} />
        <View style={estilos.campo}>
          <Icone nome="busca" tamanho={22} cor={cores.textoSec} />
          <TextInput
            autoFocus
            value={termo}
            onChangeText={setTermo}
            placeholder={t('mapa.busca')}
            placeholderTextColor={cores.textoApagado}
            accessibilityLabel={t('mapa.busca')}
            returnKeyType="search"
            style={estilos.entrada}
          />
          {termo.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('busca.limpar')}
              onPress={() => setTermo('')}
              hitSlop={12}
            >
              <Icone nome="fechar" tamanho={20} cor={cores.textoSec} />
            </Pressable>
          )}
        </View>
      </View>

      {aviso && (
        <Texto variante="secundario" style={estilos.aviso}>
          {aviso}
        </Texto>
      )}

      <FlatList
        data={resultados}
        keyExtractor={(r) => r.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: espaco.xxl }}
        renderItem={({ item, index }) => (
          <>
            {(index === 0 || resultados[index - 1]?.origem !== item.origem) && (
              <Texto variante="rotulo" style={estilos.secao}>
                {t(item.origem === 'clube' ? 'busca.doClube' : 'busca.enderecos')}
              </Texto>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.nome}${item.detalhe ? `, ${item.detalhe}` : ''}`}
              onPress={() => escolher(item)}
              style={({ pressed }) => [estilos.item, pressed && { backgroundColor: cores.superficie2 }]}
            >
              <View style={estilos.icone}>
                {item.tipo ? (
                  <Pino tipo={item.tipo} descricao={item.nome} tamanho={36} />
                ) : (
                  <Icone nome="localizacao" tamanho={26} cor={cores.textoSec} />
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Texto variante="corpoForte" numberOfLines={1}>
                  {item.nome}
                </Texto>
                {!!item.detalhe && (
                  <Texto variante="secundario" numberOfLines={1}>
                    {item.detalhe}
                  </Texto>
                )}
              </View>
              {item.distanciaKm != null && (
                <Texto variante="secundario">{t('rota.km', { km: formatarKm(item.distanciaKm) })}</Texto>
              )}
            </Pressable>
          </>
        )}
      />
      <Texto variante="pequeno" style={estilos.fonte}>
        {t('busca.fonte')}
      </Texto>
    </SafeAreaView>
  );
}

const criarEstilos = (cores: Paleta) =>
  StyleSheet.create({
    tela: { flex: 1 },
    topo: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs, padding: espaco.md },
    campo: {
      flex: 1,
      minHeight: toque.botaoGrande,
      flexDirection: 'row',
      alignItems: 'center',
      gap: espaco.xs,
      paddingHorizontal: espaco.md,
      borderRadius: raios.botao,
      borderWidth: 2,
      borderColor: cores.acao,
      backgroundColor: cores.superficie,
    },
    entrada: {
      flex: 1,
      fontSize: 17,
      fontFamily: fontes.textoMedio,
      color: cores.texto,
      paddingVertical: 10,
    },
    aviso: { paddingHorizontal: espaco.lg, paddingBottom: espaco.sm },
    secao: { paddingHorizontal: espaco.lg, paddingTop: espaco.md, paddingBottom: espaco.xs },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: espaco.sm,
      minHeight: 64,
      paddingHorizontal: espaco.lg,
      paddingVertical: espaco.xs,
      borderBottomWidth: 1,
      borderBottomColor: cores.linhaSuave,
    },
    icone: { width: 44, alignItems: 'center' },
    fonte: { textAlign: 'center', padding: espaco.xs },
  });
