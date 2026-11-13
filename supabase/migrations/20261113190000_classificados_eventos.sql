-- Classificados (compra e venda entre irmãos) e Eventos (Lojas, Potências, eventos maçônicos, motoclubes).
-- AGUARDA o CI verde (pgTAP) e entra em migrations/ pelo workflow, conforme a autorização permanente do dono.
--
-- Regras:
--  * Classificados: sem aprovação prévia (moderação por denúncia, depois de publicado). No máximo 5 anúncios ativos por irmão.
--    O contato é por aceno/chat; o WhatsApp é opcional e só membros ativos leem a tabela. Nenhum pagamento passa pelo app.
--    Fotos em bucket privado (só membros). O anúncio expira em 60 dias (o servidor fixa a data).
--  * Eventos: divulgação gratuita, cadastrada por qualquer irmão, aprovada pela moderação (decidir_evento). No máximo 3 por dia.

-- ================================================================ classificados
create table public.classificados (
  id uuid primary key default gen_random_uuid(),
  autor uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  titulo text not null check (char_length(btrim(titulo)) between 3 and 80),
  descricao text check (descricao is null or char_length(descricao) <= 1000),
  preco numeric(12, 2) check (preco is null or preco >= 0),
  categoria text not null check (categoria in ('moto', 'pecas', 'equipamento', 'vestuario', 'outro')),
  cidade text not null check (char_length(btrim(cidade)) between 2 and 80),
  -- caminhos no bucket "classificados" (pasta do autor)
  fotos text[] not null default '{}' check (cardinality(fotos) <= 6),
  whatsapp text check (whatsapp is null or char_length(whatsapp) <= 30),
  status text not null default 'ativo' check (status in ('ativo', 'vendido', 'removido')),
  expira_em timestamptz not null default now() + interval '60 days',
  created_at timestamptz not null default now()
);
create index classificados_lista on public.classificados (status, expira_em);
create index classificados_autor on public.classificados (autor);
alter table public.classificados enable row level security;

create policy classificados_ler on public.classificados for select to authenticated
  using (
    public.sou_membro_ativo()
    and ((status = 'ativo' and expira_em > now()) or autor = auth.uid() or public.sou_moderacao())
  );
create policy classificados_criar on public.classificados for insert to authenticated
  with check (
    public.sou_membro_ativo() and autor = auth.uid() and status = 'ativo'
    and not exists (select 1 from unnest(fotos) f where f not like auth.uid()::text || '/%')
  );
create policy classificados_editar on public.classificados for update to authenticated
  using (autor = auth.uid() or public.sou_moderacao())
  with check (
    (autor = auth.uid() and status in ('ativo', 'vendido') or public.sou_moderacao())
    and not exists (select 1 from unnest(fotos) f where f not like autor::text || '/%')
  );
create policy classificados_apagar on public.classificados for delete to authenticated
  using (autor = auth.uid() or public.sou_moderacao());

-- Insert: o servidor fixa a validade (60 dias) e limita a 5 anúncios ativos por irmão.
create function public.classificados_antes_de_criar() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.expira_em := now() + interval '60 days';
  new.created_at := now();
  if (select count(*) from public.classificados
       where autor = new.autor and status = 'ativo' and expira_em > now()) >= 5 then
    raise exception 'limite_ativos' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger classificados_criar_t before insert on public.classificados for each row execute function public.classificados_antes_de_criar();

-- Update: ninguém troca o autor nem a validade; anúncio removido pela moderação não volta pelas mãos do autor;
-- voltar de "vendido" para "ativo" também respeita o limite de 5.
create function public.classificados_antes_de_editar() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  new.autor := old.autor;
  new.created_at := old.created_at;
  if not public.sou_moderacao() then
    new.expira_em := old.expira_em;
    if old.status = 'removido' then new.status := 'removido'; end if;
  end if;
  if old.status <> 'ativo' and new.status = 'ativo' and old.status <> 'removido' then
    if (select count(*) from public.classificados
         where autor = new.autor and status = 'ativo' and expira_em > now() and id <> new.id) >= 5 then
      raise exception 'limite_ativos' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
create trigger classificados_editar_t before update on public.classificados for each row execute function public.classificados_antes_de_editar();

-- Fotos: bucket privado (só membros ativos veem; cada um envia e apaga na própria pasta).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('classificados', 'classificados', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
create policy classificados_foto_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'classificados' and public.sou_membro_ativo() and (storage.foldername(name))[1] = auth.uid()::text);
create policy classificados_foto_ver on storage.objects for select to authenticated
  using (bucket_id = 'classificados' and public.sou_membro_ativo());
create policy classificados_foto_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'classificados' and ((storage.foldername(name))[1] = auth.uid()::text or public.sou_moderacao()));

-- ================================================================ denúncias: anúncio do classificado
alter table public.denuncias drop constraint denuncias_alvo_tipo_check;
alter table public.denuncias add constraint denuncias_alvo_tipo_check
  check (alvo_tipo in ('post', 'comentario', 'mensagem', 'story', 'usuario', 'classificado'));

create or replace function public.denuncias_preencher() returns trigger
language plpgsql security definer set search_path = public as $$
declare a uuid; t text; ok boolean := false;
begin
  if new.alvo_tipo = 'post' then
    select p.autor, left(p.texto, 300), public.pode_ver_post(p.autor, p.visibilidade, p.capitulo_id)
      into a, t, ok from public.posts p where p.id = new.alvo_id;
  elsif new.alvo_tipo = 'comentario' then
    select c.autor, left(c.texto, 300), public.pode_ver_post(p.autor, p.visibilidade, p.capitulo_id)
      into a, t, ok from public.comentarios c join public.posts p on p.id = c.post_id where c.id = new.alvo_id;
  elsif new.alvo_tipo = 'mensagem' then
    select m.autor, left(m.texto, 300), public.eh_participante(m.conversa_id)
      into a, t, ok from public.mensagens m where m.id = new.alvo_id;
  elsif new.alvo_tipo = 'story' then
    select s.autor, left(coalesce(s.conteudo ->> 'texto', ''), 300), (s.expira_em > now() and public.sou_membro_ativo())
      into a, t, ok from public.stories s where s.id = new.alvo_id;
  elsif new.alvo_tipo = 'classificado' then
    select c.autor, left(c.titulo, 300),
           (c.status = 'ativo' and c.expira_em > now() and public.sou_membro_ativo())
      into a, t, ok from public.classificados c where c.id = new.alvo_id;
  else
    select p.id, null, public.sou_membro_ativo()
      into a, t, ok from public.perfis p where p.id = new.alvo_id;
  end if;
  if a is null or not coalesce(ok, false) then raise exception 'alvo não encontrado'; end if;
  new.alvo_autor := a;
  new.trecho := t;
  new.capitulo_id := (select capitulo_id from public.perfis where id = a);
  return new;
end $$;

create or replace function public.moderar_denuncia(den uuid, procedente boolean, apagar boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare d public.denuncias;
begin
  if not public.sou_moderacao() then raise exception 'só a moderação decide denúncias'; end if;
  select * into d from public.denuncias where id = den and status = 'aberta';
  if not found then raise exception 'denúncia não encontrada ou já decidida'; end if;
  update public.denuncias
     set status = case when procedente then 'procedente' else 'improcedente' end,
         decidido_por = auth.uid(), decidido_em = now()
   where id = den;
  if procedente and apagar then
    if d.alvo_tipo = 'post' then delete from public.posts where id = d.alvo_id;
    elsif d.alvo_tipo = 'comentario' then delete from public.comentarios where id = d.alvo_id;
    elsif d.alvo_tipo = 'mensagem' then delete from public.mensagens where id = d.alvo_id;
    elsif d.alvo_tipo = 'story' then delete from public.stories where id = d.alvo_id;
    elsif d.alvo_tipo = 'classificado' then update public.classificados set status = 'removido' where id = d.alvo_id;
    end if;
  end if;
end $$;

-- ================================================================ eventos
create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  autor uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  titulo text not null check (char_length(btrim(titulo)) between 3 and 120),
  descricao text check (descricao is null or char_length(descricao) <= 1000),
  tipo text not null check (tipo in ('loja', 'potencia', 'maconico', 'motoclube', 'outro')),
  inicio timestamptz not null,
  fim timestamptz,
  local text check (local is null or char_length(local) <= 160),
  cidade text not null check (char_length(btrim(cidade)) between 2 and 80),
  lat double precision check (lat is null or lat between -90 and 90),
  lng double precision check (lng is null or lng between -180 and 180),
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado')),
  motivo_recusa text check (motivo_recusa is null or char_length(motivo_recusa) <= 200),
  created_at timestamptz not null default now(),
  check (fim is null or fim >= inicio),
  check ((lat is null) = (lng is null))
);
create index eventos_lista on public.eventos (status, inicio);
create index eventos_autor on public.eventos (autor);
alter table public.eventos enable row level security;

-- Aprovado e ainda por vir ou em andamento (sem hora de fim, vale por 12 h a partir do início).
create policy eventos_ler on public.eventos for select to authenticated
  using (
    public.sou_membro_ativo()
    and (
      (status = 'aprovado' and coalesce(fim, inicio + interval '12 hours') >= now())
      or autor = auth.uid() or public.sou_moderacao()
    )
  );
create policy eventos_criar on public.eventos for insert to authenticated
  with check (public.sou_membro_ativo() and autor = auth.uid() and status = 'pendente' and motivo_recusa is null);
create policy eventos_editar on public.eventos for update to authenticated
  using (autor = auth.uid() or public.sou_moderacao())
  with check (autor = auth.uid() or public.sou_moderacao());
create policy eventos_apagar on public.eventos for delete to authenticated
  using (autor = auth.uid() or public.sou_moderacao());

-- A edição do autor volta o evento para a revisão; a moderação edita sem mudar o estado.
create function public.eventos_antes_de_editar() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.sou_moderacao() then return new; end if;
  new.autor := old.autor;
  new.status := 'pendente';
  new.motivo_recusa := null;
  return new;
end $$;
create trigger eventos_editar_t before update on public.eventos for each row execute function public.eventos_antes_de_editar();

-- No máximo 3 eventos por dia por irmão.
create function public.eventos_limite() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.eventos where autor = new.autor and created_at > now() - interval '1 day') >= 3 then
    raise exception 'limite_diario' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger eventos_limite_t before insert on public.eventos for each row execute function public.eventos_limite();

-- Fila da moderação (com o nome de quem cadastrou).
create function public.eventos_pendentes() returns table (
  id uuid, titulo text, tipo text, inicio timestamptz, fim timestamptz, local text, cidade text, descricao text,
  autor_nome text, created_at timestamptz
) language plpgsql stable security definer set search_path = public as $$
begin
  if not public.sou_moderacao() then raise exception 'sem_permissao' using errcode = '42501'; end if;
  return query
    select e.id, e.titulo, e.tipo, e.inicio, e.fim, e.local, e.cidade, e.descricao, coalesce(p.nome, '-'), e.created_at
      from public.eventos e left join public.perfis p on p.id = e.autor
     where e.status = 'pendente' order by e.created_at limit 50;
end $$;
revoke all on function public.eventos_pendentes() from public, anon;
grant execute on function public.eventos_pendentes() to authenticated;

create function public.decidir_evento(p_id uuid, p_aprovar boolean, p_motivo text default null) returns text
language plpgsql security definer set search_path = public as $$
declare m text := nullif(btrim(coalesce(p_motivo, '')), '');
begin
  if not public.sou_moderacao() then raise exception 'sem_permissao' using errcode = '42501'; end if;
  if not p_aprovar and m is null then raise exception 'motivo' using errcode = 'P0001'; end if;
  update public.eventos
     set status = case when p_aprovar then 'aprovado' else 'recusado' end,
         motivo_recusa = case when p_aprovar then null else left(m, 200) end
   where id = p_id;
  if not found then raise exception 'inexistente' using errcode = 'P0001'; end if;
  return case when p_aprovar then 'aprovado' else 'recusado' end;
end $$;
revoke all on function public.decidir_evento(uuid, boolean, text) from public, anon;
grant execute on function public.decidir_evento(uuid, boolean, text) to authenticated;
