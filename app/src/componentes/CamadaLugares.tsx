import { GeoJSONSource, Images, Layer, type GeoJSONSourceRef } from '@maplibre/maplibre-react-native';
import { useRef } from 'react';

import type { LugarExemplo } from '@/dados/exemplos';
import { agrupamento, imagensPinos, lugaresGeoJSON, tamanhoPino, ZOOM_EMBLEMA } from '@/map/lugares';
import { useCores } from '@/theme';
import { pinos, type TipoPino } from '@/ui';

type Props = {
  lugares: LugarExemplo[];
  aoTocarLugar: (id: string) => void;
  aoTocarGrupo: (centro: [number, number], zoom: number) => void;
};

type EventoToque = {
  nativeEvent: {
    features?: { properties?: Record<string, unknown>; geometry?: { coordinates?: unknown } }[];
  };
};

/**
 * Lugares do mapa como camadas nativas (rápidas): emblemas que diminuem de longe e se agrupam
 * num círculo com a contagem ao afastar. Sede, SOS, socorro e alertas nunca se agrupam.
 */
export function CamadaLugares({ lugares, aoTocarLugar, aoTocarGrupo }: Props) {
  const cores = useCores();
  const fonte = useRef<GeoJSONSourceRef>(null);
  const dados = lugaresGeoJSON(lugares);

  const tocar = async (e: EventoToque) => {
    const f = e.nativeEvent.features?.[0];
    const p = f?.properties ?? {};
    if (p.cluster && typeof p.cluster_id === 'number') {
      const zoom = await fonte.current?.getClusterExpansionZoom(p.cluster_id).catch(() => null);
      const c = f?.geometry?.coordinates as [number, number] | undefined;
      if (c) aoTocarGrupo(c, zoom ?? 12);
      return;
    }
    if (typeof p.id === 'string') aoTocarLugar(p.id);
  };

  /** Cor do pontinho por tipo (de longe o emblema vira um ponto, R44). */
  const corPorTipo = [
    'match',
    ['get', 'tipo'],
    ...(Object.keys(pinos) as TipoPino[]).flatMap((tp) => [tp, cores[pinos[tp].cor]]),
    cores.acao,
  ];

  const ponto = (id: string, filtro?: unknown[]) => (
    <Layer
      id={id}
      type="circle"
      maxzoom={ZOOM_EMBLEMA}
      {...(filtro ? { filter: filtro as never } : {})}
      paint={{
        'circle-color': corPorTipo as never,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 3, ZOOM_EMBLEMA, 6] as never,
        'circle-stroke-color': cores.superficie,
        'circle-stroke-width': 1.5,
      }}
    />
  );

  const simbolo = (id: string, filtro?: unknown[]) => (
    <Layer
      id={id}
      type="symbol"
      minzoom={ZOOM_EMBLEMA}
      {...(filtro ? { filter: filtro as never } : {})}
      layout={{
        'icon-image': ['concat', 'pino-', ['get', 'tipo']],
        'icon-size': tamanhoPino as never,
        'icon-anchor': 'bottom',
        'icon-allow-overlap': true,
        'symbol-sort-key': ['get', 'prioridade'],
        'text-field': ['step', ['zoom'], '', 12, ['get', 'rotulo']],
        'text-font': ['Noto Sans Bold'],
        'text-size': 13,
        'text-anchor': 'top',
        'text-offset': [0, 0.2],
        'text-optional': true,
      }}
      paint={{ 'text-color': cores.texto, 'text-halo-color': cores.superficie, 'text-halo-width': 2 }}
    />
  );

  return (
    <>
      <Images images={imagensPinos} />
      <GeoJSONSource
        ref={fonte}
        id="lugares-agrupaveis"
        data={dados.agrupaveis as never}
        {...agrupamento}
        onPress={(e) => void tocar(e as unknown as EventoToque)}
      >
        <Layer
          id="grupos-circulo"
          type="circle"
          filter={['has', 'point_count']}
          paint={{
            'circle-color': cores.superficie,
            'circle-stroke-color': cores.acao,
            'circle-stroke-width': 3,
            'circle-radius': ['step', ['get', 'point_count'], 18, 5, 22, 15, 28],
          }}
        />
        <Layer
          id="grupos-numero"
          type="symbol"
          filter={['has', 'point_count']}
          layout={{
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['Noto Sans Bold'],
            'text-size': 15,
          }}
          paint={{ 'text-color': cores.texto }}
        />
        {ponto('lugares-soltos-ponto', ['!', ['has', 'point_count']])}
        {simbolo('lugares-soltos', ['!', ['has', 'point_count']])}
      </GeoJSONSource>
      <GeoJSONSource
        id="lugares-fixos"
        data={dados.fixos as never}
        onPress={(e) => void tocar(e as unknown as EventoToque)}
      >
        {ponto('lugares-fixos-ponto')}
        {simbolo('lugares-fixos-simbolo')}
      </GeoJSONSource>
    </>
  );
}
