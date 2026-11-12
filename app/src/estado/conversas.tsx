import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';

import { useAcessoOpcional } from '@/acesso/acesso';
import { conversasExemplo, mensagensExemplo, type Conversa, type Mensagem } from '@/dados/conversas';
import * as chatServidor from '@/servidor/chat';
import type { AcenoRecebido, ConversaServidor, MotivoErroAceno } from '@/servidor/chat';
import { servidorConfigurado } from '@/servidor/supabase';

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
  /** No servidor o bloqueio é pelo id do irmão; o nome continua servindo para esconder na hora. */
  bloquear: (nome: string, usuarioId?: string) => void;
  denunciadas: string[];
  denunciar: (mensagem: string) => void;
  tfa: (mensagem: string) => void;
  meusTfa: string[];
  iniciarDireto: (nome: string) => string;
  /** true quando o chat é o real (Supabase). */
  servidor: boolean;
  acenosRecebidos: AcenoRecebido[];
  /** Recarrega conversas, não lidas e acenos do servidor (e garante o grupo do capítulo). */
  recarregar: () => Promise<void>;
  carregarMensagens: (conversa: string) => Promise<void>;
  carregarAnteriores: (conversa: string) => Promise<void>;
  temMais: (conversa: string) => boolean;
  aceitarAceno: (aceno: string) => Promise<string | null>;
  recusarAceno: (aceno: string) => Promise<void>;
  acenar: (para: string) => Promise<'ok' | MotivoErroAceno>;
  /** O último envio falhou (mostra aviso e deixa tentar de novo). */
  falhaEnvio: boolean;
  falhaCarga: boolean;
};

const Contexto = createContext<Valor | null>(null);

/** Conversas no aparelho (até o Supabase Realtime): mensagens próprias, lidas, silêncio, bloqueio e denúncia. */
export function ProvedorConversas({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const acesso = useAcessoOpcional();
  const servidor = servidorConfigurado && acesso?.modo === 'supabase' && acesso.estado === 'membro';
  const [minhas, setMinhas] = useGuardado<Mensagem[]>('chatMensagens', []);
  const [lidas, setLidas] = useGuardado<Record<string, string>>('chatLidas', {});
  const [silencio, setSilencio] = useGuardado<Record<string, boolean>>('chatSilencio', {});
  const [bloqueados, setBloqueados] = useGuardado<string[]>('chatBloqueados', []);
  const [denunciadas, setDenunciadas] = useGuardado<string[]>('chatDenuncias', []);
  const [meusTfa, setMeusTfa] = useGuardado<string[]>('chatTfa', []);
  const [diretos, setDiretos] = useGuardado<Conversa[]>('chatDiretos', []);

  // ---- modo servidor (P5): conversas, mensagens, acenos e não lidas vêm do Supabase
  const [conversasSrv, setConversasSrv] = useState<ConversaServidor[]>([]);
  const [mensagensSrv, setMensagensSrv] = useState<Mensagem[]>([]);
  const [acenosSrv, setAcenosSrv] = useState<AcenoRecebido[]>([]);
  const [bloqueadosSrv, setBloqueadosSrv] = useState<string[]>([]);
  const [maisSrv, setMaisSrv] = useState<Record<string, boolean>>({});
  const [falhaEnvio, setFalhaEnvio] = useState(false);
  const [falhaCarga, setFalhaCarga] = useState(false);
  const vistas = useRef(new Set<string>());

  const juntar = useCallback((novas: Mensagem[]) => {
    const fresh = novas.filter((m) => !vistas.current.has(m.id));
    if (!fresh.length) return false;
    for (const m of fresh) vistas.current.add(m.id);
    setMensagensSrv((l) => [...l, ...fresh].sort((a, b) => a.quando.localeCompare(b.quando)));
    return true;
  }, []);

  const recarregar = useCallback(async () => {
    if (!servidor) return;
    try {
      await chatServidor.garantirGrupoCapitulo().catch(() => null);
      const [r, acenos] = await Promise.all([chatServidor.listarConversas(), chatServidor.acenosRecebidos()]);
      setConversasSrv(r.conversas);
      setAcenosSrv(acenos);
      juntar(r.ultimas);
      setFalhaCarga(false);
    } catch {
      setFalhaCarga(true);
    }
  }, [servidor, juntar]);

  useEffect(() => {
    if (servidor) void Promise.resolve().then(recarregar);
  }, [servidor, recarregar]);

  // Uma assinatura de tempo real por conversa; mensagem de outro irmão conta como não lida.
  const idsConversas = conversasSrv.map((c) => c.id).join(',');
  useEffect(() => {
    if (!servidor || !idsConversas) return;
    const cancelar = idsConversas.split(',').map((id) =>
      chatServidor.assinar(id, (m) => {
        if (!juntar([m]) || m.minha) return;
        setConversasSrv((l) => l.map((c) => (c.id === id ? { ...c, naoLidas: c.naoLidas + 1 } : c)));
      }),
    );
    return () => cancelar.forEach((f) => f());
  }, [servidor, idsConversas, juntar]);

  const carregarMensagens = useCallback(
    async (conversa: string) => {
      if (!servidor) return;
      try {
        const pagina = await chatServidor.mensagens(conversa);
        juntar(pagina);
        setMaisSrv((m) => ({ ...m, [conversa]: pagina.length >= chatServidor.TAMANHO_PAGINA_CHAT }));
        setFalhaCarga(false);
      } catch {
        setFalhaCarga(true);
      }
    },
    [servidor, juntar],
  );

  const carregarAnteriores = useCallback(
    async (conversa: string) => {
      if (!servidor) return;
      const primeira = mensagensSrv.find((m) => m.conversa === conversa);
      try {
        const pagina = await chatServidor.mensagens(conversa, primeira?.quando);
        juntar(pagina);
        setMaisSrv((m) => ({ ...m, [conversa]: pagina.length >= chatServidor.TAMANHO_PAGINA_CHAT }));
      } catch {
        setFalhaCarga(true);
      }
    },
    [servidor, juntar, mensagensSrv],
  );

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
    const local: Valor = {
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
      servidor: false,
      acenosRecebidos: [],
      recarregar: async () => undefined,
      carregarMensagens: async () => undefined,
      carregarAnteriores: async () => undefined,
      temMais: () => false,
      aceitarAceno: async () => null,
      recusarAceno: async () => undefined,
      acenar: async () => 'erro',
      falhaEnvio: false,
      falhaCarga: false,
    };
    if (!servidor) return local;

    // ---- servidor: mesma interface, dados reais
    const convs: Conversa[] = conversasSrv.filter(
      (c) => !(c.comId && bloqueadosSrv.includes(c.comId)) && !(c.com && bloqueados.includes(c.com)),
    );
    const msgs = mensagensSrv.filter(
      (m) => !(m.autorId && bloqueadosSrv.includes(m.autorId)) && !denunciadas.includes(m.id),
    );
    const silenciadasSrv = conversasSrv.filter((c) => c.silenciado).map((c) => c.id);
    const naoLidasSrv = (id: string) => conversasSrv.find((c) => c.id === id)?.naoLidas ?? 0;
    return {
      ...local,
      servidor: true,
      conversas: convs,
      mensagens: msgs,
      lidas: {},
      enviar: (conversa, texto, rapida) => {
        setFalhaEnvio(false);
        chatServidor
          .enviar(conversa, texto, !!rapida)
          .then((m) => juntar([m]))
          .catch(() => setFalhaEnvio(true));
      },
      marcarLida: (conversa) => {
        setConversasSrv((l) => l.map((c) => (c.id === conversa ? { ...c, naoLidas: 0 } : c)));
        void chatServidor.marcarLida(conversa).catch(() => undefined);
      },
      naoLidas: naoLidasSrv,
      totalNaoLidas: conversasSrv.filter((c) => !c.silenciado).reduce((n, c) => n + c.naoLidas, 0),
      silenciadas: silenciadasSrv,
      alternarSilencio: (id) => {
        const novo = !silenciadasSrv.includes(id);
        setConversasSrv((l) => l.map((c) => (c.id === id ? { ...c, silenciado: novo } : c)));
        void chatServidor.silenciar(id, novo).catch(() => {
          setConversasSrv((l) => l.map((c) => (c.id === id ? { ...c, silenciado: !novo } : c)));
        });
      },
      bloquear: (nome, usuarioId) => {
        if (!usuarioId) return;
        chatServidor
          .bloquear(usuarioId)
          .then(() => {
            setBloqueadosSrv((l) => (l.includes(usuarioId) ? l : [...l, usuarioId]));
            setBloqueados((l) => (l.includes(nome) ? l : [...l, nome]));
          })
          .catch(() => undefined);
      },
      denunciar: (id) => {
        void chatServidor
          .denunciarMensagem(id, t('chat.motivoDenuncia'))
          .then(() => setDenunciadas((l) => [...l, id]))
          .catch(() => undefined);
      },
      acenosRecebidos: acenosSrv,
      recarregar,
      carregarMensagens,
      carregarAnteriores,
      temMais: (id) => maisSrv[id] ?? false,
      aceitarAceno: async (id) => {
        try {
          const conversa = await chatServidor.aceitar(id);
          setAcenosSrv((l) => l.filter((a) => a.id !== id));
          await recarregar();
          return conversa;
        } catch {
          setFalhaCarga(true);
          return null;
        }
      },
      recusarAceno: async (id) => {
        try {
          await chatServidor.recusar(id);
          setAcenosSrv((l) => l.filter((a) => a.id !== id));
        } catch {
          setFalhaCarga(true);
        }
      },
      acenar: async (para) => {
        try {
          await chatServidor.acenar(para);
          return 'ok';
        } catch (e) {
          const motivo = (e as { motivo?: MotivoErroAceno } | null)?.motivo;
          return motivo ?? 'erro';
        }
      },
      falhaEnvio,
      falhaCarga,
    };
  }, [
    servidor,
    conversasSrv,
    mensagensSrv,
    acenosSrv,
    bloqueadosSrv,
    maisSrv,
    falhaEnvio,
    falhaCarga,
    juntar,
    recarregar,
    carregarMensagens,
    carregarAnteriores,
    t,

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
