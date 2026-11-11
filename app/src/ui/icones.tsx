import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { cores } from '@/theme';

/** Ícones de traço duotom (creme + destaque), redesenhados da referência IconesPatch/lote 17. */
export type NomeIcone = 'mapa' | 'feed' | 'passeios' | 'conquistas' | 'perfil';

type Props = { nome: NomeIcone; tamanho?: number; cor?: string; destaque?: string };

export function Icone({ nome, tamanho = 26, cor = cores.creme, destaque = cores.laranja }: Props) {
  const t = {
    stroke: cor,
    strokeWidth: 2,
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const;
  const d = { ...t, stroke: destaque };
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" accessible={false}>
      {nome === 'mapa' && (
        <>
          <Path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" {...t} />
          <Path d="M9 4v14M15 6v14" {...t} strokeOpacity={0.5} />
          <Path d="M5 15c3-1 5 1 8-2s4-3 6-3" {...d} strokeDasharray="2 2.5" />
        </>
      )}
      {nome === 'feed' && (
        <>
          <Rect x="3" y="4" width="18" height="16" rx="3" {...t} />
          <Path d="M3 17l5-5 4 4 3-3 6 6" {...t} />
          <Circle cx="16" cy="9" r="2" {...d} />
        </>
      )}
      {nome === 'passeios' && (
        <>
          <Rect x="3" y="5" width="18" height="16" rx="3" {...t} />
          <Path d="M3 10h18" {...d} />
          <Path d="M8 3v4M16 3v4" {...t} />
          <Circle cx="9" cy="16" r="2" {...t} />
          <Circle cx="16" cy="16" r="2" {...t} />
          <Path d="M9 16l3-3h3l1 3" {...d} />
        </>
      )}
      {nome === 'conquistas' && (
        <>
          <Path d="M8 3l4 6 4-6" {...d} />
          <Circle cx="12" cy="15" r="6" {...t} />
          <Path d="M12 12l1 2h2l-1.6 1.3.6 2.2-2-1.3-2 1.3.6-2.2L9 14h2z" {...t} strokeWidth={1.4} />
        </>
      )}
      {nome === 'perfil' && (
        <>
          <Path d="M5 14a7 7 0 0114 0v2H5z" {...t} />
          <Path d="M5 12h14" {...d} />
          <Path d="M8 16v3a2 2 0 002 2h4a2 2 0 002-2v-3" {...t} />
        </>
      )}
    </Svg>
  );
}
