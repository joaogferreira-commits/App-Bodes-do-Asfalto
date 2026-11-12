import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { conversasExemplo, mensagensExemplo, type Conversa, type Mensagem } from '@/dados/conversas';

import { useGuardado } from './guardado';

type Valor = {
  conversas: Conversa[];
  mensagens: Mensagem[];
  enviar: (conversa: string, texto: string, rapida?: boolean) => void;
  lidas: Record<string, string>;
  marcarLida: (conversa: string) => void;
  naoLidas: (conversa: string) => number;
  totalNaoLidas: number;
  silenciadas: string[];
  alternarSilencio: (conversa: string) => void;
  bloqueados: string[];
  bloquear: (nome: string) => void;
  denunciadas: string[];
  denunciar: (mensagem: string) => void;
  tfa: (mensagem: string) => void;
  meusTfa: string[];
  iniciarDireto: (nome: string) => string;
};

const Contexto = createContext<Valor | null>(null);

/** Conversas no aparelho (até o Supabase Realtime): mensagens próprias, lidas, silêncio, bloqueio e denúncia. */
export function ProvedorConversas({ children }: { children: ReactNode }) {
  const [minhas, setMinhas] = useGuardado<Mensagem[]>('chatMensagens', []);
  const [lidas, setLidas] = useGuardado<Record<string, string>>('chatLidas', {});
  const [silencio, setSilencio] = useGuardado<Record<string, boolean>>('chatSilencio', {});
  const [bloqueados, setBloqueados] = useGuardado<string[]>('chatBloqueados', []);
  const [denunciadas, setDenunciadas] = useGuardado<string[]>('chatDenuncias', []);
  const [meusTfa, setMeusTfa] = useGuardado<string[]>('chatTfa', []);
  const [diretos, setDiretos] = useGuardado<Conversa[]>('chatDiretos', []);

  const valor = useMemo<Valor>(() => {
    const conversas = [...conversasExemplo, ...diretos];
    const mensagens = [...mensagensExemplo, ...minhas].filter(
      (m) => !bloqueados.includes(m.autor) && !denunciadas.includes(m.id),
    );
    const naoLidas = (id: string) =>
      mensagens.filter((m) => m.conversa === id && !m.minha && m.quando > (lidas[id] ?? '')).length;
    const silenciadas = conversas
      .filter((c) => silencio[c.id] ?? c.silenciadoPadrao ?? false)
      .map((c) => c.id);
    return {
      conversas,
      mensagens,
      enviar: (conversa, texto, rapida) =>
        setMinhas((l) => [
          ...l,
          {
            id: `eu-${Date.now()}`,
            conversa,
            autor: 'eu',
            texto,
            quando: new Date().toISOString(),
            minha: true,
            rapida,
          },
        ]),
      lidas,
      marcarLida: (conversa) => setLidas((l) => ({ ...l, [conversa]: new Date().toISOString() })),
      naoLidas,
      totalNaoLidas: conversas
        .filter((c) => !silenciadas.includes(c.id))
        .reduce((s, c) => s + naoLidas(c.id), 0),
      silenciadas,
      alternarSilencio: (id) =>
        setSilencio((s) => ({
          ...s,
          [id]: !(s[id] ?? conversas.find((c) => c.id === id)?.silenciadoPadrao),
        })),
      bloqueados,
      bloquear: (nome) => setBloqueados((l) => (l.includes(nome) ? l : [...l, nome])),
      denunciadas,
      denunciar: (id) => setDenunciadas((l) => [...l, id]),
      tfa: (id) => setMeusTfa((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id])),
      meusTfa,
      iniciarDireto: (nome) => {
        const existente = conversas.find((c) => c.tipo === 'direto' && c.com === nome);
        if (existente) return existente.id;
        const id = `direto-${Date.now()}`;
        // Sem servidor, o aceno fica "aguardando" até o outro aceitar (Etapa B).
        setDiretos((l) => [
          ...l,
          { id, tipo: 'direto', titulo: nome, com: nome, participantes: 2, aguardandoAceno: true },
        ]);
        return id;
      },
    };
  }, [
    minhas,
    lidas,
    silencio,
    bloqueados,
    denunciadas,
    meusTfa,
    diretos,
    setMinhas,
    setLidas,
    setSilencio,
    setBloqueados,
    setDenunciadas,
    setMeusTfa,
    setDiretos,
  ]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useConversas() {
  const v = useContext(Contexto);
  if (!v) throw new Error('useConversas fora do ProvedorConversas');
  return v;
}
