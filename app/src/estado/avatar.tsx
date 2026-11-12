import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/** Avatar "montado" do irmão (Etapa 1: montar; avatar por IA na Etapa 8). Guardado no aparelho por enquanto. */
export type OpcoesAvatar = {
  fundo: number;
  pele: number;
  capacete: number;
  barba: number;
  oculos: number;
};

export const opcoesAvatar = {
  fundo: ['#E8692A', '#D8A93B', '#6F95B8', '#3FA27A', '#8C857B', '#C62D22'],
  pele: ['#F1C9A5', '#D9A47A', '#B07A52', '#7A4E30'],
  capacete: ['#141110', '#EFE3C8', '#E8692A', '#C62D22', '#2F5E86', '#3A4A2E'],
  barba: ['nenhuma', 'curta', 'cheia', 'grisalha'],
  oculos: ['nenhum', 'escuro', 'aviador'],
} as const;

/** Avatar ilustrado estável para cada nome (irmãos sem foto): mesmo nome → mesmo desenho. */
export function avatarDoNome(nome: string): OpcoesAvatar {
  let h = 0;
  for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pega = (n: number, d: number) => Math.floor(h / d) % n;
  return {
    fundo: pega(opcoesAvatar.fundo.length, 1),
    pele: pega(opcoesAvatar.pele.length, 7),
    capacete: pega(opcoesAvatar.capacete.length, 53),
    barba: pega(opcoesAvatar.barba.length, 397),
    oculos: pega(opcoesAvatar.oculos.length, 2777),
  };
}

export const avatarPadrao: OpcoesAvatar = { fundo: 0, pele: 1, capacete: 0, barba: 2, oculos: 1 };

const CHAVE = 'bodes.avatar';

type Valor = { avatar: OpcoesAvatar | null; salvar: (a: OpcoesAvatar) => void };
const Contexto = createContext<Valor>({ avatar: null, salvar: () => undefined });

export function ProvedorAvatar({ children }: { children: ReactNode }) {
  const [avatar, setAvatar] = useState<OpcoesAvatar | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(CHAVE)
      .then((v) => v && setAvatar({ ...avatarPadrao, ...(JSON.parse(v) as OpcoesAvatar) }))
      .catch(() => undefined);
  }, []);
  const valor = useMemo<Valor>(
    () => ({
      avatar,
      salvar: (a) => {
        setAvatar(a);
        void AsyncStorage.setItem(CHAVE, JSON.stringify(a)).catch(() => undefined);
      },
    }),
    [avatar],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export const useAvatar = () => useContext(Contexto);
