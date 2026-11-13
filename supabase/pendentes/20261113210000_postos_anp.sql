-- Postos de combustível da ANP (dados abertos: cadastro de revendedores + Levantamento de Preços de Combustíveis).
-- Importação feita por tools/importar_anp.py com a service_role (workflow importar-anp.yml). Membros só leem.
-- Preços vêm da amostra semanal/semestral do LPC: nem todo posto tem preço. Sempre mostrar fonte e data.

create table public.postos_anp (
  cnpj text primary key check (cnpj ~ '^[0-9]{14}$'),
  nome text not null check (char_length(nome) between 1 and 200),
  bandeira text check (bandeira is null or char_length(bandeira) <= 100),
  endereco text check (endereco is null or char_length(endereco) <= 300),
  municipio text check (municipio is null or char_length(municipio) <= 100),
  uf text not null check (uf ~ '^[A-Z]{2}$'),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  geom extensions.geometry(Point, 4326)
    generated always as (extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)) stored,
  -- como a posição foi obtida: osm (casado com ponto do OpenStreetMap), anp (coordenada do arquivo),
  -- endereco/rua/bairro (geocodificado; rua e bairro são aproximados)
  precisao text not null default 'endereco' check (precisao in ('osm', 'anp', 'endereco', 'rua', 'bairro')),
  osm_id text references public.pontos_osm (osm_id) on delete set null,
  fonte text not null default 'ANP' check (fonte = 'ANP'),
  -- {"gasolina_comum": {"valor": 6.29, "data_coleta": "2026-11-10"}, "etanol": {...}, "diesel_s10": {...}}
  precos jsonb not null default '{}'::jsonb
    check (jsonb_typeof(precos) = 'object' and pg_column_size(precos) <= 2048),
  atualizado_em timestamptz not null default now()
);

create index postos_anp_geom_idx on public.postos_anp using gist (geom);
create index postos_anp_uf_idx on public.postos_anp (uf);
create index postos_anp_osm_idx on public.postos_anp (osm_id) where osm_id is not null;

alter table public.postos_anp enable row level security;

-- Só membros aprovados e ativos leem. Nenhuma política de escrita: o app não grava (a service_role ignora a RLS).
create policy postos_anp_ler on public.postos_anp for select to authenticated
  using (public.sou_membro_ativo());

revoke all on public.postos_anp from anon, authenticated;
grant select on public.postos_anp to authenticated;

-- Último preço de cada combustível que o app mostra, com a data mais recente de coleta.
create function public.postos_proximos(
  p_lat double precision, p_lng double precision,
  raio_km double precision default 100, limite int default 20
) returns table (
  id text, nome text, bandeira text, lon double precision, lat double precision,
  distancia_km double precision, fonte text, precisao text, precos jsonb, preco_data date
)
language sql stable security invoker set search_path = public, extensions as $$
  with params as (
    select p_lat as plat, p_lng as plng, greatest(0.1, least(coalesce(raio_km, 100), 100)) as r
  ),
  alvo as (
    select plat, plng, r,
      extensions.st_setsrid(extensions.st_makepoint(plng, plat), 4326) as pt,
      r / 110.0 as dlat,
      r / (110.0 * greatest(0.2, cos(radians(plat)))) as dlng
    from params
  ),
  anp as (
    select 'anp/' || a.cnpj as id, a.nome, a.bandeira, a.lng as lon, a.lat, 'ANP'::text as fonte, a.precisao,
      (select coalesce(jsonb_object_agg(k, a.precos -> k), '{}'::jsonb)
         from unnest(array['gasolina_comum', 'etanol', 'diesel_s10']) k where a.precos ? k) as precos,
      a.geom
    from public.postos_anp a, alvo
    where a.geom && extensions.st_makeenvelope(alvo.plng - alvo.dlng, alvo.plat - alvo.dlat,
                                               alvo.plng + alvo.dlng, alvo.plat + alvo.dlat, 4326)
  ),
  osm as (
    select p.osm_id as id, p.nome, p.extras ->> 'marca' as bandeira, p.lon, p.lat, 'OSM'::text as fonte,
      'osm'::text as precisao, '{}'::jsonb as precos, p.geom
    from public.pontos_osm p, alvo
    where p.tipo = 'posto'
      and p.geom && extensions.st_makeenvelope(alvo.plng - alvo.dlng, alvo.plat - alvo.dlat,
                                               alvo.plng + alvo.dlng, alvo.plat + alvo.dlat, 4326)
      -- posto OSM já representado por um da ANP (casado, ou a menos de ~40 m dele) não repete
      and not exists (select 1 from public.postos_anp a
                      where a.osm_id = p.osm_id or extensions.st_dwithin(a.geom, p.geom, 0.00036))
  ),
  todos as (select * from anp union all select * from osm)
  select t.id, t.nome, t.bandeira, t.lon, t.lat,
    extensions.st_distance(t.geom::extensions.geography, alvo.pt::extensions.geography) / 1000.0 as distancia_km,
    t.fonte, t.precisao, t.precos,
    (select max((v ->> 'data_coleta')::date) from jsonb_each(t.precos) e(k, v)) as preco_data
  from todos t, alvo
  where extensions.st_dwithin(t.geom::extensions.geography, alvo.pt::extensions.geography, alvo.r * 1000)
  order by distancia_km, t.id
  limit greatest(1, least(coalesce(limite, 20), 100))
$$;

revoke execute on function public.postos_proximos(double precision, double precision, double precision, int) from public, anon;
grant execute on function public.postos_proximos(double precision, double precision, double precision, int) to authenticated;

-- pontos_na_area continua com a mesma assinatura. Agora, para o tipo 'posto', troca os postos do OSM que a ANP já cobre
-- pelos da ANP (com preço, bandeira e fonte nos extras) e acrescenta os da ANP que o OSM não tem.
create or replace function public.pontos_na_area(
  min_lon double precision, min_lat double precision,
  max_lon double precision, max_lat double precision,
  tipos text[] default null, limite int default 500
) returns table (id text, tipo text, nome text, lon double precision, lat double precision, extras jsonb)
language sql stable security invoker set search_path = public, extensions as $$
  with caixa as (select extensions.st_makeenvelope(min_lon, min_lat, max_lon, max_lat, 4326) as g),
  todos as (
    select p.osm_id as id, p.tipo, p.nome, p.lon, p.lat, p.extras
    from public.pontos_osm p, caixa
    where p.geom && caixa.g
      and (tipos is null or p.tipo = any (tipos))
      and not (p.tipo = 'posto' and exists (
        select 1 from public.postos_anp a
        where a.osm_id = p.osm_id or extensions.st_dwithin(a.geom, p.geom, 0.00036)))
    union all
    select 'anp/' || a.cnpj, 'posto', a.nome, a.lng, a.lat,
      jsonb_strip_nulls(jsonb_build_object(
        'fonte', 'ANP', 'marca', a.bandeira, 'endereco', a.endereco, 'precisao', a.precisao,
        'precos', a.precos))
    from public.postos_anp a, caixa
    where a.geom && caixa.g and (tipos is null or 'posto' = any (tipos))
  )
  select t.id, t.tipo, t.nome, t.lon, t.lat, t.extras
  from todos t
  order by
    -- mais próximos do centro da área primeiro
    ((t.lon - (min_lon + max_lon) / 2) ^ 2 + (t.lat - (min_lat + max_lat) / 2) ^ 2),
    t.id
  limit greatest(1, least(coalesce(limite, 500), 1000))
$$;
