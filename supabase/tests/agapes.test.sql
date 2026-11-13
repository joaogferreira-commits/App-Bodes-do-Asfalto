-- pgTAP: Ágape Relâmpago (agapes, presencas_agape, grupo temporário). Roda com `supabase test db`.
create extension if not exists pgtap with schema extensions;
begin;
select plan(12);

insert into public.capitulos (id, nome, cidade, uf, liberado) values
  ('10000000-0000-0000-0000-0000000000a1', 'Cap Ágape', 'Cuiabá', 'MT', true);
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-0000000000a1', 'criador@teste'),
  ('a0000000-0000-0000-0000-0000000000a2', 'outro@teste'),
  ('a0000000-0000-0000-0000-0000000000a3', 'pendente@teste');
insert into public.perfis (id, nome, capitulo_id, papel) values
  ('a0000000-0000-0000-0000-0000000000a1', 'Criador', '10000000-0000-0000-0000-0000000000a1', 'membro'),
  ('a0000000-0000-0000-0000-0000000000a2', 'Outro Irmão', '10000000-0000-0000-0000-0000000000a1', 'membro'),
  ('a0000000-0000-0000-0000-0000000000a3', 'Pendente', '10000000-0000-0000-0000-0000000000a1', 'pendente');

select is((select count(*) from pg_tables where schemaname = 'public' and not rowsecurity), 0::bigint,
  'todas as tabelas do schema public têm RLS');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-0000000000a1"}', true);
select lives_ok(
  $$ insert into public.agapes (id, capitulo_id, local, lat, lng, termina_em)
     values ('e0000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-0000000000a1',
             'Posto Trevo', -15.57, -56.07, now() + interval '2 hours') $$,
  'membro aprovado cria Ágape');
select throws_ok(
  $$ insert into public.agapes (local, lat, lng, termina_em) values ('Longo', -15.5, -56.0, now() + interval '13 hours') $$,
  '23514', null, 'Ágape não passa de 12 h');
select throws_ok(
  $$ insert into public.agapes (criador, local, lat, lng, termina_em)
     values ('a0000000-0000-0000-0000-0000000000a2', 'Falso', -15.5, -56.0, now() + interval '1 hour') $$,
  '42501', null, 'não cria Ágape em nome de outro');
select is((select count(*) from public.conversas where agape_id = 'e0000000-0000-0000-0000-0000000000a1'), 1::bigint,
  'o grupo do Ágape nasce com o criador dentro');

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-0000000000a2"}', true);
select is((select count(*) from public.agapes where id = 'e0000000-0000-0000-0000-0000000000a1'), 1::bigint,
  'outro membro vê o Ágape');
select is((select count(*) from public.conversas where agape_id = 'e0000000-0000-0000-0000-0000000000a1'), 0::bigint,
  'quem não confirmou não vê o grupo');
select lives_ok(
  $$ insert into public.presencas_agape (agape_id, status) values ('e0000000-0000-0000-0000-0000000000a1', 'vou') $$,
  'membro confirma "vou"');
select is((select count(*) from public.conversas where agape_id = 'e0000000-0000-0000-0000-0000000000a1'), 1::bigint,
  '"vou" entra no grupo do Ágape');
update public.presencas_agape set status = 'nao_vou' where agape_id = 'e0000000-0000-0000-0000-0000000000a1';
select is((select count(*) from public.conversas where agape_id = 'e0000000-0000-0000-0000-0000000000a1'), 0::bigint,
  '"não vou" sai do grupo');
delete from public.agapes where id = 'e0000000-0000-0000-0000-0000000000a1';

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-0000000000a3"}', true);
select is((select count(*) from public.agapes), 0::bigint, 'pendente não vê Ágapes');

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-0000000000a1"}', true);
select is((select count(*) from public.agapes where id = 'e0000000-0000-0000-0000-0000000000a1'), 1::bigint,
  'só o criador (ou moderação) apaga: o Ágape continua depois da tentativa de outro');

select * from finish();
rollback;
