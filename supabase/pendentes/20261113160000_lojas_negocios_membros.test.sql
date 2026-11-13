-- pgTAP: Lojas, negócios de irmãos, aniversário e lista de membros. Roda com `supabase test db` (o CI copia os pendentes).
create extension if not exists pgtap with schema extensions;
begin;
select plan(40);

insert into auth.users (id, email) values
  ('f0000000-0000-0000-0000-0000000000a1', 'a@ln'),
  ('f0000000-0000-0000-0000-0000000000a2', 'b@ln'),
  ('f0000000-0000-0000-0000-0000000000a3', 'mod@ln'),
  ('f0000000-0000-0000-0000-0000000000a4', 'adm@ln'),
  ('f0000000-0000-0000-0000-0000000000a5', 'pend@ln');
insert into public.perfis (id, nome, apelido, papel) values
  ('f0000000-0000-0000-0000-0000000000a1', 'Irmão Um', 'Um', 'membro'),
  ('f0000000-0000-0000-0000-0000000000a2', 'Irmão Dois', null, 'membro'),
  ('f0000000-0000-0000-0000-0000000000a3', 'Moderador Ln', null, 'moderador'),
  ('f0000000-0000-0000-0000-0000000000a4', 'Admin Ln', null, 'admin'),
  ('f0000000-0000-0000-0000-0000000000a5', 'Pendente Ln', null, 'pendente');

select is((select count(*) from pg_tables where schemaname = 'public' and not rowsecurity), 0::bigint,
  'todas as tabelas do schema public têm RLS');

-- ------------------------------------------------ Lojas
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-0000000000a1"}', true);

select lives_ok(
  $$ insert into public.lojas (nome, oriente, potencia, dias_sessao, cidade, irmao_contato, declaracao)
     values ('Loja Estrela do Sul', 'Cuiabá', 'GOMT', '2as e 4as', 'Cuiabá', 'f0000000-0000-0000-0000-0000000000a1', true) $$,
  'irmão cadastra uma Loja (nasce pendente)');
select throws_ok(
  $$ insert into public.lojas (nome, cidade, declaracao) values ('Sem declaração', 'Cuiabá', false) $$,
  '42501', null, 'sem declarar que pertence à Loja: recusado');
select throws_ok(
  $$ insert into public.lojas (nome, cidade, declaracao, irmao_contato)
     values ('Contato alheio', 'Cuiabá', true, 'f0000000-0000-0000-0000-0000000000a2') $$,
  '42501', null, 'o contato só pode ser o próprio autor (consentimento)');
select throws_ok(
  $$ insert into public.lojas (nome, cidade, declaracao, status) values ('Já aprovada', 'Cuiabá', true, 'aprovada') $$,
  '42501', null, 'não nasce aprovada');
select throws_ok(
  $$ insert into public.lojas (nome, cidade, declaracao, lat) values ('Meia posição', 'Cuiabá', true, -15.5) $$,
  '23514', null, 'latitude sem longitude: recusado');
select is((select count(*) from public.lojas), 1::bigint, 'o autor lê a própria Loja pendente');
select throws_ok($$ select criado_por from public.lojas $$, '42501', null, 'nem o autor lê a coluna criado_por');
select throws_ok($$ select public.decidir_loja((select id from public.lojas limit 1), true) $$,
  '42501', 'sem_permissao', 'irmão comum não aprova Loja');

select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-0000000000a2"}', true);
select is((select count(*) from public.lojas), 0::bigint, 'outro irmão não vê Loja pendente');
select throws_ok($$ select * from public.lojas_pendentes() $$, '42501', 'sem_permissao', 'fila de Lojas só da moderação');

select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-0000000000a3"}', true);
select is((select count(*) from public.lojas_pendentes()), 1::bigint, 'a moderação vê a fila');
select is((select autor from public.lojas_pendentes()), 'Irmão Um “Um”', 'e quem cadastrou');
select throws_ok($$ select public.decidir_loja((select id from public.lojas limit 1), false) $$,
  'P0001', 'motivo', 'recusar exige motivo');
select is(public.decidir_loja((select id from public.lojas limit 1), true), 'aprovada', 'o moderador aprova');

select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-0000000000a2"}', true);
select is((select count(*) from public.lojas), 1::bigint, 'membro lê Loja aprovada');
select throws_ok($$ select criado_por from public.lojas $$, '42501', null, 'e não lê quem cadastrou');
select is((select count(*) from public.lojas where nome = 'Loja Estrela do Sul' and irmao_contato is not null), 1::bigint,
  'o contato (que consentiu) aparece');
select is(public.sou_membro_ativo(), true, 'apoio: irmão ativo');

select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-0000000000a5"}', true);
select is((select count(*) from public.lojas), 0::bigint, 'pendente de acesso não lê Lojas');

select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-0000000000a1"}', true);
update public.lojas set dias_sessao = '3as' where nome = 'Loja Estrela do Sul';
select is((select status from public.lojas where nome = 'Loja Estrela do Sul'), 'pendente',
  'o autor edita e a Loja volta para revisão');

-- ------------------------------------------------ Negócios
select lives_ok(
  $$ insert into public.negocios (nome, categoria, cidade, beneficio_irmaos, fotos)
     values ('Oficina do Bode', 'oficina', 'Cuiabá', '10% na revisão', array['f0000000-0000-0000-0000-0000000000a1/f1.jpg']) $$,
  'irmão cadastra o negócio (pendente)');
select throws_ok(
  $$ insert into public.negocios (nome, categoria, cidade, beneficio_irmaos, destaque_ate)
     values ('Quero destaque', 'oficina', 'Cuiabá', 'x1', current_date + 30) $$,
  '42501', null, 'não se dá destaque sozinho');
select throws_ok(
  $$ insert into public.negocios (nome, categoria, cidade, beneficio_irmaos, fotos)
     values ('Foto alheia', 'comida', 'Cuiabá', 'x1', array['f0000000-0000-0000-0000-0000000000a2/f.jpg']) $$,
  '42501', null, 'foto só da própria pasta');
select throws_ok(
  $$ insert into public.negocios (nome, categoria, cidade, beneficio_irmaos) values ('Sem benefício', 'comida', 'Cuiabá', '') $$,
  '23514', null, 'benefício para irmãos é obrigatório');
select throws_ok(
  $$ insert into public.negocios (nome, categoria, cidade, beneficio_irmaos, site)
     values ('Site ruim', 'comida', 'Cuiabá', 'ok ok', 'javascript:alert(1)') $$,
  '23514', null, 'site só http(s)');
select throws_ok($$ select public.definir_destaque((select id from public.negocios limit 1), current_date + 30) $$,
  '42501', 'sem_permissao', 'dono não define destaque');
update public.negocios set destaque_ate = current_date + 99 where nome = 'Oficina do Bode';
select is((select destaque_ate from public.negocios where nome = 'Oficina do Bode'), null::date, 'update direto não muda o destaque');

select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-0000000000a2"}', true);
select is((select count(*) from public.negocios), 0::bigint, 'outro irmão não vê negócio pendente');

select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-0000000000a3"}', true);
select is((select count(*) from public.negocios_pendentes()), 1::bigint, 'moderação vê a fila de negócios');
select is(public.decidir_negocio((select id from public.negocios limit 1), true), 'aprovado', 'moderador aprova negócio');
select throws_ok($$ select public.definir_destaque((select id from public.negocios limit 1), current_date + 30) $$,
  '42501', 'sem_permissao', 'moderador também não define destaque');

select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-0000000000a4"}', true);
select is(public.definir_destaque((select id from public.negocios limit 1), current_date + 30), current_date + 30, 'admin define o destaque');

select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-0000000000a2"}', true);
select is((select destaque_ate from public.negocios limit 1), current_date + 30, 'membro lê negócio aprovado com destaque');

-- ------------------------------------------------ Aniversário e lista de membros
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-0000000000a1"}', true);
select lives_ok($$ insert into public.perfis_aniversario (id, dia, mes) values ('f0000000-0000-0000-0000-0000000000a1', 7, 9) $$,
  'irmão informa o aniversário (escondido por padrão)');
select throws_ok($$ insert into public.perfis_aniversario (id, dia, mes) values ('f0000000-0000-0000-0000-0000000000a2', 1, 1) $$,
  '42501', null, 'não grava o aniversário de outro');

select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-0000000000a2"}', true);
select is((select aniversario_dia from public.membros_lista() where nome = 'Irmão Um'), null::smallint,
  'aniversário escondido não aparece na lista');
select is((select count(*) from public.perfis_aniversario), 0::bigint, 'nem lê a tabela direto');

select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-0000000000a1"}', true);
update public.perfis_aniversario set visivel = true;
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-0000000000a2"}', true);
select is((select aniversario_dia::int * 100 + aniversario_mes from public.membros_lista() where nome = 'Irmão Um'), 709,
  'depois de mostrar, aparece só dia e mês');

select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-0000000000a5"}', true);
select throws_ok($$ select * from public.membros_lista() $$, '42501', 'sem_permissao', 'pendente não vê a lista de membros');

select * from finish();
rollback;
