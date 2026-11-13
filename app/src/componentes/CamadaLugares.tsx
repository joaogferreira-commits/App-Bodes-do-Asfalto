import { GeoJSONSource, Images, Layer, type GeoJSONSourceRef } from '@maplibre/maplibre-react-native';
import { useRef } from 'react';

import type { LugarExemplo } from '@/dados/exemplos';
import {
  agrupamento,
  imagensPinos,
  lugaresGeoJSON,
  tamanhoPino,
  ZOOM_EMBLEMA,
  ZOOM_EMBLEMA_LUGARES,
} from '@/map/lugares';
import type { Area } from '@/servidor/pontos';
import { useCores } from '@/theme';
import { pinos, type TipoPino } from '@/ui';

type Props = {
  lugares: LugarExemplo[];
  aoTocarLugar: (id: string) => void;
  aoTocarGrupo: (centro: [number, number], zoom: number) => void;
  /** Área visível: limita os emblemas a ~20 (o resto fica como pontinho). */
  area?: Area;
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
export function CamadaLugares({ lugares, aoTocarLugar, aoTocarGrupo, area }: Props) {
  const cores = useCores();
  const fonte = useRef<GeoJSONSourceRef>(null);
  const dados = lugaresGeoJSON(lugares, { area });
  const idsEmblemas = dados.emblemas.features.map((f) => f.properties.id);

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

  const ponto = (id: string, maxzoom: number, filtro?: unknown[]) => (
    <Layer
      id={id}
      type="circle"
      {...(maxzoom < 24 ? { maxzoom } : {})}
      {...(filtro ? { filter: filtro as never } : {})}
      paint={{
        'circle-color': corPorTipo as never,
        'circle-radius': 5,
        'circle-stroke-color': cores.superficie,
        'circle-stroke-width': 1.5,
      }}
    />
  );

  const simbolo = (id: string, minzoom: number, filtro?: unknown[]) => (
    <Layer
      id={id}
      type="symbol"
      minzoom={minzoom}
      {...(filtro ? { filter: filtro as never } : {})}
      layout={{
        'icon-image': ['concat', 'pino-', ['get', 'tipo']],
        'icon-size': tamanhoPino as never,
        'icon-anchor': 'bottom',
        'icon-allow-overlap': true,
        'symbol-sort-key': ['get', 'prioridade'],
        'text-field': ['step', ['zoom'], '', ZOOM_EMBLEMA_LUGARES, ['get', 'rotulo']],
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
        {/* Pontinho de cada lugar; de perto some só o que já virou emblema. */}
        {ponto('lugares-soltos-ponto', 24, [
          'all',
          ['!', ['has', 'point_count']],
          [
            'any',
            ['<', ['zoom'], ZOOM_EMBLEMA_LUGARES],
            ['!', ['in', ['get', 'id'], ['literal', idsEmblemas]]],
          ],
        ])}
      </GeoJSONSource>
      <GeoJSONSource
        id="lugares-emblemas"
        data={dados.emblemas as never}
        onPress={(e) => void tocar(e as unknown as EventoToque)}
      >
        {simbolo('lugares-soltos', ZOOM_EMBLEMA_LUGARES)}
      </GeoJSONSource>
      <GeoJSONSource
        id="lugares-fixos"
        data={dados.fixos as never}
        onPress={(e) => void tocar(e as unknown as EventoToque)}
      >
        {ponto('lugares-fixos-ponto', ZOOM_EMBLEMA)}
        {simbolo('lugares-fixos-simbolo', ZOOM_EMBLEMA)}
      </GeoJSONSource>
    </>
  );
}
