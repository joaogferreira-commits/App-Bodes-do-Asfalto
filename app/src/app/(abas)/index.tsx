import {
  Camera,
  Map,
  Marker,
  type CameraRef,
  type StyleSpecification,
} from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { filtrar, type Filtro } from '@/dados/exemplos';
import { useViagem } from '@/estado/viagem';
import estilo from '@/map/estilo-bodes.json';
import { postoExemplo } from '@/navegacao/destinos';
import { cores, espaco, raios, sombra } from '@/theme';
import { Avatar, Botao, BotaoIcone, Icone, PainelInferior, Pino, Texto } from '@/ui';

const CUIABA: [number, number] = [-56.0861, -15.5895];

const filtros: { chave: Filtro; cor?: string }[] = [
  { chave: 'tudo' },
  { chave: 'irmaos', cor: cores.acao },
  { chave: 'postos', cor: cores.verdePosto },
  { chave: 'sedes', cor: cores.ouro },
  { chave: 'lojas', cor: cores.azulRio },
];

function LinhaLegenda({ terra, rota, texto }: { terra?: boolean; rota?: boolean; texto: string }) {
  const cor = rota ? cores.acao : terra ? cores.terra : cores.asfalto;
  return (
    <View style={estilos.linhaLegenda}>
      <View style={[estilos.amostra, { backgroundColor: terra && !rota ? cores.terraEscura : cor }]}>
        {terra && (
          <View style={estilos.tracejado}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[estilos.traco, { backgroundColor: rota ? cores.rotaTerra : cores.terra }]}
              />
            ))}
          </View>
        )}
      </View>
      <Texto variante="pequeno" style={{ color: cores.texto }}>
        {texto}
      </Texto>
    </View>
  );
}

export default function Mapa() {
  const { t } = useTranslation();
  const camera = useRef<CameraRef>(null);
  const [filtro, setFiltro] = useState<Filtro>('tudo');
  const [legenda, setLegenda] = useState(false);
  const { definirDestino } = useViagem();
  const { lugares, irmaos } = useMemo(() => filtrar(filtro), [filtro]);
  const contagem = {
    irmaos: irmaos.length,
    sedes: lugares.filter((l) => l.tipo === 'sede').length,
    pontos: lugares.length,
  };

  const irParaMim = async () => {
    const { granted } = await Location.requestForegroundPermissionsAsync().catch(() => ({ granted: false }));
    if (!granted) return;
    const p = await Location.getCurrentPositionAsync({}).catch(() => null);
    if (p)
      camera.current?.flyTo({ center: [p.coords.longitude, p.coords.latitude], zoom: 13, duration: 900 });
  };

  const irAoPosto = () => {
    definirDestino(postoExemplo);
    router.push('/rota');
  };

  return (
    <View style={estilos.tela}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={estilo as unknown as StyleSpecification}
        logo={false}
        attribution
        attributionPosition={{ bottom: 330, left: 8 }}
      >
        <Camera ref={camera} initialViewState={{ center: CUIABA, zoom: 11 }} />
        {lugares.map((l) => (
          <Marker key={l.id} id={l.id} lngLat={[l.lng, l.lat]} anchor="top">
            <Pino tipo={l.tipo} rotulo={l.rotulo} descricao={`${l.nome}${l.rotulo ? `, ${l.rotulo}` : ''}`} />
          </Marker>
        ))}
        {irmaos.map((i) => (
          <Marker key={i.id} id={i.id} lngLat={[i.lng, i.lat]}>
            <Avatar nome={i.nome} status={i.status} tamanho={44} />
          </Marker>
        ))}
      </Map>

      <SafeAreaView edges={['top']} style={estilos.topo} pointerEvents="box-none">
        <View style={estilos.linhaBusca}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('mapa.busca')}
            onPress={() => router.push('/rota')}
            style={estilos.busca}
          >
            <Icone nome="busca" tamanho={20} cor={cores.textoSec} />
            <Texto style={{ color: cores.textoSec, fontSize: 16 }}>{t('mapa.busca')}</Texto>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('mapa.meuPerfil')}
            onPress={() => router.navigate('/perfil')}
            style={estilos.botaoPerfil}
          >
            <Avatar nome="Irmão Teste" status="aberto" tamanho={34} />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.filtros}>
          {filtros.map((f) => (
            <FiltroChip
              key={f.chave}
              rotulo={t(`mapa.filtros.${f.chave}`)}
              cor={f.cor}
              ativo={filtro === f.chave}
              onPress={() => setFiltro(f.chave)}
            />
          ))}
        </ScrollView>
        <View style={estilos.lateral} pointerEvents="box-none">
          <BotaoIcone
            icone="visivel"
            corIcone={cores.acao}
            legenda={t('mapa.aprox')}
            rotulo={t('mapa.visibilidade')}
            flutuante
            onPress={() => Alert.alert(t('mapa.visibilidade'), t('mapa.visibilidadeTexto'))}
          />
          <BotaoIcone
            icone="camadas"
            rotulo={t('mapa.camadas')}
            flutuante
            onPress={() => setLegenda((v) => !v)}
          />
          <BotaoIcone icone="localizacao" rotulo={t('mapa.minhaLocalizacao')} flutuante onPress={irParaMim} />
        </View>
        {legenda && (
          <View style={estilos.legenda} accessibilityLabel={t('mapa.camadas')}>
            <LinhaLegenda texto={t('mapa.legendaAsfalto')} />
            <LinhaLegenda terra texto={t('mapa.legendaTerra')} />
            <LinhaLegenda rota texto={t('mapa.legendaRota')} />
            <LinhaLegenda rota terra texto={t('mapa.legendaRotaTerra')} />
            <Texto variante="pequeno" style={{ maxWidth: 210 }}>
              {t('mapa.dadosExemplo')}
            </Texto>
          </View>
        )}
      </SafeAreaView>

      <PainelInferior style={estilos.painel}>
        <View style={estilos.nestaArea}>
          <Texto variante="rotulo">{t('mapa.nestaArea')}</Texto>
          <Texto variante="secundario">{t('mapa.contagem', contagem)}</Texto>
        </View>

        <View style={estilos.cartaoAgape}>
          <View style={estilos.iconeAgape}>
            <Icone nome="agape" tamanho={26} cor={cores.ouro} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Texto variante="rotulo" style={{ color: cores.ouro, fontSize: 13 }} numberOfLines={1}>
              {t('mapa.agapeRotulo', { tempo: '1h20' })}
            </Texto>
            <Texto variante="corpoForte" numberOfLines={1}>
              {t('mapa.agapeTitulo')}
            </Texto>
            <Texto variante="secundario" numberOfLines={1}>
              {t('mapa.agapeTexto')}
            </Texto>
          </View>
          <Botao
            titulo={t('mapa.vou')}
            onPress={() => Alert.alert(t('comum.emBreve'), t('mapa.agapeTextoAviso'))}
          />
        </View>

        <View style={estilos.postos}>
          <View style={{ flex: 1 }}>
            <Botao
              titulo={t('mapa.postoProximo')}
              variante="secundario"
              icone="posto"
              corIcone={cores.verdePosto}
              onPress={irAoPosto}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Botao
              titulo={t('mapa.postoNaRota')}
              variante="secundario"
              icone="postoRota"
              corIcone={cores.verdePosto}
              onPress={irAoPosto}
            />
          </View>
        </View>
      </PainelInferior>
    </View>
  );
}

function FiltroChip({
  rotulo,
  cor,
  ativo,
  onPress,
}: {
  rotulo: string;
  cor?: string;
  ativo: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      accessibilityLabel={rotulo}
      onPress={onPress}
      hitSlop={6}
      style={[estilos.chip, ativo ? { backgroundColor: cores.texto } : estilos.chipInativo]}
    >
      {cor && !ativo && <View style={[estilos.ponto, { backgroundColor: cor }]} />}
      <Texto
        style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: ativo ? cores.fundo : cores.texto }}
      >
        {rotulo}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.chao },
  topo: { position: 'absolute', top: 0, left: 0, right: 0 },
  linhaBusca: { flexDirection: 'row', gap: 10, paddingHorizontal: espaco.md, paddingTop: espaco.xs },
  busca: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: espaco.md,
    backgroundColor: 'rgba(22,18,14,0.94)',
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: raios.botao,
    boxShadow: sombra.flutuante,
  },
  botaoPerfil: {
    width: 48,
    height: 48,
    borderRadius: raios.botao,
    borderWidth: 1,
    borderColor: cores.linha,
    backgroundColor: 'rgba(22,18,14,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtros: { gap: espaco.xs, paddingHorizontal: espaco.md, paddingVertical: espaco.sm },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: raios.pilula,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipInativo: { backgroundColor: 'rgba(22,18,14,0.92)', borderWidth: 1, borderColor: cores.linhaForte },
  ponto: { width: 8, height: 8, borderRadius: 4 },
  lateral: { position: 'absolute', right: espaco.md, top: 128, gap: espaco.xs, alignItems: 'flex-end' },
  legenda: {
    alignSelf: 'flex-start',
    marginLeft: espaco.md,
    marginTop: espaco.xs,
    backgroundColor: 'rgba(11,9,7,0.9)',
    borderRadius: 12,
    padding: espaco.sm,
    gap: espaco.xs,
  },
  linhaLegenda: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amostra: { width: 34, height: 7, borderRadius: 4, overflow: 'hidden', justifyContent: 'center' },
  tracejado: { flexDirection: 'row', gap: 4, paddingHorizontal: 2 },
  traco: { width: 5, height: 3, borderRadius: 2 },
  painel: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: espaco.md, gap: 10 },
  nestaArea: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  cartaoAgape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    backgroundColor: cores.superficie2,
    borderRadius: raios.cartao,
    borderWidth: 1,
    borderColor: cores.linha,
    padding: 14,
  },
  iconeAgape: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(216,169,59,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postos: { flexDirection: 'row', gap: 10 },
});
