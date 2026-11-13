-- pgTAP: pedidos de suporte (P12). Roda com `supabase test db` (o CI copia os pendentes).
create extension if not exists pgtap with schema extensions;
begin;
select plan(14);

insert into auth.users (id, email) values
  ('e0000000-0000-0000-0000-0000000000a1', 'a@sup'),
  ('e0000000-0000-0000-0000-0000000000a2', 'b@sup'),
  ('e0000000-0000-0000-0000-0000000000a3', 'mod@sup');
insert into public.perfis (id, nome, papel) values
  ('e0000000-0000-0000-0000-0000000000a1', 'Irmão Um', 'membro'),
  ('e0000000-0000-0000-0000-0000000000a2', 'Irmão Dois', 'membro'),
  ('e0000000-0000-0000-0000-0000000000a3', 'Moderador Sup', 'moderador');

select is((select count(*) from pg_tables where schemaname = 'public' and not rowsecurity), 0::bigint,
  'todas as tabelas do schema public têm RLS');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e0000000-0000-0000-0000-0000000000a1"}', true);

select lives_ok(
  $$ insert into public.pedidos_suporte (usuario_id, texto, categoria, dados_aparelho, print_path)
     values ('e0000000-0000-0000-0000-0000000000a1', 'O mapa travou', 'problema',
             '{"app":"0.9.0","so":"android 15","modelo":"Pixel","idioma":"pt-BR"}',
             'e0000000-0000-0000-0000-0000000000a1/print.jpg') $$,
  'o irmão cria o próprio pedido com print na própria pasta');
select throws_ok(
  $$ insert into public.pedidos_suporte (usuario_id, texto, categoria) values ('e0000000-0000-0000-0000-0000000000a2', 'x', 'duvida') $$,
  '42501', null, 'não cria pedido em nome de outro');
select throws_ok(
  $$ insert into public.pedidos_suporte (texto, categoria, print_path) values ('x', 'duvida', 'e0000000-0000-0000-0000-0000000000a2/p.jpg') $$,
  '42501', null, 'print só na própria pasta');
select throws_ok(
  $$ insert into public.pedidos_suporte (texto, categoria, status, resposta) values ('x', 'duvida', 'respondido', 'eu mesmo') $$,
  '42501', null, 'o irmão não nasce com pedido já respondido');
select throws_ok(
  $$ insert into public.pedidos_suporte (texto, categoria) values ('x', 'outra') $$,
  '23514', null, 'categoria inválida é recusada');
select throws_ok(
  $$ insert into public.pedidos_suporte (texto, categoria) values (repeat('a', 2001), 'duvida') $$,
  '23514', null, 'texto passa de 2000 caracteres: recusado');
select is((select count(*) from public.pedidos_suporte), 1::bigint, 'o dono lê o próprio pedido');
select is((select count(*) from public.pedidos_suporte where id is not null), 1::bigint, 'só o dele');
select throws_ok($$ select public.responder_suporte((select id from public.pedidos_suporte limit 1), 'ok') $$,
  '42501', 'sem_permissao', 'irmão comum não responde');

select set_config('request.jwt.claims', '{"sub":"e0000000-0000-0000-0000-0000000000a2"}', true);
select is((select count(*) from public.pedidos_suporte), 0::bigint, 'outro irmão não lê o pedido');

select set_config('request.jwt.claims', '{"sub":"e0000000-0000-0000-0000-0000000000a3"}', true);
select is((select count(*) from public.pedidos_suporte), 1::bigint, 'o moderador lê todos');
select is(public.responder_suporte((select id from public.pedidos_suporte limit 1), 'Já corrigimos.'), 'respondido',
  'o moderador responde');

select set_config('request.jwt.claims', '{"sub":"e0000000-0000-0000-0000-0000000000a1"}', true);
select is((select resposta from public.pedidos_suporte limit 1), 'Já corrigimos.', 'o dono vê a resposta');

select * from finish();
rollback;
