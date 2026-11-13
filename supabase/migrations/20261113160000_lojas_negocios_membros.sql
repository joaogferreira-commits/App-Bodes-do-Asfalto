-- Lojas (Visitação), Guia de Negócios de Irmãos, lista de membros e aniversários.
-- AGUARDA o CI verde (pgTAP) e entra em migrations/ pelo workflow, conforme a autorização permanente do dono.
--
-- LGPD / regras do clube:
--  * "lojas" é informação pública sobre a Loja (nome, oriente, potência, dias de sessão), só para membros. A tabela NÃO liga
--    nenhum irmão à Loja em público: a coluna criado_por (e o irmão de contato, que consentiu ao cadastrar) só é lida pelo
--    próprio autor e pela moderação (privilégio por coluna). Dados maçônicos do irmão seguem só em perfil_macom (criptografado).
--  * Contato com a Loja é por aceno: o app nunca mostra telefone do irmão de contato.
--  * Negócios: cadastro grátis, aprovado pela moderação. O destaque (destaque_ate) é pago FORA do app e só o admin o define.
--  * Aniversário (só dia e mês, sem ano) fica em tabela própria, escondido por padrão; a lista de membros só o devolve
--    quando o irmão escolheu mostrar.

-- ================================================================ lojas
create table public.lojas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 2 and 120),
  oriente text check (oriente is null or char_length(oriente) <= 80),
  potencia text check (potencia is null or char_length(potencia) <= 80),
  dias_sessao text check (dias_sessao is null or char_length(dias_sessao) <= 160),
  endereco text check (endereco is null or char_length(endereco) <= 200),
  cidade text not null check (char_length(btrim(cidade)) between 2 and 80),
  -- posição aproximada, opcional (o app arredonda a ~1 km antes de enviar)
  lat double precision check (lat is null or lat between -90 and 90),
  lng double precision check (lng is null or lng between -180 and 180),
  irmao_contato uuid references public.perfis (id) on delete set null,
  criado_por uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  -- o irmão declara que pertence a esta Loja (fica só como "sim"; a Loja não é ligada a ele em público)
  declaracao boolean not null default false check (declaracao),
  status text not null default 'pendente' check (status in ('pendente', 'aprovada', 'recusada')),
  motivo_recusa text check (motivo_recusa is null or char_length(motivo_recusa) <= 200),
  created_at timestamptz not null default now(),
  check ((lat is null) = (lng is null))
);
create index lojas_status on public.lojas (status, cidade);
create index lojas_autor on public.lojas (criado_por);
alter table public.lojas enable row level security;

-- Privilégios por coluna: os membros nunca leem criado_por (nem por select *).
revoke all on public.lojas from anon, authenticated;
grant select (id, nome, oriente, potencia, dias_sessao, endereco, cidade, lat, lng, irmao_contato, status, motivo_recusa, created_at)
  on public.lojas to authenticated;
grant insert (nome, oriente, potencia, dias_sessao, endereco, cidade, lat, lng, irmao_contato, declaracao)
  on public.lojas to authenticated;
grant update (nome, oriente, potencia, dias_sessao, endereco, cidade, lat, lng, irmao_contato)
  on public.lojas to authenticated;
grant delete on public.lojas to authenticated;

create policy lojas_ler on public.lojas for select to authenticated
  using (
    public.sou_membro_ativo()
    and (status = 'aprovada' or criado_por = auth.uid() or public.sou_moderacao())
  );
create policy lojas_criar on public.lojas for insert to authenticated
  with check (
    public.sou_membro_ativo() and criado_por = auth.uid() and status = 'pendente'
    and declaracao and motivo_recusa is null
    and (irmao_contato is null or irmao_contato = auth.uid())
  );
create policy lojas_editar on public.lojas for update to authenticated
  using (criado_por = auth.uid() or public.sou_moderacao())
  with check ((criado_por = auth.uid() or public.sou_moderacao()) and (irmao_contato is null or irmao_contato = criado_por));
create policy lojas_apagar on public.lojas for delete to authenticated
  using (criado_por = auth.uid() or public.sou_moderacao());

-- Editar volta para "pendente" (nova revisão), a menos que a moderação esteja editando.
create function public.lojas_antes_de_editar() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.sou_moderacao() then return new; end if;
  new.criado_por := old.criado_por;
  new.status := 'pendente';
  new.motivo_recusa := null;
  return new;
end $$;
create trigger lojas_editar_t before update on public.lojas for each row execute function public.lojas_antes_de_editar();

-- No máximo 3 cadastros de Loja por dia por irmão.
create function public.lojas_limite() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.lojas where criado_por = new.criado_por and created_at > now() - interval '1 day') >= 3 then
    raise exception 'limite_diario' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger lojas_limite_t before insert on public.lojas for each row execute function public.lojas_limite();

-- Fila da moderação (com o nome de quem cadastrou, que só a moderação enxerga).
create function public.lojas_pendentes() returns table (
  id uuid, nome text, oriente text, potencia text, dias_sessao text, endereco text, cidade text,
  autor text, created_at timestamptz
) language plpgsql stable security definer set search_path = public as $$
begin
  if not public.sou_moderacao() then raise exception 'sem_permissao' using errcode = '42501'; end if;
  return query
    select l.id, l.nome, l.oriente, l.potencia, l.dias_sessao, l.endereco, l.cidade,
           coalesce(p.nome, '-') || coalesce(' “' || p.apelido || '”', ''), l.created_at
      from public.lojas l left join public.perfis p on p.id = l.criado_por
     where l.status = 'pendente' order by l.created_at limit 50;
end $$;
revoke all on function public.lojas_pendentes() from public, anon;
grant execute on function public.lojas_pendentes() to authenticated;

create function public.decidir_loja(p_id uuid, p_aprovar boolean, p_motivo text default null) returns text
language plpgsql security definer set search_path = public as $$
declare m text := nullif(btrim(coalesce(p_motivo, '')), '');
begin
  if not public.sou_moderacao() then raise exception 'sem_permissao' using errcode = '42501'; end if;
  if not p_aprovar and m is null then raise exception 'motivo' using errcode = 'P0001'; end if;
  update public.lojas
     set status = case when p_aprovar then 'aprovada' else 'recusada' end,
         motivo_recusa = case when p_aprovar then null else left(m, 200) end
   where id = p_id;
  if not found then raise exception 'inexistente' using errcode = 'P0001'; end if;
  return case when p_aprovar then 'aprovada' else 'recusada' end;
end $$;
revoke all on function public.decidir_loja(uuid, boolean, text) from public, anon;
grant execute on function public.decidir_loja(uuid, boolean, text) to authenticated;

-- ================================================================ negócios de irmãos
create table public.negocios (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 2 and 120),
  categoria text not null check (categoria in ('oficina', 'comida', 'pouso', 'pecas', 'servicos')),
  descricao text check (descricao is null or char_length(descricao) <= 600),
  cidade text not null check (char_length(btrim(cidade)) between 2 and 80),
  lat double precision check (lat is null or lat between -90 and 90),
  lng double precision check (lng is null or lng between -180 and 180),
  telefone text check (telefone is null or char_length(telefone) <= 30),
  whatsapp text check (whatsapp is null or char_length(whatsapp) <= 30),
  site text check (site is null or (char_length(site) <= 200 and site ~* '^https?://[^[:space:]]+$')),
  beneficio_irmaos text not null check (char_length(btrim(beneficio_irmaos)) between 2 and 200),
  -- caminhos no bucket "negocios" (pasta do dono)
  fotos text[] not null default '{}' check (cardinality(fotos) <= 5),
  -- Destaque pago FORA do app; só o admin define (função definir_destaque).
  destaque_ate date,
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado')),
  motivo_recusa text check (motivo_recusa is null or char_length(motivo_recusa) <= 200),
  created_at timestamptz not null default now(),
  check ((lat is null) = (lng is null))
);
create index negocios_status on public.negocios (status, cidade);
create index negocios_dono on public.negocios (dono);
alter table public.negocios enable row level security;

create policy negocios_ler on public.negocios for select to authenticated
  using (
    public.sou_membro_ativo()
    and (status = 'aprovado' or dono = auth.uid() or public.sou_moderacao())
  );
create policy negocios_criar on public.negocios for insert to authenticated
  with check (
    public.sou_membro_ativo() and dono = auth.uid() and status = 'pendente'
    and destaque_ate is null and motivo_recusa is null
    and not exists (select 1 from unnest(fotos) f where f not like auth.uid()::text || '/%')
  );
create policy negocios_editar on public.negocios for update to authenticated
  using (dono = auth.uid() or public.sou_moderacao())
  with check (
    (dono = auth.uid() or public.sou_moderacao())
    and not exists (select 1 from unnest(fotos) f where f not like dono::text || '/%')
  );
create policy negocios_apagar on public.negocios for delete to authenticated
  using (dono = auth.uid() or public.sou_moderacao());

-- Quem edita não muda o dono nem o destaque; a edição do dono volta para a revisão.
create function public.negocios_antes_de_editar() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  new.dono := old.dono;
  if not public.sou_admin() then new.destaque_ate := old.destaque_ate; end if;
  if not public.sou_moderacao() then
    new.status := 'pendente';
    new.motivo_recusa := null;
  end if;
  return new;
end $$;
create trigger negocios_editar_t before update on public.negocios for each row execute function public.negocios_antes_de_editar();

create function public.negocios_limite() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.negocios where dono = new.dono) >= 5 then
    raise exception 'limite_negocios' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger negocios_limite_t before insert on public.negocios for each row execute function public.negocios_limite();

create function public.decidir_negocio(p_id uuid, p_aprovar boolean, p_motivo text default null) returns text
language plpgsql security definer set search_path = public as $$
declare m text := nullif(btrim(coalesce(p_motivo, '')), '');
begin
  if not public.sou_moderacao() then raise exception 'sem_permissao' using errcode = '42501'; end if;
  if not p_aprovar and m is null then raise exception 'motivo' using errcode = 'P0001'; end if;
  update public.negocios
     set status = case when p_aprovar then 'aprovado' else 'recusado' end,
         motivo_recusa = case when p_aprovar then null else left(m, 200) end
   where id = p_id;
  if not found then raise exception 'inexistente' using errcode = 'P0001'; end if;
  return case when p_aprovar then 'aprovado' else 'recusado' end;
end $$;
revoke all on function public.decidir_negocio(uuid, boolean, text) from public, anon;
grant execute on function public.decidir_negocio(uuid, boolean, text) to authenticated;

-- Destaque (plano pago fora do app): só o admin; data nula tira o destaque.
create function public.definir_destaque(p_id uuid, p_ate date) returns date
language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_admin() then raise exception 'sem_permissao' using errcode = '42501'; end if;
  update public.negocios set destaque_ate = p_ate where id = p_id;
  if not found then raise exception 'inexistente' using errcode = 'P0001'; end if;
  return p_ate;
end $$;
revoke all on function public.definir_destaque(uuid, date) from public, anon;
grant execute on function public.definir_destaque(uuid, date) to authenticated;

-- Fila da moderação (com o nome do dono).
create function public.negocios_pendentes() returns table (
  id uuid, nome text, categoria text, cidade text, beneficio_irmaos text, descricao text, dono_nome text, created_at timestamptz
) language plpgsql stable security definer set search_path = public as $$
begin
  if not public.sou_moderacao() then raise exception 'sem_permissao' using errcode = '42501'; end if;
  return query
    select n.id, n.nome, n.categoria, n.cidade, n.beneficio_irmaos, n.descricao, coalesce(p.nome, '-'), n.created_at
      from public.negocios n left join public.perfis p on p.id = n.dono
     where n.status = 'pendente' order by n.created_at limit 50;
end $$;
revoke all on function public.negocios_pendentes() from public, anon;
grant execute on function public.negocios_pendentes() to authenticated;

-- Fotos: bucket privado (só membros ativos veem; cada um envia e apaga na própria pasta).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('negocios', 'negocios', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
create policy negocios_foto_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'negocios' and public.sou_membro_ativo() and (storage.foldername(name))[1] = auth.uid()::text);
create policy negocios_foto_ver on storage.objects for select to authenticated
  using (bucket_id = 'negocios' and public.sou_membro_ativo());
create policy negocios_foto_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'negocios' and ((storage.foldername(name))[1] = auth.uid()::text or public.sou_moderacao()));

-- ================================================================ aniversário (dia e mês) e lista de membros
create table public.perfis_aniversario (
  id uuid primary key references public.perfis (id) on delete cascade,
  dia smallint not null check (dia between 1 and 31),
  mes smallint not null check (mes between 1 and 12),
  -- escondido por padrão: o irmão escolhe mostrar
  visivel boolean not null default false,
  check (dia <= case when mes = 2 then 29 when mes in (4, 6, 9, 11) then 30 else 31 end)
);
alter table public.perfis_aniversario enable row level security;
create policy aniversario_meu on public.perfis_aniversario for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Lista de membros: nome, apelido, capítulo (visíveis a todos os membros) e aniversário só se o irmão mostrou.
create function public.membros_lista() returns table (
  id uuid, nome text, apelido text, capitulo text, aniversario_dia smallint, aniversario_mes smallint
) language plpgsql stable security definer set search_path = public as $$
begin
  if not public.sou_membro_ativo() then raise exception 'sem_permissao' using errcode = '42501'; end if;
  return query
    select p.id, p.nome, p.apelido, c.nome,
           case when a.visivel then a.dia end, case when a.visivel then a.mes end
      from public.perfis p
      left join public.capitulos c on c.id = p.capitulo_id
      left join public.perfis_aniversario a on a.id = p.id
     where p.papel <> 'pendente' and p.desativado_em is null
     order by p.nome limit 2000;
end $$;
revoke all on function public.membros_lista() from public, anon;
grant execute on function public.membros_lista() to authenticated;
