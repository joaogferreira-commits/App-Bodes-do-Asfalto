import Svg, { Path } from 'react-native-svg';

import { useCores } from '@/theme';

/**
 * Conjunto de ícones da Interface v2: traço 1,8, grade 24, cantos redondos.
 * Fonte: docs/telas/v2/Sistema.dc.html. Nunca usar emoji.
 */
export const caminhosIcones = {
  mapa: ['M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z', 'M9 4v14M15 6v14'],
  feed: [
    'M7 4h10a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3z',
    'M4 15l4.5-4 4 3.5L16 11l4 3.5',
  ],
  passeios: [
    'M6 5h12a2.5 2.5 0 012.5 2.5v10A2.5 2.5 0 0118 20H6a2.5 2.5 0 01-2.5-2.5v-10A2.5 2.5 0 016 5z',
    'M3.5 10h17M8 3v4M16 3v4',
  ],
  conquistas: ['M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19l1-5.8L3.5 9.2l5.9-.9z'],
  perfil: ['M5 13a7 7 0 0114 0v1H5z', 'M5 11h14', 'M8 14v3.5A2.5 2.5 0 0010.5 20h3a2.5 2.5 0 002.5-2.5V14'],
  busca: ['M11 4.5a6.5 6.5 0 110 13 6.5 6.5 0 010-13z', 'M16 16l4 4'],
  visivel: [
    'M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z',
    'M12 9a3 3 0 110 6 3 3 0 010-6z',
  ],
  camadas: ['M12 3l9 5-9 5-9-5 9-5z', 'M3 13l9 5 9-5'],
  localizacao: ['M12 5a7 7 0 110 14 7 7 0 010-14z', 'M12 2v3M12 19v3M2 12h3M19 12h3'],
  posto: ['M5 20V5a1 1 0 011-1h7a1 1 0 011 1v15', 'M4 20h11M7 8h5', 'M14 10h2l2 2v5a1.5 1.5 0 003 0V9l-3-3'],
  postoRota: [
    'M6 20c0-6 12-6 12-12',
    'M6 18.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z',
    'M18 2.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5z',
  ],
  alerta: ['M12 3l9.5 17h-19z', 'M12 10v4M12 17v.5'],
  reagrupar: [
    'M8 6.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM16 6.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5z',
    'M3.5 19a4.5 4.5 0 019 0M11.5 19a4.5 4.5 0 019 0',
  ],
  asfalto: ['M8 3L5 21M16 3l3 18', 'M12 5v3M12 11v3M12 17v3'],
  misto: ['M8 3L5 21', 'M16 3l17.4 9M17.9 15l1.1 6', 'M12 5v3M12 11v3'],
  terra: ['M8 3L7.2 7.8M6.6 11.4L5.8 16.2M5.3 19.2L5 21', 'M16 3l.8 4.8M17.4 11.4l.8 4.8M18.7 19.2L19 21'],
  navegar: ['M12 2l7 19-7-4-7 4z'],
  voz: ['M4 10v4h4l5 4V6L8 10z', 'M16 9a4 4 0 010 6M18.5 6.5a7.5 7.5 0 010 11'],
  bateria: ['M3 8h15a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V9a1 1 0 011-1z', 'M21 11v2', 'M5 11h6v2H5z'],
  sede: ['M4 11l8-6 8 6v8H4z', 'M10 19v-5h4v5'],
  loja: ['M3 9l9-5 9 5', 'M5 9v9M10 9v9M14 9v9M19 9v9M3 20h18'],
  agape: [
    'M5 8h7v10a2 2 0 01-2 2H7a2 2 0 01-2-2V8z',
    'M12 10h2a2 2 0 010 4h-2',
    'M7 5c0-1 1-2 2-2M10 5c0-1 1-2 2-2',
  ],
  socorro: ['M7 12l3 3 7-7', 'M12 21s-8-4.5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 6.5-8 11-8 11z'],
  oficina: ['M14.5 6.5a4 4 0 00-5.4 5.2L4 16.8 7.2 20l5.1-5.1a4 4 0 005.2-5.4l-2.3 2.3-2.4-.6-.6-2.4z'],
  aceno: [
    'M8 13V6.5a1.5 1.5 0 013 0V12M11 11V5a1.5 1.5 0 013 0v6M14 11V6.5a1.5 1.5 0 013 0V14a6 6 0 01-6 6h-.5a5 5 0 01-4-2L4 14.5a1.5 1.5 0 012.3-2L8 14',
  ],
  sos: ['M12 3a9 9 0 110 18 9 9 0 010-18z', 'M12 8v5M12 16v.5'],
  voltar: ['M15 5l-7 7 7 7'],
  fechar: ['M6 6l12 12M18 6L6 18'],
  mais: ['M12 5v14M5 12h14'],
  camera: [
    'M4 8h3l2-3h6l2 3h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z',
    'M12 10a3.5 3.5 0 110 7 3.5 3.5 0 010-7z',
  ],
  video: ['M3 7h12a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1z', 'M16 11l6-3v8l-6-3'],
  enquete: ['M5 20V10M12 20V4M19 20v-7'],
  calendario: ['M4 6h16v14H4z', 'M4 10h16M8 3v4M16 3v4'],
  comentario: ['M4 5h16v11H9l-5 4z'],
  compartilhar: ['M12 15V3M7 8l5-5 5 5', 'M5 13v7h14v-7'],
  opcoes: ['M5 12h.01M12 12h.01M19 12h.01'],
  grade: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  editar: ['M4 20h4L19 9l-4-4L4 16v4z', 'M13.5 6.5l4 4'],
  cadeado: ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 017 0v3'],
  rota: [
    'M6 19a2 2 0 100-4 2 2 0 000 4zM18 9a2 2 0 100-4 2 2 0 000 4z',
    'M8 17h7a3 3 0 000-6H9a3 3 0 010-6h7',
  ],
  trofeu: ['M8 4h8v5a4 4 0 01-8 0z', 'M8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4', 'M12 13v4M9 20h6M10 17h4'],
  menos: ['M5 12h14'],
  sol: [
    'M12 8a4 4 0 110 8 4 4 0 010-8z',
    'M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  ],
  lua: ['M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z'],
  auto: ['M12 3a9 9 0 110 18 9 9 0 010-18z', 'M12 3v18', 'M12 7a5 5 0 010 10'],
  salvar: ['M6 3h12v18l-6-4-6 4z'],
  encerrar: ['M8 6h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z'],
  direita: ['M7 21V12a4 4 0 014-4h8', 'M15 4l4 4-4 4'],
  configuracoes: [
    'M12 9a3 3 0 110 6 3 3 0 010-6z',
    'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4',
  ],
  moto: [
    'M5.5 13a3.5 3.5 0 110 7 3.5 3.5 0 010-7zM18.5 13a3.5 3.5 0 110 7 3.5 3.5 0 010-7z',
    'M5.5 16.5L9 10h5l4.5 6.5M14 10l-2-3h-2M14 10h3l1.5 2',
  ],
} as const;

export type NomeIcone = keyof typeof caminhosIcones;

type Props = { nome: NomeIcone; tamanho?: number; cor?: string; espessura?: number };

export function Icone({ nome, tamanho = 24, cor, espessura = 2 }: Props) {
  const c = useCores();
  const traco = cor ?? c.texto;
  const preenchido = nome === 'navegar';
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" accessible={false}>
      {caminhosIcones[nome].map((d) => (
        <Path
          key={d}
          d={d}
          stroke={traco}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={preenchido ? traco : 'none'}
        />
      ))}
    </Svg>
  );
}
