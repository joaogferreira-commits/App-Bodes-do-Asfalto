import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Acesso ao app (Etapa 1). Interface única: hoje funciona só no aparelho ("local"); quando o dono
 * cadastrar a URL e a chave pública do Supabase no EAS, a mesma interface passa a usar o Supabase
 * (Auth com link mágico, Google e Apple; tabela solicitacoes_entrada; consentimentos).
 *
 * Estados: deslogado → (login) → sem solicitação → pendente (só vê a tela de espera) → membro.
 * "Modo demonstração" entra direto como membro: para o dono testar e para os revisores das lojas.
 */
export type EstadoAcesso = 'carregando' | 'deslogado' | 'semSolicitacao' | 'pendente' | 'membro';
export type Finalidade = 'termos' | 'localizacao' | 'dados_macons';
export type Consentimento = { finalidade: Finalidade; versao: string; aceitoEm: number; revogadoEm?: number };
export type Solicitacao = {
  nome: string;
  apelido: string;
  capitulo: string;
  cidade: string;
  telefone: string;
  fotoColete?: string;
  fotoCarteirinha?: string;
  indicadoPor: string;
  enviadaEm: number;
};

export const VERSAO_TERMOS = '2026-11-12';

type Dados = {
  estado: Exclude<EstadoAcesso, 'carregando'>;
  email?: string;
  metodo?: 'email' | 'google' | 'apple' | 'demonstracao';
  solicitacao?: Solicitacao;
  consentimentos: Consentimento[];
};

type Valor = {
  estado: EstadoAcesso;
  email?: string;
  metodo?: Dados['metodo'];
  solicitacao?: Solicitacao;
  consentimentos: Consentimento[];
  modo: 'local' | 'supabase';
  entrar: (metodo: 'email' | 'google' | 'apple', email?: string) => Promise<void>;
  entrarDemonstracao: () => void;
  enviarSolicitacao: (s: Omit<Solicitacao, 'enviadaEm'>) => void;
  /** Só no modo local, para testar: simula a diretoria aprovando. */
  simularAprovacao: () => void;
  consentir: (f: Finalidade) => void;
  revogar: (f: Finalidade) => void;
  temConsentimento: (f: Finalidade) => boolean;
  /** Volta para o formulário para corrigir o pedido (os dados ficam preenchidos). */
  corrigirSolicitacao: () => void;
  sair: () => Promise<void>;
  excluirConta: () => Promise<void>;
  /** Muda a cada saída/exclusão: a árvore de telas é remontada sem dados da pessoa anterior. */
  sessao: number;
};

const CHAVE = 'bodes.acesso';

/** Apaga do aparelho os dados pessoais do app (fica só a preferência de tema). */
export async function apagarDadosPessoais() {
  const chaves = (await AsyncStorage.getAllKeys().catch(() => [] as string[])).filter(
    (k) => k.startsWith('bodes.') && k !== 'bodes.tema',
  );
  await AsyncStorage.multiRemove(chaves).catch(() => undefined);
}
const inicial: Dados = { estado: 'deslogado', consentimentos: [] };
const Contexto = createContext<Valor | null>(null);

export function ProvedorAcesso({ children, comecar }: { children: ReactNode; comecar?: Partial<Dados> }) {
  const [dados, setDados] = useState<Dados | null>(comecar ? { ...inicial, ...comecar } : null);
  const [sessao, setSessao] = useState(0);

  useEffect(() => {
    if (comecar) return;
    AsyncStorage.getItem(CHAVE)
      .then((v) => setDados(v ? { ...inicial, ...(JSON.parse(v) as Dados) } : inicial))
      .catch(() => setDados(inicial));
  }, [comecar]);

  useEffect(() => {
    if (dados && !comecar) void AsyncStorage.setItem(CHAVE, JSON.stringify(dados)).catch(() => undefined);
  }, [dados, comecar]);

  const valor = useMemo<Valor>(() => {
    const d = dados ?? inicial;
    const mudar = (f: (a: Dados) => Dados) => setDados((a) => f(a ?? inicial));
    const ativo = (f: Finalidade) => d.consentimentos.some((c) => c.finalidade === f && !c.revogadoEm);
    return {
      estado: dados ? d.estado : 'carregando',
      email: d.email,
      metodo: d.metodo,
      solicitacao: d.solicitacao,
      consentimentos: d.consentimentos,
      modo: 'local',
      entrar: async (metodo, email) => {
        mudar((a) => ({ ...a, metodo, email, estado: a.solicitacao ? 'pendente' : 'semSolicitacao' }));
      },
      entrarDemonstracao: () => mudar((a) => ({ ...a, metodo: 'demonstracao', estado: 'membro' })),
      enviarSolicitacao: (s) =>
        mudar((a) => ({ ...a, estado: 'pendente', solicitacao: { ...s, enviadaEm: Date.now() } })),
      simularAprovacao: () => mudar((a) => ({ ...a, estado: 'membro' })),
      consentir: (f) =>
        mudar((a) =>
          a.consentimentos.some((c) => c.finalidade === f && !c.revogadoEm)
            ? a
            : {
                ...a,
                consentimentos: [
                  ...a.consentimentos,
                  { finalidade: f, versao: VERSAO_TERMOS, aceitoEm: Date.now() },
                ],
              },
        ),
      revogar: (f) =>
        mudar((a) => ({
          ...a,
          consentimentos: a.consentimentos.map((c) =>
            c.finalidade === f && !c.revogadoEm ? { ...c, revogadoEm: Date.now() } : c,
          ),
        })),
      temConsentimento: ativo,
      corrigirSolicitacao: () => mudar((a) => ({ ...a, estado: 'semSolicitacao' })),
      // Sair e excluir apagam os dados pessoais do aparelho e remontam as telas (ninguém herda nada).
      sair: async () => {
        await apagarDadosPessoais();
        setDados(inicial);
        setSessao((n) => n + 1);
      },
      excluirConta: async () => {
        // No Supabase: excluir_minha_conta() apaga também no servidor.
        await apagarDadosPessoais();
        setDados(inicial);
        setSessao((n) => n + 1);
      },
      sessao,
    };
  }, [dados, sessao]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAcesso(): Valor {
  const v = useContext(Contexto);
  if (!v) throw new Error('useAcesso precisa do ProvedorAcesso');
  return v;
}
