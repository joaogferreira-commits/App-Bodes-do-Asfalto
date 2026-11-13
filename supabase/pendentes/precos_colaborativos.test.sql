-- pgTAP: preços colaborativos. Roda junto com a migration 20261113230000_precos_colaborativos.sql.
create extension if not exists pgtap with schema extensions;
begin;
select plan(12);

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-0000000000d1', 'm@teste'),
  ('a0000000-0000-0000-0000-0000000000d2', 'p@teste'),
  ('a0000000-0000-0000-0000-0000000000d3', 'n@teste');
insert into public.perfis (id, nome, papel) values
  ('a0000000-0000-0000-0000-0000000000d1', 'Irmão A', 'membro'),
  ('a0000000-0000-0000-0000-0000000000d2', 'Irmão B', 'pendente'),
  ('a0000000-0000-0000-0000-0000000000d3', 'Irmão C', 'membro');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-0000000000d1', true);

select lives_ok($$insert into public.precos_colaborativos (posto_id, produto, valor) values ('node/1', 'gasolina_comum', 6.29)$$,
  'membro informa preço');
select is((select informado_por from public.precos_colaborativos limit 1), 'a0000000-0000-0000-0000-0000000000d1'::uuid,
  'autor padrão é quem enviou');
select throws_ok($$insert into public.precos_colaborativos (posto_id, produto, valor, informado_por) values ('node/1', 'etanol', 4.5, 'a0000000-0000-0000-0000-0000000000d3')$$,
  '42501', null, 'não informa em nome de outro');
select throws_ok($$insert into public.precos_colaborativos (posto_id, produto, valor) values ('node/1', 'etanol', 99)$$,
  '23514', null, 'valor fora da faixa');
select throws_ok($$insert into public.precos_colaborativos (posto_id, produto, valor) values ('node/1', 'gnv', 4)$$,
  '23514', null, 'produto inválido');
select throws_ok($$insert into public.precos_colaborativos (posto_id, produto, valor) values ('qualquer', 'etanol', 4)$$,
  '23514', null, 'id de posto inválido');
select lives_ok($$insert into public.precos_colaborativos (posto_id, produto, valor) values ('anp/11111111000111', 'etanol', 4.19)$$,
  'aceita id da ANP');

select throws_ok($$update public.precos_colaborativos set valor = 1$$, '42501', null, 'sem update');
select is((select valor from public.ultimos_precos(array['node/1']) where produto = 'gasolina_comum'), 6.29,
  'ultimos_precos devolve o último');

-- limite de 20 por dia
select lives_ok($$insert into public.precos_colaborativos (posto_id, produto, valor)
  select 'node/2', 'diesel', 6 from generate_series(1, 18)$$, 'chega a 20');
select throws_ok($$insert into public.precos_colaborativos (posto_id, produto, valor) values ('node/2', 'diesel', 6)$$,
  'P0001', null, 'passou de 20 no dia');

select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-0000000000d2', true);
select is((select count(*)::int from public.precos_colaborativos), 0, 'pendente não lê');

select * from finish();
rollback;
