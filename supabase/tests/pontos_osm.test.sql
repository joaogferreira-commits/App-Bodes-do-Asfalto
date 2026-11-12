-- pgTAP: pontos_osm legível só por membro aprovado; sem escrita pelo app; RPC filtra pela área.
create extension if not exists pgtap with schema extensions;
begin;
select plan(7);

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-0000000000b1', 'm@teste'),
  ('a0000000-0000-0000-0000-0000000000b2', 'p@teste');
insert into public.perfis (id, nome, papel) values
  ('a0000000-0000-0000-0000-0000000000b1', 'Irmão A', 'membro'),
  ('a0000000-0000-0000-0000-0000000000b2', 'Irmão B', 'pendente');

insert into public.pontos_osm (osm_id, tipo, nome, lon, lat, uf) values
  ('node/1', 'posto', 'Posto Dentro', -56.10, -15.60, 'MT'),
  ('node/2', 'cachoeira', 'Cachoeira Dentro', -56.05, -15.55, 'MT'),
  ('node/3', 'posto', 'Posto Fora', -47.90, -15.80, 'DF');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-0000000000b1', true);

select is((select count(*)::int from public.pontos_osm), 3, 'membro lê os pontos');
select is((select count(*)::int from public.pontos_na_area(-56.2, -15.7, -56.0, -15.5)), 2, 'RPC devolve só os pontos da área');
select is((select count(*)::int from public.pontos_na_area(-56.2, -15.7, -56.0, -15.5, array['posto'])), 1, 'RPC filtra por tipo');
select throws_ok(
  $$insert into public.pontos_osm (osm_id, tipo, nome, lon, lat, uf) values ('node/9', 'posto', 'X', -56, -15, 'MT')$$,
  '42501', null, 'membro não insere');
select throws_ok($$update public.pontos_osm set nome = 'Hack'$$, '42501', null, 'membro não altera');

select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-0000000000b2', true);
select is((select count(*)::int from public.pontos_osm), 0, 'pendente não lê');
select is((select count(*)::int from public.pontos_na_area(-180, -90, 180, 90)), 0, 'pendente não recebe nada pela RPC');

select * from finish();
rollback;
