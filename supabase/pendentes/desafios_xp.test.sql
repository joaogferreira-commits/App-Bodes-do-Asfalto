-- pgTAP: desafios, XP, selos e ranking (P11). Roda com `supabase test db`.
create extension if not exists pgtap with schema extensions;
begin;
select plan(39);

insert into public.capitulos (id, nome, cidade, uf, liberado) values
  ('10000000-0000-0000-0000-0000000000d1', 'Cap Desafio 1', 'Cuiabá', 'MT', true),
  ('10000000-0000-0000-0000-0000000000d2', 'Cap Desafio 2', 'Sinop', 'MT', true);
insert into auth.users (id, email) values
  ('d0000000-0000-0000-0000-0000000000a1', 'a@des'),
  ('d0000000-0000-0000-0000-0000000000a2', 'b@des'),
  ('d0000000-0000-0000-0000-0000000000a3', 'dir1@des'),
  ('d0000000-0000-0000-0000-0000000000a4', 'dir2@des'),
  ('d0000000-0000-0000-0000-0000000000a5', 'mod@des'),
  ('d0000000-0000-0000-0000-0000000000a6', 'outro@des'),
  ('d0000000-0000-0000-0000-0000000000a7', 'pend@des');
insert into public.perfis (id, nome, apelido, capitulo_id, papel) values
  ('d0000000-0000-0000-0000-0000000000a1', 'Irmão Autor', null, '10000000-0000-0000-0000-0000000000d1', 'membro'),
  ('d0000000-0000-0000-0000-0000000000a2', 'Irmão Bravo', 'Bravo', '10000000-0000-0000-0000-0000000000d1', 'membro'),
  ('d0000000-0000-0000-0000-0000000000a3', 'Diretor Um', null, '10000000-0000-0000-0000-0000000000d1', 'diretoria_capitulo'),
  ('d0000000-0000-0000-0000-0000000000a4', 'Diretor Dois', null, '10000000-0000-0000-0000-0000000000d2', 'diretoria_capitulo'),
  ('d0000000-0000-0000-0000-0000000000a5', 'Moderador Geral', null, '10000000-0000-0000-0000-0000000000d2', 'moderador'),
  ('d0000000-0000-0000-0000-0000000000a6', 'Irmão Outro', null, '10000000-0000-0000-0000-0000000000d2', 'membro'),
  ('d0000000-0000-0000-0000-0000000000a7', 'Pendente Fulano', null, '10000000-0000-0000-0000-0000000000d1', 'pendente');

create temp table ids (k text, id uuid);
grant all on ids to authenticated;

select is((select count(*) from pg_tables where schemaname = 'public' and not rowsecurity), 0::bigint,
  'todas as tabelas do schema public têm RLS');
select is(public.xp_do_desafio(100, 'membro'), 50, 'XP fixo: até 100 km vale 50');
select is(public.xp_do_desafio(101, 'membro'), 120, 'XP fixo: 101 km vale 120');
select is(public.xp_do_desafio(1000, 'diretoria'), 600, 'XP oficial vale 50% a mais');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a1"}', true);
insert into ids select 'a', public.criar_desafio('Rodar 500 km', null, 'km', 500, 30);
select is((select status from public.desafios where id = (select id from ids where k = 'a')), 'pendente',
  'desafio de irmão nasce pendente');
select is((select xp from public.desafios where id = (select id from ids where k = 'a')), 250,
  'o XP vem da tabela de km no servidor (500 km = 250)');
select throws_ok($$ select public.criar_desafio('Outro desafio', null, 'km', 100, 30) $$, 'P0001', 'um_por_mes',
  'só um desafio de irmão por mês');
select throws_ok($$ select public.criar_desafio('Muito longo', null, 'km', 100, 120) $$, 'P0001', 'prazo',
  'prazo máximo de 90 dias');
select throws_ok(
  $$ insert into public.desafios (titulo, modalidade, meta, km_total, xp, tipo, dias, status)
     values ('Fura fila', 'km', 10, 10, 9999, 'membro', 10, 'aprovado') $$,
  '42501', null, 'não se insere desafio direto (nem aprovado, nem com XP inventado)');
select throws_ok($$ select public.decidir_desafio((select id from ids where k = 'a'), true) $$, '42501', 'sem_permissao',
  'o criador não aprova o próprio desafio');

select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a2"}', true);
select is((select count(*) from public.desafios), 0::bigint, 'outro irmão não vê o desafio pendente');
select throws_ok($$ select public.decidir_desafio((select id from ids where k = 'a'), true) $$, '42501', 'sem_permissao',
  'irmão comum não decide');
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a4"}', true);
select is((select count(*) from public.desafios), 0::bigint, 'diretoria de outro capítulo não vê o pendente');
select throws_ok($$ select public.decidir_desafio((select id from ids where k = 'a'), true) $$, '42501', 'sem_permissao',
  'diretoria de outro capítulo não decide');
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a3"}', true);
select is((select count(*) from public.desafios), 1::bigint, 'a diretoria do capítulo vê o pendente');
select is(public.decidir_desafio((select id from ids where k = 'a'), true), 'aprovado', 'a diretoria aprova');

select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a2"}', true);
select is((select count(*) from public.desafios where status = 'aprovado'), 1::bigint, 'depois de aprovado, todos os membros leem');
select is(public.entrar_desafio((select id from ids where k = 'a')), true, 'o irmão entra no desafio');
select throws_ok($$ select public.registrar_progresso((select id from ids where k = 'a'), 150) $$, 'P0001', 'salto',
  'km demais logo após entrar (velocidade impossível) é recusado');
select throws_ok($$ select public.registrar_progresso((select id from ids where k = 'a'), 300) $$, 'P0001', 'salto',
  'salto acima de 200 km numa chamada é recusado');

reset role;
update public.participacoes set entrou_em = now() - interval '10 hours';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a2"}', true);
select is(public.registrar_progresso((select id from ids where k = 'a'), 150), 150::numeric, 'progresso plausível é aceito');

reset role;
insert into public.progresso_registros (desafio_id, usuario_id, km)
  values ((select id from ids where k = 'a'), 'd0000000-0000-0000-0000-0000000000a2', 700);
update public.participacoes set ultimo_registro_em = now() - interval '10 hours';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a2"}', true);
select throws_ok($$ select public.registrar_progresso((select id from ids where k = 'a'), 100) $$, 'P0001', 'limite_diario',
  'teto diário de km');

reset role;
delete from public.progresso_registros;
update public.participacoes set km_feitos = 400, ultimo_registro_em = now() - interval '10 hours';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a2"}', true);
select is(public.registrar_progresso((select id from ids where k = 'a'), 100), 500::numeric, 'atingir a meta conclui o desafio');
select is(public.meu_xp(), 250::bigint, 'o XP do desafio entra uma vez, pela tabela');
select is((select count(*) from public.conquistas where usuario_id = auth.uid() and selo = 'desafio'), 1::bigint,
  'ganha o selo do primeiro desafio concluído');
select throws_ok($$ select public.registrar_progresso((select id from ids where k = 'a'), 1) $$, 'P0001', 'ja_concluido',
  'não conta de novo depois de concluído');
select throws_ok($$ insert into public.xp_eventos (usuario_id, origem, pontos) values (auth.uid(), 'trapaca', 9999) $$,
  '42501', null, 'XP não se grava direto pelo app');
select throws_ok($$ update public.xp_eventos set pontos = 9999 $$, '42501', null, 'XP não se altera pelo app');

-- ranking
reset role;
insert into public.xp_eventos (usuario_id, origem, pontos)
  values ('d0000000-0000-0000-0000-0000000000a6', 'teste:outro', 900);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a2"}', true);
select is((select array_agg(nome order by posicao) from public.ranking(null, 'sempre')),
  array['Irmão Outro', 'Irmão Bravo'], 'ranking geral ordena por XP');
select is((select count(*) from public.ranking('10000000-0000-0000-0000-0000000000d1', 'mes')), 1::bigint,
  'ranking do capítulo só traz o capítulo');
select is(public.definir_fora_do_ranking(true), true, 'o irmão sai do ranking');
select is((select count(*) from public.ranking(null, 'sempre') where nome = 'Irmão Bravo'), 0::bigint,
  'quem saiu não aparece no ranking');
select is(public.meu_xp(), 250::bigint, 'mas continua com o XP');

-- diretoria publica direto; moderador recusa com motivo; entre capítulos pede aceite do outro capítulo
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a3"}', true);
insert into ids select 'dir', public.criar_desafio('Desafio da diretoria', null, 'km', 1000, 30);
select is((select status from public.desafios where id = (select id from ids where k = 'dir')), 'aprovado',
  'desafio da diretoria é publicado direto, com XP oficial (600)');
insert into ids select 'cap', public.criar_desafio('Cuiabá x Sinop', null, 'km', 300, 30,
  array['10000000-0000-0000-0000-0000000000d1', '10000000-0000-0000-0000-0000000000d2']::uuid[]);
select is((select status from public.desafios where id = (select id from ids where k = 'cap')), 'pendente',
  'desafio entre capítulos espera o aceite do outro capítulo');

select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a4"}', true);
select is(public.decidir_desafio((select id from ids where k = 'cap'), true), 'aprovado',
  'a diretoria do outro capítulo aceita e o desafio é publicado');

select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a6"}', true);
insert into ids select 'o', public.criar_desafio('Desafio do outro', null, 'km', 200, 20);
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a5"}', true);
select throws_ok($$ select public.decidir_desafio((select id from ids where k = 'o'), false) $$, 'P0001', 'motivo',
  'recusar exige motivo');
select is(public.decidir_desafio((select id from ids where k = 'o'), false, 'Meta irreal'), 'recusado',
  'o moderador também decide (não só a diretoria)');

select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-0000000000a7"}', true);
select throws_ok($$ select public.criar_desafio('Pendente tenta', null, 'km', 100, 10) $$, '42501', 'sem_acesso',
  'quem ainda está pendente não cria desafio');

select * from finish();
rollback;
