import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { opcoesAvatar, type OpcoesAvatar } from '@/estado/avatar';

/** Desenho do avatar montado: piloto de capacete aberto, com barba e óculos opcionais (vetor, sem imagem). */
export function AvatarMontado({ opcoes, tamanho = 96 }: { opcoes: OpcoesAvatar; tamanho?: number }) {
  const fundo = opcoesAvatar.fundo[opcoes.fundo] ?? opcoesAvatar.fundo[0];
  const pele = opcoesAvatar.pele[opcoes.pele] ?? opcoesAvatar.pele[0];
  const capacete = opcoesAvatar.capacete[opcoes.capacete] ?? opcoesAvatar.capacete[0];
  const barba = opcoesAvatar.barba[opcoes.barba] ?? 'nenhuma';
  const oculos = opcoesAvatar.oculos[opcoes.oculos] ?? 'nenhum';
  const corBarba = barba === 'grisalha' ? '#CFC8BE' : '#3A2A1E';
  const faixa = capacete === '#EFE3C8' ? '#E8692A' : '#EFE3C8';
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 100 100" accessible={false}>
      <Defs>
        <ClipPath id="circulo">
          <Circle cx="50" cy="50" r="48" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#circulo)">
        <Rect width="100" height="100" fill={fundo} />
        {/* colete */}
        <Path d="M12 100 C14 80 30 74 50 74 C70 74 86 80 88 100 Z" fill="#1F1A15" />
        <Path d="M42 74 L50 92 L58 74" fill="none" stroke="#5A4A3A" strokeWidth="3" />
        {/* capacete */}
        <Path d="M23 60 C21 30 36 18 50 18 C64 18 79 30 77 60 Z" fill={capacete} />
        <Rect x="46" y="18" width="8" height="24" fill={faixa} opacity={0.9} />
        {/* rosto */}
        <Path d="M31 50 C31 38 69 38 69 50 L69 60 C69 74 60 80 50 80 C40 80 31 74 31 60 Z" fill={pele} />
        {/* barba */}
        {barba !== 'nenhuma' && (
          <Path
            d={
              barba === 'curta'
                ? 'M33 62 C36 76 44 80 50 80 C56 80 64 76 67 62 C62 70 56 71 50 71 C44 71 38 70 33 62 Z'
                : 'M31 58 C31 82 42 88 50 88 C58 88 69 82 69 58 C64 70 57 72 50 72 C43 72 36 70 31 58 Z'
            }
            fill={corBarba}
          />
        )}
        {barba !== 'nenhuma' && (
          <Path
            d="M41 66 C45 63 55 63 59 66"
            stroke={corBarba}
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        )}
        {barba === 'nenhuma' && (
          <Path
            d="M44 69 C47 71 53 71 56 69"
            stroke="#5A3A2A"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        )}
        {/* olhos ou óculos */}
        {oculos === 'nenhum' ? (
          <>
            <Circle cx="42" cy="54" r="2.4" fill="#2A1E16" />
            <Circle cx="58" cy="54" r="2.4" fill="#2A1E16" />
          </>
        ) : (
          <>
            <Rect
              x="33"
              y="49"
              width="15"
              height="10"
              rx={oculos === 'aviador' ? 5 : 2}
              fill={oculos === 'aviador' ? '#6B4A2A' : '#141110'}
            />
            <Rect
              x="52"
              y="49"
              width="15"
              height="10"
              rx={oculos === 'aviador' ? 5 : 2}
              fill={oculos === 'aviador' ? '#6B4A2A' : '#141110'}
            />
            <Path d="M48 53 L52 53" stroke="#141110" strokeWidth="2" />
          </>
        )}
      </G>
      <Circle cx="50" cy="50" r="47" fill="none" stroke="#141110" strokeWidth="2" />
    </Svg>
  );
}
