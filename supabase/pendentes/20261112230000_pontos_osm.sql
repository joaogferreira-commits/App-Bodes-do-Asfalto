-- Pontos do mapa vindos do OpenStreetMap (ODbL; atribuição já exibida no app).
-- Importação feita por tools/importar_pois_osm.py com a service_role. Membros só leem.
create extension if not exists postgis with schema extensions;

create table public.pontos_osm (
  osm_id text primary key check (osm_id ~ '^(node|way|relation)/[0-9]+$'),
  tipo text not null check (tipo in (
    'posto', 'oficina_moto', 'borracharia', 'cachoeira', 'mirante', 'museu', 'monumento',
    'atracao', 'praia', 'parque', 'igreja_historica', 'hospedagem', 'camping',
    'hospital', 'policia_rodoviaria')),
  nome text not null check (char_length(nome) between 1 and 200),
  lon double precision not null check (lon between -180 and 180),
  lat double precision not null check (lat between -90 and 90),
  geom extensions.geometry(Point, 4326)
    generated always as (extensions.st_setsrid(extensions.st_makepoint(lon, lat), 4326)) stored,
  uf text not null check (uf ~ '^[A-Z]{2}$'),
  cidade text,
  extras jsonb not null default '{}'::jsonb check (jsonb_typeof(extras) = 'object' and pg_column_size(extras) <= 1024),
  atualizado_em timestamptz not null default now()
);

create index pontos_osm_geom_idx on public.pontos_osm using gist (geom);
create index pontos_osm_tipo_idx on public.pontos_osm (tipo);
create index pontos_osm_uf_idx on public.pontos_osm (uf);

alter table public.pontos_osm enable row level security;

-- Só membros aprovados e ativos leem. Nenhuma política de escrita: o app não grava (a service_role ignora a RLS).
create policy pontos_osm_ler on public.pontos_osm for select to authenticated
  using (public.sou_membro_ativo());

revoke all on public.pontos_osm from anon, authenticated;
grant select on public.pontos_osm to authenticated;

create function public.pontos_na_area(
  min_lon double precision, min_lat double precision,
  max_lon double precision, max_lat double precision,
  tipos text[] default null, limite int default 500
) returns table (id text, tipo text, nome text, lon double precision, lat double precision, extras jsonb)
language sql stable security invoker set search_path = public, extensions as $$
  select p.osm_id, p.tipo, p.nome, p.lon, p.lat, p.extras
  from public.pontos_osm p
  where p.geom && extensions.st_makeenvelope(min_lon, min_lat, max_lon, max_lat, 4326)
    and (tipos is null or p.tipo = any (tipos))
  order by
    -- mais próximos do centro da área primeiro
    ((p.lon - (min_lon + max_lon) / 2) ^ 2 + (p.lat - (min_lat + max_lat) / 2) ^ 2),
    p.osm_id
  limit greatest(1, least(coalesce(limite, 500), 1000))
$$;

revoke execute on function public.pontos_na_area(double precision, double precision, double precision, double precision, text[], int) from public, anon;
grant execute on function public.pontos_na_area(double precision, double precision, double precision, double precision, text[], int) to authenticated;
