-- pgTAP: SOS real (sos_ativos, iniciar_sos, atualizar_posicao_sos, encerrar_sos). Roda com `supabase test db`.
create extension if not exists pgtap with schema extensions;
begin;
select plan(16);

insert into public.capitulos (id, nome, cidade, uf, liberado) values
  ('10000000-0000-0000-0000-0000000000b1', 'Cap SOS', 'Cuiabá', 'MT', true),
  ('10000000-0000-0000-0000-0000000000b2', 'Outro Cap', 'Sinop', 'MT', true);
insert into auth.users (id, email) values
  ('b0000000-0000-0000-0000-0000000000b1', 'dono@sos'),
  ('b0000000-0000-0000-0000-0000000000b2', 'grupo@sos'),
  ('b0000000-0000-0000-0000-0000000000b3', 'diretor@sos'),
  ('b0000000-0000-0000-0000-0000000000b4', 'estranho@sos'),
  ('b0000000-0000-0000-0000-0000000000b5', 'moderador@sos'),
  ('b0000000-0000-0000-0000-0000000000b6', 'grupovelho@sos');
insert into public.perfis (id, nome, apelido, capitulo_id, papel) values
  ('b0000000-0000-0000-0000-0000000000b1', 'Dono do SOS', 'Zezão', '10000000-0000-0000-0000-0000000000b1', 'membro'),
  ('b0000000-0000-0000-0000-0000000000b2', 'Irmão do Grupo', null, '10000000-0000-0000-0000-0000000000b1', 'membro'),
  ('b0000000-0000-0000-0000-0000000000b3', 'Diretor Local', null, '10000000-0000-0000-0000-0000000000b1', 'diretoria_capitulo'),
  ('b0000000-0000-0000-0000-0000000000b4', 'Estranho Longe', null, '10000000-0000-0000-0000-0000000000b2', 'membro'),
  ('b0000000-0000-0000-0000-0000000000b5', 'Moderador', null, '10000000-0000-0000-0000-0000000000b2', 'moderador'),
  ('b0000000-0000-0000-0000-0000000000b6', 'Grupo Vencido', null, '10000000-0000-0000-0000-0000000000b2', 'membro');
-- comboio ativo (dono + b2) e comboio já encerrado (dono + b6)
insert into public.conversas (id, tipo, titulo, termina_em) values
  ('c0000000-0000-0000-0000-0000000000b1', 'comboio', 'Comboio de hoje', now() + interval '3 hours'),
  ('c0000000-0000-0000-0000-0000000000b2', 'comboio', 'Comboio de ontem', now() - interval '1 hour');
insert into public.participantes (conversa_id, usuario_id) values
  ('c0000000-0000-0000-0000-0000000000b1', 'b0000000-0000-0000-0000-0000000000b1'),
  ('c0000000-0000-0000-0000-0000000000b1', 'b0000000-0000-0000-0000-0000000000b2'),
  ('c0000000-0000-0000-0000-0000000000b2', 'b0000000-0000-0000-0000-0000000000b1'),
  ('c0000000-0000-0000-0000-0000000000b2', 'b0000000-0000-0000-0000-0000000000b6');

select is((select count(*) from pg_tables where schemaname = 'public' and not rowsecurity), 0::bigint,
  'todas as tabelas do schema public têm RLS');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-0000000000b1"}', true);
create temp table guarda (id uuid);
insert into guarda select public.iniciar_sos('pane', 'Moto parou', -15.6, -56.1);
select is((select count(*) from guarda where id is not null), 1::bigint, 'iniciar_sos devolve o id');
select is((select count(*) from public.sos_ativos where usuario_id = 'b0000000-0000-0000-0000-0000000000b1' and encerrado_em is null), 1::bigint,
  'o dono lê o próprio SOS ativo');
select throws_ok(
  $$ insert into public.sos_ativos (usuario_id, lat, lng) values ('b0000000-0000-0000-0000-0000000000b2', 0, 0) $$,
  '42501', null, 'não cria SOS em nome de outro');
select throws_ok(
  $$ select public.iniciar_sos('tipo_invalido', null, 0, 0) $$,
  '23514', null, 'tipo de ajuda inválido é recusado');
select is((select count(*) from public.sos_ativos where usuario_id = 'b0000000-0000-0000-0000-0000000000b1' and encerrado_em is null), 1::bigint,
  'um erro não deixa dois SOS ativos (fica só um)');

select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-0000000000b2"}', true);
select is((select count(*) from public.sos_ativos), 1::bigint, 'irmão do grupo ativo lê o SOS');
select is((select lat from public.sos_ativos limit 1), -15.6::double precision, 'e vê a posição exata');
select is(public.atualizar_posicao_sos((select id from guarda), 1, 1), false, 'outro irmão não atualiza a posição');

select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-0000000000b3"}', true);
select is((select count(*) from public.sos_ativos), 1::bigint, 'a diretoria do capítulo lê o SOS');

select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-0000000000b5"}', true);
select is((select count(*) from public.sos_ativos), 1::bigint, 'o moderador lê o SOS');

select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-0000000000b4"}', true);
select is((select count(*) from public.sos_ativos), 0::bigint, 'estranho de outro capítulo e fora do grupo não lê');
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-0000000000b6"}', true);
select is((select count(*) from public.sos_ativos), 0::bigint, 'quem só está em grupo já encerrado não lê');

select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-0000000000b1"}', true);
select is(public.atualizar_posicao_sos((select id from guarda), -15.7, -56.2), true, 'o dono atualiza a posição');
select is(public.encerrar_sos((select id from guarda)), true, 'o dono encerra o SOS');

select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-0000000000b2"}', true);
select is((select count(*) from public.sos_ativos), 0::bigint, 'depois de encerrado, o grupo não vê mais a posição');

select * from finish();
rollback;
