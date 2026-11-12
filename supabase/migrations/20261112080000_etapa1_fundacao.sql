-- Etapa 1 — Fundação, acesso e perfil (docs/ETAPAS.md).
-- Regras: CLAUDE.md "Decisões fechadas" e "Segurança e privacidade". Toda tabela com RLS.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- tipos
create type public.papel as enum ('pendente', 'membro', 'diretoria_capitulo', 'diretoria_geral', 'moderador', 'admin');
create type public.visibilidade as enum ('ninguem', 'amigos', 'membros');
create type public.status_solicitacao as enum ('aberta', 'aprovada', 'recusada');
create type public.finalidade_consentimento as enum ('termos', 'dados_macons', 'localizacao');

-- ---------------------------------------------------------------- capítulos
create table public.capitulos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cidade text not null,
  uf char(2) not null,
  -- interruptor do lançamento em fases (Cuiabá primeiro)
  liberado boolean not null default false,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------- perfis
create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 2 and 80),
  apelido text check (char_length(apelido) <= 40),
  cidade text,
  capitulo_id uuid references public.capitulos (id),
  papel public.papel not null default 'pendente',
  foto_path text,
  desativado_em timestamptz,
  criado_em timestamptz not null default now()
);
create index perfis_capitulo on public.perfis (capitulo_id);

-- ---------------------------------------------------------------- funções de apoio (security definer, sem recursão de RLS)
create function public.meu_perfil() returns public.perfis
language sql stable security definer set search_path = public as $$
  select * from public.perfis where id = auth.uid()
$$;

create function public.sou_membro_ativo() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where id = auth.uid() and papel <> 'pendente' and desativado_em is null)
$$;

create function public.sou_moderacao() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where id = auth.uid() and papel in ('moderador', 'admin') and desativado_em is null)
$$;

create function public.sou_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where id = auth.uid() and papel = 'admin' and desativado_em is null)
$$;

create function public.sou_diretoria_de(cap uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid() and desativado_em is null
      and (papel = 'diretoria_geral' or (papel = 'diretoria_capitulo' and capitulo_id = cap))
  )
$$;

-- Capítulo "tem diretoria no app" = há ao menos um diretor de capítulo ativo nele.
create function public.capitulo_tem_diretoria(cap uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where capitulo_id = cap and papel = 'diretoria_capitulo' and desativado_em is null)
$$;

-- Quem aprova a entrada num capítulo (regra por capítulo do CLAUDE.md).
create function public.posso_aprovar(cap uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.sou_admin()
      or (public.capitulo_tem_diretoria(cap) and public.sou_diretoria_de(cap))
      or (not public.capitulo_tem_diretoria(cap) and public.sou_moderacao())
$$;

-- Ninguém muda o próprio papel, capítulo ou desativação pelo app: só pelas funções de aprovação.
create function public.proteger_campos_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if current_setting('bodes.mudanca_autorizada', true) = 'sim' then
    return new;
  end if;
  if new.papel is distinct from old.papel
     or new.capitulo_id is distinct from old.capitulo_id
     or new.desativado_em is distinct from old.desativado_em then
    raise exception 'papel, capítulo e desativação só mudam pela diretoria ou moderação';
  end if;
  return new;
end $$;
create trigger perfis_protecao before update on public.perfis
  for each row execute function public.proteger_campos_perfil();

-- ---------------------------------------------------------------- amizades (para a visibilidade "amigos")
create table public.amizades (
  solicitante uuid not null references public.perfis (id) on delete cascade,
  destinatario uuid not null references public.perfis (id) on delete cascade,
  aceita boolean not null default false,
  criado_em timestamptz not null default now(),
  primary key (solicitante, destinatario),
  check (solicitante <> destinatario)
);

create function public.somos_amigos(outro uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.amizades
    where aceita and ((solicitante = auth.uid() and destinatario = outro) or (destinatario = auth.uid() and solicitante = outro))
  )
$$;

-- ---------------------------------------------------------------- solicitações de entrada
create table public.solicitacoes_entrada (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  apelido text,
  capitulo_id uuid not null references public.capitulos (id),
  cidade text not null,
  telefone text not null,
  foto_colete_path text not null,
  foto_carteirinha_path text not null,
  indicado_por uuid references public.perfis (id),
  indicacao_confirmada boolean not null default false,
  status public.status_solicitacao not null default 'aberta',
  decidido_por uuid references public.perfis (id),
  decidido_em timestamptz,
  motivo text,
  criado_em timestamptz not null default now()
);
create unique index uma_solicitacao_aberta on public.solicitacoes_entrada (usuario_id) where status = 'aberta';

create function public.aprovar_solicitacao(sol uuid, aprovar boolean, motivo_recusa text default null) returns void
language plpgsql security definer set search_path = public as $$
declare s public.solicitacoes_entrada;
begin
  select * into s from public.solicitacoes_entrada where id = sol and status = 'aberta';
  if not found then raise exception 'solicitação não encontrada ou já decidida'; end if;
  if not public.posso_aprovar(s.capitulo_id) then raise exception 'sem permissão para decidir este capítulo'; end if;
  update public.solicitacoes_entrada
     set status = case when aprovar then 'aprovada'::public.status_solicitacao else 'recusada' end,
         decidido_por = auth.uid(), decidido_em = now(), motivo = motivo_recusa
   where id = sol;
  if aprovar then
    perform set_config('bodes.mudanca_autorizada', 'sim', true);
    insert into public.perfis (id, nome, apelido, cidade, capitulo_id, papel)
    values (s.usuario_id, s.nome, s.apelido, s.cidade, s.capitulo_id, 'membro')
    on conflict (id) do update set papel = 'membro', capitulo_id = excluded.capitulo_id, desativado_em = null;
    perform set_config('bodes.mudanca_autorizada', '', true);
  end if;
end $$;

-- Desligamento: a diretoria do capítulo (ou admin/moderação) desativa na hora.
create function public.desativar_irmao(irmao uuid) returns void
language plpgsql security definer set search_path = public as $$
declare cap uuid;
begin
  select capitulo_id into cap from public.perfis where id = irmao;
  if not (public.sou_moderacao() or public.sou_diretoria_de(cap)) then raise exception 'sem permissão'; end if;
  perform set_config('bodes.mudanca_autorizada', 'sim', true);
  update public.perfis set desativado_em = now() where id = irmao;
  perform set_config('bodes.mudanca_autorizada', '', true);
end $$;

-- ---------------------------------------------------------------- contatos de emergência (só o dono vê)
create table public.contatos_emergencia (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  nome text not null,
  telefone text not null,
  criado_em timestamptz not null default now()
);
create function public.limitar_contatos() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.contatos_emergencia where dono = new.dono) >= 3 then
    raise exception 'no máximo 3 contatos de emergência';
  end if;
  return new;
end $$;
create trigger contatos_limite before insert on public.contatos_emergencia
  for each row execute function public.limitar_contatos();

-- ---------------------------------------------------------------- perfil maçônico (opcional, cifrado, visibilidade por campo)
create table public.perfil_macom (
  usuario_id uuid primary key references public.perfis (id) on delete cascade,
  loja bytea,
  oriente bytea,
  potencia bytea,
  vis_loja public.visibilidade not null default 'ninguem',
  vis_oriente public.visibilidade not null default 'ninguem',
  vis_potencia public.visibilidade not null default 'ninguem',
  atualizado_em timestamptz not null default now()
);
-- Nenhum acesso direto à tabela: só pelas funções abaixo (o app nunca lê o texto cifrado).

create function public.chave_macom() returns text
language plpgsql stable security definer set search_path = public, vault as $$
declare k text;
begin
  select decrypted_secret into k from vault.decrypted_secrets where name = 'chave_macom';
  if k is null then raise exception 'chave_macom ausente no Vault'; end if;
  return k;
end $$;
revoke all on function public.chave_macom() from public, anon, authenticated;

create function public.definir_macom(
  p_loja text, p_oriente text, p_potencia text,
  p_vis_loja public.visibilidade, p_vis_oriente public.visibilidade, p_vis_potencia public.visibilidade
) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare k text := public.chave_macom();
begin
  if not public.sou_membro_ativo() then raise exception 'só membros'; end if;
  if not exists (select 1 from public.consentimentos where usuario_id = auth.uid() and finalidade = 'dados_macons' and revogado_em is null) then
    raise exception 'consentimento para dados maçônicos é obrigatório';
  end if;
  insert into public.perfil_macom as m (usuario_id, loja, oriente, potencia, vis_loja, vis_oriente, vis_potencia)
  values (auth.uid(),
          case when nullif(p_loja, '') is null then null else pgp_sym_encrypt(p_loja, k) end,
          case when nullif(p_oriente, '') is null then null else pgp_sym_encrypt(p_oriente, k) end,
          case when nullif(p_potencia, '') is null then null else pgp_sym_encrypt(p_potencia, k) end,
          p_vis_loja, p_vis_oriente, p_vis_potencia)
  on conflict (usuario_id) do update set
    loja = excluded.loja, oriente = excluded.oriente, potencia = excluded.potencia,
    vis_loja = excluded.vis_loja, vis_oriente = excluded.vis_oriente, vis_potencia = excluded.vis_potencia,
    atualizado_em = now();
end $$;

create function public.pode_ver(dono uuid, vis public.visibilidade) returns boolean
language sql stable security definer set search_path = public as $$
  select dono = auth.uid()
      or (public.sou_membro_ativo() and (vis = 'membros' or (vis = 'amigos' and public.somos_amigos(dono))))
$$;

create function public.ler_macom(alvo uuid) returns table (loja text, oriente text, potencia text)
language plpgsql stable security definer set search_path = public, extensions as $$
declare m public.perfil_macom; k text;
begin
  select * into m from public.perfil_macom where usuario_id = alvo;
  if not found then return; end if;
  k := public.chave_macom();
  loja := case when m.loja is not null and public.pode_ver(alvo, m.vis_loja) then pgp_sym_decrypt(m.loja, k) end;
  oriente := case when m.oriente is not null and public.pode_ver(alvo, m.vis_oriente) then pgp_sym_decrypt(m.oriente, k) end;
  potencia := case when m.potencia is not null and public.pode_ver(alvo, m.vis_potencia) then pgp_sym_decrypt(m.potencia, k) end;
  return next;
end $$;

-- ---------------------------------------------------------------- consentimentos LGPD (data, versão, finalidade)
create table public.consentimentos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  finalidade public.finalidade_consentimento not null,
  versao text not null,
  aceito_em timestamptz not null default now(),
  revogado_em timestamptz
);

-- Revogar o consentimento de dados maçônicos apaga esses dados.
create function public.apagar_macom_ao_revogar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.finalidade = 'dados_macons' and new.revogado_em is not null and old.revogado_em is null then
    delete from public.perfil_macom where usuario_id = new.usuario_id;
  end if;
  return new;
end $$;
create trigger consentimento_revogado after update on public.consentimentos
  for each row execute function public.apagar_macom_ao_revogar();

-- ---------------------------------------------------------------- garagem
create table public.motos (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  marca text not null,
  modelo text not null,
  ano int check (ano between 1900 and 2100),
  apelido text,
  foto_path text,
  km int check (km >= 0),
  principal boolean not null default false,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------- excluir conta (LGPD)
create function public.excluir_minha_conta() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'sem sessão'; end if;
  delete from auth.users where id = auth.uid(); -- apaga em cascata perfil, contatos, motos, macom, consentimentos
end $$;

-- ---------------------------------------------------------------- RLS
alter table public.capitulos enable row level security;
alter table public.perfis enable row level security;
alter table public.amizades enable row level security;
alter table public.solicitacoes_entrada enable row level security;
alter table public.contatos_emergencia enable row level security;
alter table public.perfil_macom enable row level security;
alter table public.consentimentos enable row level security;
alter table public.motos enable row level security;

-- capítulos: qualquer usuário logado lê (precisa escolher no formulário); só admin altera
create policy capitulos_ler on public.capitulos for select to authenticated using (true);
create policy capitulos_admin on public.capitulos for all to authenticated using (public.sou_admin()) with check (public.sou_admin());

-- perfis: cada um vê o seu; membros ativos veem membros ativos; moderação vê todos
create policy perfis_ler on public.perfis for select to authenticated using (
  id = auth.uid()
  or (public.sou_membro_ativo() and papel <> 'pendente' and desativado_em is null)
  or public.sou_moderacao()
);
create policy perfis_editar_o_seu on public.perfis for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- amizades: as duas pontas veem; quem pede cria; o destinatário aceita; qualquer ponta desfaz
create policy amizades_ler on public.amizades for select to authenticated using (auth.uid() in (solicitante, destinatario));
create policy amizades_pedir on public.amizades for insert to authenticated with check (solicitante = auth.uid() and not aceita and public.sou_membro_ativo());
create policy amizades_aceitar on public.amizades for update to authenticated using (destinatario = auth.uid()) with check (destinatario = auth.uid());
create policy amizades_desfazer on public.amizades for delete to authenticated using (auth.uid() in (solicitante, destinatario));

-- solicitações: o candidato vê e cria a sua; quem pode aprovar o capítulo vê as dele (decisão só pela função)
create policy solicitacoes_ler on public.solicitacoes_entrada for select to authenticated using (
  usuario_id = auth.uid() or public.posso_aprovar(capitulo_id) or indicado_por = auth.uid()
);
create policy solicitacoes_criar on public.solicitacoes_entrada for insert to authenticated with check (
  usuario_id = auth.uid() and status = 'aberta' and not indicacao_confirmada
);

-- contatos de emergência: só o dono (nem moderação lê)
create policy contatos_dono on public.contatos_emergencia for all to authenticated using (dono = auth.uid()) with check (dono = auth.uid());

-- perfil maçônico: sem políticas → nenhum acesso direto; só pelas funções definir_macom/ler_macom

-- consentimentos: só o dono lê, registra e revoga (não apaga o histórico)
create policy consentimentos_ler on public.consentimentos for select to authenticated using (usuario_id = auth.uid());
create policy consentimentos_registrar on public.consentimentos for insert to authenticated with check (usuario_id = auth.uid() and revogado_em is null);
create policy consentimentos_revogar on public.consentimentos for update to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- motos: membros ativos veem as motos dos membros; só o dono altera
create policy motos_ler on public.motos for select to authenticated using (dono = auth.uid() or public.sou_membro_ativo());
create policy motos_dono on public.motos for insert to authenticated with check (dono = auth.uid());
create policy motos_dono_editar on public.motos for update to authenticated using (dono = auth.uid()) with check (dono = auth.uid());
create policy motos_dono_apagar on public.motos for delete to authenticated using (dono = auth.uid());

-- funções: só usuários logados chamam
revoke execute on function public.aprovar_solicitacao(uuid, boolean, text) from public, anon;
revoke execute on function public.desativar_irmao(uuid) from public, anon;
revoke execute on function public.definir_macom(text, text, text, public.visibilidade, public.visibilidade, public.visibilidade) from public, anon;
revoke execute on function public.ler_macom(uuid) from public, anon;
revoke execute on function public.excluir_minha_conta() from public, anon;

-- ---------------------------------------------------------------- chave dos dados maçônicos (no Vault, criada uma vez)
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'chave_macom') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'base64'), 'chave_macom', 'Chave dos dados maçônicos (Loja, Oriente, Potência)');
  end if;
end $$;
