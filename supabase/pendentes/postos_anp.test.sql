-- pgTAP: postos_anp legível só por membro aprovado; sem escrita pelo app; postos_proximos e pontos_na_area unem ANP + OSM.
-- Roda junto com a migration 20261113210000_postos_anp.sql (mover os dois para migrations/ e tests/ ao aplicar).
create extension if not exists pgtap with schema extensions;
begin;
select plan(15);

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-0000000000c1', 'm@teste'),
  ('a0000000-0000-0000-0000-0000000000c2', 'p@teste');
insert into public.perfis (id, nome, papel) values
  ('a0000000-0000-0000-0000-0000000000c1', 'Irmão A', 'membro'),
  ('a0000000-0000-0000-0000-0000000000c2', 'Irmão B', 'pendente');

insert into public.pontos_osm (osm_id, tipo, nome, lon, lat, uf, extras) values
  ('node/10', 'posto', 'Posto Casado', -56.1000, -15.6000, 'MT', '{"marca":"Ipiranga"}'),
  ('node/11', 'posto', 'Posto Só OSM', -56.1100, -15.6100, 'MT', '{"marca":"Shell"}'),
  ('node/12', 'posto', 'Posto Colado', -56.1200, -15.6200, 'MT', '{}'),
  ('node/13', 'museu', 'Museu', -56.1000, -15.6000, 'MT', '{}'),
  ('node/14', 'posto', 'Posto Longe', -47.9, -15.8, 'DF', '{}');

insert into public.postos_anp (cnpj, nome, bandeira, uf, lat, lng, precisao, osm_id, precos) values
  ('11111111000111', 'Posto Casado ANP', 'Ipiranga', 'MT', -15.6000, -56.1000, 'osm', 'node/10',
   '{"gasolina_comum":{"valor":6.29,"data_coleta":"2026-11-03"},"etanol":{"valor":4.19,"data_coleta":"2026-11-10"},"gnv":{"valor":4.5,"data_coleta":"2026-11-10"}}'),
  ('22222222000122', 'Posto Só ANP', null, 'MT', -15.6050, -56.1050, 'endereco', null, '{}'),
  -- 20 m do 'Posto Colado' do OSM, sem vínculo: o do OSM não deve repetir
  ('33333333000133', 'Posto Colado ANP', null, 'MT', -15.6200, -56.12018, 'endereco', null, '{}');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-0000000000c1', true);

select is((select count(*)::int from public.postos_anp), 3, 'membro lê os postos da ANP');
select throws_ok(
  $$insert into public.postos_anp (cnpj, nome, uf, lat, lng) values ('44444444000144', 'X', 'MT', -15, -56)$$,
  '42501', null, 'membro não insere');
select throws_ok($$update public.postos_anp set nome = 'Hack'$$, '42501', null, 'membro não altera');
select throws_ok($$delete from public.postos_anp$$, '42501', null, 'membro não apaga');

-- postos_proximos: ANP (3) + OSM não representados (node/11) ; node/10 (casado), node/12 (colado) e museu ficam fora
select is((select count(*)::int from public.postos_proximos(-15.60, -56.10, 15, 20)), 4, 'une ANP e OSM sem repetir');
select is((select id from public.postos_proximos(-15.60, -56.10, 15, 20) limit 1), 'anp/11111111000111',
  'o mais perto vem primeiro');
select is((select fonte from public.postos_proximos(-15.60, -56.10, 15, 20) where id = 'node/11'), 'OSM',
  'posto só do OSM aparece com fonte OSM');
select is((select precos -> 'gasolina_comum' ->> 'valor' from public.postos_proximos(-15.60, -56.10, 15, 20)
  where id = 'anp/11111111000111'), '6.29', 'devolve o preço da gasolina comum');
select ok((select not (precos ? 'gnv') from public.postos_proximos(-15.60, -56.10, 15, 20)
  where id = 'anp/11111111000111'), 'só devolve gasolina comum, etanol e diesel S10');
select is((select preco_data from public.postos_proximos(-15.60, -56.10, 15, 20) where id = 'anp/11111111000111'),
  '2026-11-10'::date, 'data do preço é a coleta mais recente');
select is((select count(*)::int from public.postos_proximos(-15.60, -56.10, 0.5, 20)), 1, 'respeita o raio (0,5 km)');
select is((select count(*)::int from public.postos_proximos(-15.60, -56.10, 15, 2)), 2, 'respeita o limite');

-- pontos_na_area: mesma assinatura; posto casado vira o da ANP; museu continua
select is((select count(*)::int from public.pontos_na_area(-56.2, -15.7, -56.0, -15.5)), 5,
  'área: 3 ANP + 1 posto só do OSM + museu');
select is((select count(*)::int from public.pontos_na_area(-56.2, -15.7, -56.0, -15.5, array['posto'])), 4,
  'filtro por tipo posto inclui os da ANP');

select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-0000000000c2', true);
select is((select count(*)::int from public.postos_anp)
  + (select count(*)::int from public.postos_proximos(-15.60, -56.10, 100, 100))
  + (select count(*)::int from public.pontos_na_area(-180, -90, 180, 90)), 0,
  'pendente não lê nada, nem pelas funções');

select * from finish();
rollback;
