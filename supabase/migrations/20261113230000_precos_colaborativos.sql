-- Preços de combustível informados pelos irmãos (colaborativo), sempre com data. Complementam a ANP, não a substituem.
-- posto_id usa os mesmos ids do app: 'node/123' (OpenStreetMap) ou 'anp/<cnpj de 14 dígitos>'.

create table public.precos_colaborativos (
  id uuid primary key default gen_random_uuid(),
  posto_id text not null check (posto_id ~ '^(anp/[0-9]{14}|(node|way|relation)/[0-9]+)$'),
  produto text not null check (produto in ('gasolina_comum', 'etanol', 'diesel_s10', 'diesel')),
  valor numeric(6, 2) not null check (valor between 1 and 30),
  informado_por uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now()
);

create index precos_colaborativos_posto_idx on public.precos_colaborativos (posto_id, produto, criado_em desc);
create index precos_colaborativos_autor_idx on public.precos_colaborativos (informado_por, criado_em desc);

alter table public.precos_colaborativos enable row level security;

create policy precos_colaborativos_ler on public.precos_colaborativos for select to authenticated
  using (public.sou_membro_ativo());
create policy precos_colaborativos_inserir on public.precos_colaborativos for insert to authenticated
  with check (public.sou_membro_ativo() and informado_por = auth.uid());
-- Sem update; apagar só a moderação.
create policy precos_colaborativos_apagar on public.precos_colaborativos for delete to authenticated
  using (public.sou_moderacao());

revoke all on public.precos_colaborativos from anon, authenticated;
grant select, insert, delete on public.precos_colaborativos to authenticated;

-- Limite diário por membro (evita spam e preço falso em massa).
create function public.limitar_precos_colaborativos() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.precos_colaborativos
      where informado_por = new.informado_por and criado_em > now() - interval '1 day') >= 20 then
    raise exception 'limite diário de preços informados' using errcode = 'P0001';
  end if;
  return new;
end
$$;

create trigger precos_colaborativos_limite before insert on public.precos_colaborativos
  for each row execute function public.limitar_precos_colaborativos();

-- Último preço de cada produto por posto, nos últimos 30 dias.
create function public.ultimos_precos(p_posto_ids text[])
returns table (posto_id text, produto text, valor numeric, criado_em timestamptz)
language sql stable security invoker set search_path = public as $$
  select distinct on (c.posto_id, c.produto) c.posto_id, c.produto, c.valor, c.criado_em
  from public.precos_colaborativos c
  where c.posto_id = any (p_posto_ids[1:50])
    and c.criado_em > now() - interval '30 days'
  order by c.posto_id, c.produto, c.criado_em desc
$$;

revoke execute on function public.ultimos_precos(text[]) from public, anon;
grant execute on function public.ultimos_precos(text[]) to authenticated;
