import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { Visibilidade } from '@/dados/perfil';

/**
 * Perfil, garagem e contatos de emergência do irmão (Etapa 1), guardados no aparelho até o Supabase
 * (tabelas perfis, motos, contatos_emergencia, perfil_macom). Contatos e dados maçônicos nunca saem
 * do aparelho sem o servidor com RLS.
 */
export type Moto = {
  id: string;
  marca: string;
  modelo: string;
  ano: string;
  apelido: string;
  km: string;
  foto?: string;
  principal: boolean;
};
export type Contato = { id: string; nome: string; telefone: string };
export type CampoMacom = { valor: string; visibilidade: Visibilidade };
export type MeuPerfil = {
  nome: string;
  apelido: string;
  cidade: string;
  foto?: string;
  macom: { loja: CampoMacom; oriente: CampoMacom; potencia: CampoMacom };
};

export const MAX_CONTATOS = 3;

const perfilVazio: MeuPerfil = {
  nome: '',
  apelido: '',
  cidade: '',
  macom: {
    loja: { valor: '', visibilidade: 'ninguem' },
    oriente: { valor: '', visibilidade: 'ninguem' },
    potencia: { valor: '', visibilidade: 'ninguem' },
  },
};

type Dados = { perfil: MeuPerfil; motos: Moto[]; contatos: Contato[] };

type Valor = Dados & {
  salvarPerfil: (p: Partial<MeuPerfil>) => void;
  apagarMacom: () => void;
  salvarMoto: (m: Omit<Moto, 'id' | 'principal'> & { id?: string }) => void;
  apagarMoto: (id: string) => void;
  tornarPrincipal: (id: string) => void;
  motoPrincipal: Moto | undefined;
  salvarContato: (c: Omit<Contato, 'id'> & { id?: string }) => boolean;
  apagarContato: (id: string) => void;
};

const CHAVE = 'bodes.perfil';
const Contexto = createContext<Valor | null>(null);

/** Só uma moto principal; a primeira cadastrada vira principal. */
export function normalizarPrincipal(motos: Moto[]): Moto[] {
  if (!motos.length) return motos;
  const idx = Math.max(
    0,
    motos.findIndex((m) => m.principal),
  );
  return motos.map((m, i) => ({ ...m, principal: i === idx }));
}

export function ProvedorPerfil({ children, inicial }: { children: ReactNode; inicial?: Partial<Dados> }) {
  const [d, setD] = useState<Dados>({ perfil: perfilVazio, motos: [], contatos: [], ...inicial });
  const [carregou, setCarregou] = useState(!!inicial);

  useEffect(() => {
    if (inicial) return;
    AsyncStorage.getItem(CHAVE)
      .then((v) => v && setD((a) => ({ ...a, ...(JSON.parse(v) as Dados) })))
      .catch(() => undefined)
      .finally(() => setCarregou(true));
  }, [inicial]);

  useEffect(() => {
    if (carregou && !inicial) void AsyncStorage.setItem(CHAVE, JSON.stringify(d)).catch(() => undefined);
  }, [d, carregou, inicial]);

  const valor = useMemo<Valor>(
    () => ({
      ...d,
      motoPrincipal: d.motos.find((m) => m.principal),
      salvarPerfil: (p) => setD((a) => ({ ...a, perfil: { ...a.perfil, ...p } })),
      apagarMacom: () => setD((a) => ({ ...a, perfil: { ...a.perfil, macom: perfilVazio.macom } })),
      salvarMoto: (m) =>
        setD((a) => {
          const existe = m.id && a.motos.some((x) => x.id === m.id);
          const motos = existe
            ? a.motos.map((x) => (x.id === m.id ? { ...x, ...m, id: x.id } : x))
            : [...a.motos, { ...m, id: `moto-${Date.now()}`, principal: a.motos.length === 0 }];
          return { ...a, motos: normalizarPrincipal(motos) };
        }),
      apagarMoto: (id) =>
        setD((a) => ({ ...a, motos: normalizarPrincipal(a.motos.filter((x) => x.id !== id)) })),
      tornarPrincipal: (id) =>
        setD((a) => ({ ...a, motos: a.motos.map((x) => ({ ...x, principal: x.id === id })) })),
      salvarContato: (c) => {
        if (!c.id && d.contatos.length >= MAX_CONTATOS) return false;
        setD((a) => ({
          ...a,
          contatos: c.id
            ? a.contatos.map((x) => (x.id === c.id ? { ...x, ...c, id: x.id } : x))
            : [...a.contatos, { ...c, id: `contato-${Date.now()}` }],
        }));
        return true;
      },
      apagarContato: (id) => setD((a) => ({ ...a, contatos: a.contatos.filter((x) => x.id !== id) })),
    }),
    [d],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePerfil(): Valor {
  const v = useContext(Contexto);
  if (!v) throw new Error('usePerfil precisa do ProvedorPerfil');
  return v;
}

/** Versão que não exige o provedor (telas que também rodam fora dele). */
export const usePerfilOpcional = () => useContext(Contexto);
