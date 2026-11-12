import type { Conversa, Mensagem, TipoConversa } from '@/dados/conversas';

import { supabase } from './supabase';

/**
 * Chat real (P5): conversas, mensagens (Realtime), acenos, silêncio, denúncia e bloqueio.
 * Tudo passa pela RLS do banco. Conversas só nascem por aceno aceito, grupo do capítulo ou presença em passeio.
 */
export const TAMANHO_PAGINA_CHAT = 30;

export type MotivoErroAceno = 'limite' | 'repetido' | 'erro';

/** Erro de aceno com o motivo já traduzido em categoria (a tela escolhe o texto). */
export class ErroAceno extends Error {
  constructor(public motivo: MotivoErroAceno) {
    super(motivo);
  }
}

export type AcenoRecebido = { id: string; deId: string; nome: string; criadoEm: string };
export type MembroChat = { id: string; nome: string; apelido: string | null; capitulo: string | null };

export type ConversaServidor = Conversa & {
  naoLidas: number;
  silenciado: boolean;
  ultimaEm: string | null;
};

function exigir() {
  if (!supabase) throw new Error('servidor não configurado');
  return supabase;
}

async function meuId() {
  const { data } = await exigir().auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('sem sessão');
  return id;
}

type Embutido<T> = T | T[] | null;
const um = <T>(v: Embutido<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);
const nomeDe = (p: { nome: string; apelido: string | null } | null | undefined) =>
  p?.apelido || p?.nome || '';

type LinhaParticipacao = {
  conversa_id: string;
  silenciado: boolean;
  lido_ate: string | null;
  conversas: Embutido<{
    id: string;
    tipo: TipoConversa;
    titulo: string | null;
    par_a: string | null;
    par_b: string | null;
    termina_em: string | null;
    participantes: { count: number }[] | null;
  }>;
};

type LinhaMensagem = {
  id: string;
  conversa_id?: string;
  autor: string;
  texto: string;
  rapida: boolean;
  criado_em: string;
  perfis?: Embutido<{ nome: string; apelido: string | null }>;
};

const colunasMensagem = 'id, conversa_id, autor, texto, rapida, criado_em, perfis!autor(nome, apelido)';

function paraMensagem(l: LinhaMensagem, eu: string, conversa?: string): Mensagem {
  return {
    id: l.id,
    conversa: conversa ?? l.conversa_id ?? '',
    autor: nomeDe(um(l.perfis ?? null)),
    autorId: l.autor,
    texto: l.texto,
    quando: l.criado_em,
    minha: l.autor === eu,
    rapida: l.rapida || undefined,
  };
}

/** Garante o grupo do capítulo e o canal de avisos (e entra neles). Chamar ao abrir a aba. */
export async function garantirGrupoCapitulo(): Promise<string | null> {
  const { data, error } = await exigir().rpc('garantir_grupo_capitulo');
  if (error) throw error;
  return (data as string | null) ?? null;
}

/** As conversas em que participo: último texto, não lidas (pelo lido_ate) e silenciado. */
export async function listarConversas(): Promise<{
  conversas: ConversaServidor[];
  ultimas: Mensagem[];
}> {
  const sb = exigir();
  const eu = await meuId();
  const { data, error } = await sb
    .from('participantes')
    .select(
      'conversa_id, silenciado, lido_ate, conversas(id, tipo, titulo, par_a, par_b, termina_em, participantes(count))',
    )
    .eq('usuario_id', eu);
  if (error) throw error;
  const linhas = ((data ?? []) as unknown as LinhaParticipacao[])
    .map((l) => ({ ...l, c: um(l.conversas) }))
    .filter((l): l is typeof l & { c: NonNullable<typeof l.c> } => !!l.c);

  const resumos = await Promise.all(
    linhas.map(async (l) => {
      let n = sb
        .from('mensagens')
        .select('id', { count: 'exact', head: true })
        .eq('conversa_id', l.c.id)
        .neq('autor', eu);
      if (l.lido_ate) n = n.gt('criado_em', l.lido_ate);
      const [ultima, naoLidas] = await Promise.all([
        sb
          .from('mensagens')
          .select(colunasMensagem)
          .eq('conversa_id', l.c.id)
          .order('criado_em', { ascending: false })
          .limit(1),
        n,
      ]);
      return {
        ultima: ((ultima.data ?? []) as unknown as LinhaMensagem[])[0] ?? null,
        naoLidas: naoLidas.count ?? 0,
      };
    }),
  );

  const outros = [
    ...new Set(
      linhas
        .filter((l) => l.c.tipo === 'direto')
        .map((l) => (l.c.par_a === eu ? l.c.par_b : l.c.par_a))
        .filter((x): x is string => !!x),
    ),
  ];
  const nomes: Record<string, string> = {};
  if (outros.length) {
    const { data: ps } = await sb.from('perfis').select('id, nome, apelido').in('id', outros);
    for (const p of (ps ?? []) as { id: string; nome: string; apelido: string | null }[])
      nomes[p.id] = nomeDe(p);
  }

  const ultimas: Mensagem[] = [];
  const conversas = linhas.map((l, i) => {
    const r = resumos[i]!;
    if (r.ultima) ultimas.push(paraMensagem(r.ultima, eu, l.c.id));
    const comId = l.c.tipo === 'direto' ? (l.c.par_a === eu ? l.c.par_b : l.c.par_a) : null;
    return {
      id: l.c.id,
      tipo: l.c.tipo,
      titulo: l.c.tipo === 'direto' ? (nomes[comId ?? ''] ?? '') : (l.c.titulo ?? ''),
      com: l.c.tipo === 'direto' ? (nomes[comId ?? ''] ?? '') : undefined,
      comId: comId ?? undefined,
      participantes: um(l.c.participantes)?.count ?? 0,
      terminaEm: l.c.termina_em ?? undefined,
      naoLidas: r.naoLidas,
      silenciado: l.silenciado,
      ultimaEm: r.ultima?.criado_em ?? null,
    } satisfies ConversaServidor;
  });
  return { conversas, ultimas };
}

/** Página de mensagens da conversa em ordem cronológica. `antesDe` = quando da mais antiga já carregada. */
export async function mensagens(conversa: string, antesDe?: string, limite = TAMANHO_PAGINA_CHAT) {
  const eu = await meuId();
  let q = exigir()
    .from('mensagens')
    .select(colunasMensagem)
    .eq('conversa_id', conversa)
    .order('criado_em', { ascending: false })
    .limit(limite);
  if (antesDe) q = q.lt('criado_em', antesDe);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as unknown as LinhaMensagem[]).map((l) => paraMensagem(l, eu, conversa)).reverse();
}

export async function enviar(conversa: string, texto: string, rapida = false): Promise<Mensagem> {
  const eu = await meuId();
  const { data, error } = await exigir()
    .from('mensagens')
    .insert({ conversa_id: conversa, texto, rapida })
    .select(colunasMensagem)
    .single();
  if (error) throw error;
  return paraMensagem(data as unknown as LinhaMensagem, eu, conversa);
}

/** Mensagens novas da conversa em tempo real. Devolve a função que cancela a assinatura. */
export function assinar(conversa: string, aoChegar: (m: Mensagem) => void): () => void {
  const sb = exigir();
  let ativo = true;
  const canal = sb
    .channel(`mensagens:${conversa}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'mensagens', filter: `conversa_id=eq.${conversa}` },
      (p: { new: LinhaMensagem }) => {
        void (async () => {
          const eu = await meuId().catch(() => '');
          // o evento traz só a linha crua: busca o nome de quem escreveu
          const { data } = await sb
            .from('perfis')
            .select('nome, apelido')
            .eq('id', p.new.autor)
            .maybeSingle();
          if (ativo)
            aoChegar(
              paraMensagem(
                { ...p.new, perfis: data as { nome: string; apelido: string | null } },
                eu,
                conversa,
              ),
            );
        })();
      },
    )
    .subscribe();
  return () => {
    ativo = false;
    void sb.removeChannel(canal);
  };
}

export async function marcarLida(conversa: string) {
  const eu = await meuId();
  const { error } = await exigir()
    .from('participantes')
    .update({ lido_ate: new Date().toISOString() })
    .eq('conversa_id', conversa)
    .eq('usuario_id', eu);
  if (error) throw error;
}

export async function silenciar(conversa: string, silenciado: boolean) {
  const eu = await meuId();
  const { error } = await exigir()
    .from('participantes')
    .update({ silenciado })
    .eq('conversa_id', conversa)
    .eq('usuario_id', eu);
  if (error) throw error;
}

/** Manda um aceno. O servidor limita a 10 por dia e impede aceno pendente repetido. */
export async function acenar(para: string): Promise<void> {
  const { error } = await exigir().from('acenos').insert({ para });
  if (!error) return;
  const e = error as { code?: string; message?: string };
  if (/limite/i.test(e.message ?? '')) throw new ErroAceno('limite');
  if (e.code === '23505') throw new ErroAceno('repetido');
  throw new ErroAceno('erro');
}

export async function acenosRecebidos(): Promise<AcenoRecebido[]> {
  const eu = await meuId();
  const { data, error } = await exigir()
    .from('acenos')
    .select('id, de, criado_em, perfis!de(nome, apelido)')
    .eq('para', eu)
    .eq('status', 'pendente')
    .order('criado_em', { ascending: false });
  if (error) throw error;
  type L = {
    id: string;
    de: string;
    criado_em: string;
    perfis: Embutido<{ nome: string; apelido: string | null }>;
  };
  return ((data ?? []) as unknown as L[]).map((a) => ({
    id: a.id,
    deId: a.de,
    nome: nomeDe(um(a.perfis)),
    criadoEm: a.criado_em,
  }));
}

/** Aceita o aceno e devolve o id da conversa direta criada (ou reaproveitada). */
export async function aceitar(aceno: string): Promise<string> {
  const { data, error } = await exigir().rpc('aceitar_aceno', { aceno });
  if (error) throw error;
  return data as string;
}

export async function recusar(aceno: string) {
  const { error } = await exigir().rpc('recusar_aceno', { aceno });
  if (error) throw error;
}

/** Irmãos ativos para escolher a quem acenar (a RLS já esconde pendentes e desativados). */
export async function listarMembros(busca = ''): Promise<MembroChat[]> {
  const eu = await meuId();
  let q = exigir()
    .from('perfis')
    .select('id, nome, apelido, capitulos(nome)')
    .neq('id', eu)
    .neq('papel', 'pendente')
    .is('desativado_em', null)
    .order('nome')
    .limit(50);
  const termo = busca.trim().replace(/[%,()]/g, '');
  if (termo) q = q.or(`nome.ilike.%${termo}%,apelido.ilike.%${termo}%`);
  const { data, error } = await q;
  if (error) throw error;
  type L = { id: string; nome: string; apelido: string | null; capitulos: Embutido<{ nome: string }> };
  return ((data ?? []) as unknown as L[]).map((p) => ({
    id: p.id,
    nome: p.nome,
    apelido: p.apelido,
    capitulo: um(p.capitulos)?.nome ?? null,
  }));
}

export async function denunciarMensagem(mensagem: string, motivo: string) {
  const { error } = await exigir()
    .from('denuncias')
    .insert({ alvo_tipo: 'mensagem', alvo_id: mensagem, motivo });
  if (error) throw error;
}

export async function bloquear(usuario: string) {
  const { error } = await exigir().from('bloqueios').insert({ bloqueado: usuario });
  if (error) throw error;
}
