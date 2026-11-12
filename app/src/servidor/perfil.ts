import { supabase } from './supabase';

/**
 * Perfil, garagem e contatos no servidor (P3). O aparelho continua sendo o "rascunho" da tela;
 * a cada mudança o conjunto é enviado (RLS: cada irmão só mexe no que é seu). Fotos continuam
 * no aparelho até o armazenamento de fotos do perfil (P4).
 */
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** UUID v4 para criar registros já com o id final (sem esperar o servidor). */
export function novoId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

type PerfilServidor = { nome: string; apelido: string; cidade: string };
type MotoServidor = {
  id: string;
  marca: string;
  modelo: string;
  ano: string;
  apelido: string;
  km: string;
  principal: boolean;
};
type ContatoServidor = { id: string; nome: string; telefone: string };
type MacomServidor = { loja: string; oriente: string; potencia: string };

async function uid() {
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  return data.user?.id ?? null;
}

export async function carregarPerfil(): Promise<{
  perfil: PerfilServidor;
  motos: MotoServidor[];
  contatos: ContatoServidor[];
  macom: MacomServidor | null;
} | null> {
  const id = await uid();
  if (!supabase || !id) return null;
  const [p, m, c, mac] = await Promise.all([
    supabase.from('perfis').select('nome, apelido, cidade').eq('id', id).maybeSingle(),
    supabase
      .from('motos')
      .select('id, marca, modelo, ano, apelido, km, principal')
      .eq('dono', id)
      .order('criado_em'),
    supabase.from('contatos_emergencia').select('id, nome, telefone').eq('dono', id).order('criado_em'),
    supabase.rpc('ler_macom', { alvo: id }),
  ]);
  if (!p.data) return null; // ainda não aprovado: não existe perfil no servidor
  const linhaMacom = (mac.data as MacomServidor[] | null)?.[0] ?? null;
  return {
    perfil: { nome: p.data.nome ?? '', apelido: p.data.apelido ?? '', cidade: p.data.cidade ?? '' },
    motos: (m.data ?? []).map((x) => ({
      id: x.id,
      marca: x.marca,
      modelo: x.modelo,
      ano: x.ano ? String(x.ano) : '',
      apelido: x.apelido ?? '',
      km: x.km != null ? String(x.km) : '',
      principal: x.principal,
    })),
    contatos: (c.data ?? []).map((x) => ({ id: x.id, nome: x.nome, telefone: x.telefone })),
    macom: linhaMacom
      ? {
          loja: linhaMacom.loja ?? '',
          oriente: linhaMacom.oriente ?? '',
          potencia: linhaMacom.potencia ?? '',
        }
      : null,
  };
}

/** Envia o estado atual: atualiza o perfil e deixa motos/contatos do servidor iguais aos da tela. */
export async function sincronizarPerfil(d: {
  perfil: PerfilServidor & {
    macom: Record<'loja' | 'oriente' | 'potencia', { valor: string; visibilidade: string }>;
  };
  motos: MotoServidor[];
  contatos: ContatoServidor[];
  temConsentimentoMacom: boolean;
}) {
  const id = await uid();
  if (!supabase || !id) return;
  const sb = supabase;
  if (d.perfil.nome.trim().length >= 2) {
    await sb
      .from('perfis')
      .update({
        nome: d.perfil.nome.trim(),
        apelido: d.perfil.apelido || null,
        cidade: d.perfil.cidade || null,
      })
      .eq('id', id);
  }
  const igualar = async (tabela: 'motos' | 'contatos_emergencia', linhas: Record<string, unknown>[]) => {
    const { data } = await sb.from(tabela).select('id').eq('dono', id);
    const manter = new Set(linhas.map((l) => l.id as string));
    const sobrando = (data ?? []).map((x) => x.id as string).filter((x) => !manter.has(x));
    if (sobrando.length) await sb.from(tabela).delete().in('id', sobrando);
    if (linhas.length) await sb.from(tabela).upsert(linhas.map((l) => ({ ...l, dono: id })));
  };
  await igualar(
    'motos',
    d.motos
      .filter((m) => UUID.test(m.id))
      .map((m) => ({
        id: m.id,
        marca: m.marca,
        modelo: m.modelo,
        ano: Number(m.ano) || null,
        apelido: m.apelido || null,
        km: Number(String(m.km).replace(/\D/g, '')) || null,
        principal: m.principal,
      })),
  );
  await igualar(
    'contatos_emergencia',
    d.contatos.filter((c) => UUID.test(c.id)).map((c) => ({ id: c.id, nome: c.nome, telefone: c.telefone })),
  );
  if (d.temConsentimentoMacom) {
    const m = d.perfil.macom;
    await sb.rpc('definir_macom', {
      p_loja: m.loja.valor,
      p_oriente: m.oriente.valor,
      p_potencia: m.potencia.valor,
      p_vis_loja: m.loja.visibilidade,
      p_vis_oriente: m.oriente.visibilidade,
      p_vis_potencia: m.potencia.visibilidade,
    });
  }
}
