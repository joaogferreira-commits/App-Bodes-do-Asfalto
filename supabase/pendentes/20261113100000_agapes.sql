-- P8: Ágape Relâmpago real. Encontro rápido marcado por um irmão num lugar, visível aos membros enquanto durar (até 12 h).
-- A posição é a do ponto de encontro (não a do irmão). "Vou" entra no grupo temporário do Ágape.

create table public.agapes (
  id uuid primary key default gen_random_uuid(),
  criador uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  capitulo_id uuid references public.capitulos (id),
  local text not null check (char_length(local) between 2 and 120),
  texto text check (char_length(texto) <= 500),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  comeca_em timestamptz not null default now(),
  termina_em timestamptz not null,
  criado_em timestamptz not null default now(),
  check (termina_em > comeca_em and termina_em <= comeca_em + interval '12 hours')
);
create index agapes_termina on public.agapes (termina_em);

create table public.presencas_agape (
  agape_id uuid not null references public.agapes (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  status text not null check (status in ('vou', 'nao_vou')),
  atualizado_em timestamptz not null default now(),
  primary key (agape_id, usuario_id)
);

alter table public.agapes enable row level security;
alter table public.presencas_agape enable row level security;

-- membros ativos veem os Ágapes ainda não encerrados; quem criou vê sempre o seu
create policy agapes_ler on public.agapes for select to authenticated
  using (public.sou_membro_ativo() and (termina_em > now() or criador = auth.uid()));
create policy agapes_criar on public.agapes for insert to authenticated
  with check (criador = auth.uid() and public.sou_membro_ativo());
create policy agapes_apagar on public.agapes for delete to authenticated
  using (criador = auth.uid() or public.sou_moderacao());

create policy presencas_agape_ler on public.presencas_agape for select to authenticated
  using (public.sou_membro_ativo());
create policy presencas_agape_marcar on public.presencas_agape for insert to authenticated
  with check (usuario_id = auth.uid() and public.sou_membro_ativo()
              and exists (select 1 from public.agapes a where a.id = agape_id and a.termina_em > now()));
create policy presencas_agape_mudar on public.presencas_agape for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy presencas_agape_desmarcar on public.presencas_agape for delete to authenticated
  using (usuario_id = auth.uid());
revoke update on public.presencas_agape from authenticated;
grant update (status) on public.presencas_agape to authenticated;

-- Grupo temporário do Ágape: reaproveita conversas (tipo 'agape'), ligado ao Ágape.
alter table public.conversas add column agape_id uuid references public.agapes (id) on delete cascade;
create unique index conversa_agape_unica on public.conversas (agape_id) where tipo = 'agape';

-- Ao criar o Ágape: nasce o grupo, com o criador dentro.
create function public.agape_criado() returns trigger
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  insert into public.conversas (tipo, titulo, capitulo_id, agape_id, termina_em)
    values ('agape', new.local, new.capitulo_id, new.id, new.termina_em)
    returning id into cid;
  insert into public.participantes (conversa_id, usuario_id) values (cid, new.criador) on conflict do nothing;
  insert into public.presencas_agape (agape_id, usuario_id, status) values (new.id, new.criador, 'vou')
    on conflict do nothing;
  return null;
end $$;
create trigger agapes_grupo after insert on public.agapes
  for each row execute function public.agape_criado();

-- "Vou" entra no grupo; "não vou" ou desmarcar sai (o criador continua).
create function public.presenca_agape_grupo() returns trigger
language plpgsql security definer set search_path = public as $$
declare cid uuid; quem uuid; ag uuid; vai boolean;
begin
  if tg_op = 'DELETE' then
    quem := old.usuario_id; ag := old.agape_id; vai := false;
  else
    quem := new.usuario_id; ag := new.agape_id; vai := new.status = 'vou';
  end if;
  select id into cid from public.conversas where tipo = 'agape' and agape_id = ag;
  if cid is null then return null; end if;
  if vai then
    insert into public.participantes (conversa_id, usuario_id) values (cid, quem) on conflict do nothing;
  elsif quem <> (select criador from public.agapes where id = ag) then
    delete from public.participantes where conversa_id = cid and usuario_id = quem;
  end if;
  return null;
end $$;
create trigger presencas_agape_grupo after insert or update or delete on public.presencas_agape
  for each row execute function public.presenca_agape_grupo();

-- Limpeza: Ágapes encerrados há mais de 1 dia somem (o grupo vai junto, por cascata).
create function public.limpar_agapes() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.agapes where termina_em < now() - interval '1 day';
end $$;
revoke all on function public.limpar_agapes() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    begin
      create extension if not exists pg_cron;
      perform cron.schedule('limpar-agapes', '23 * * * *', 'select public.limpar_agapes()');
    exception when others then
      raise notice 'pg_cron indisponível (%): agende public.limpar_agapes() manualmente', sqlerrm;
    end;
  else
    raise notice 'pg_cron não disponível: agende public.limpar_agapes() manualmente';
  end if;
end $$;
