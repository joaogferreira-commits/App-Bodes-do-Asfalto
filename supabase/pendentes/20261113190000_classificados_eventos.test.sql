-- pgTAP: Classificados (limite, expiração, moderação por denúncia) e Eventos (aprovação, limite diário, janela de leitura).
-- Roda com `supabase test db` (o CI copia os pendentes).
create extension if not exists pgtap with schema extensions;
begin;
select plan(41);

insert into auth.users (id, email) values
  ('f1000000-0000-0000-0000-0000000000a1', 'a@ce'),
  ('f1000000-0000-0000-0000-0000000000a2', 'b@ce'),
  ('f1000000-0000-0000-0000-0000000000a3', 'mod@ce'),
  ('f1000000-0000-0000-0000-0000000000a5', 'pend@ce');
insert into public.perfis (id, nome, apelido, papel) values
  ('f1000000-0000-0000-0000-0000000000a1', 'Irmão Um', 'Um', 'membro'),
  ('f1000000-0000-0000-0000-0000000000a2', 'Irmão Dois', null, 'membro'),
  ('f1000000-0000-0000-0000-0000000000a3', 'Moderador Ce', null, 'moderador'),
  ('f1000000-0000-0000-0000-0000000000a5', 'Pendente Ce', null, 'pendente');

select is((select count(*) from pg_tables where schemaname = 'public' and not rowsecurity), 0::bigint,
  'todas as tabelas do schema public têm RLS');

-- ------------------------------------------------ Classificados
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-0000000000a1"}', true);

select lives_ok(
  $$ insert into public.classificados (titulo, descricao, preco, categoria, cidade, fotos, whatsapp)
     values ('Capacete tam 60', 'Pouco uso', 450, 'equipamento', 'Cuiabá', array['f1000000-0000-0000-0000-0000000000a1/c1.jpg'], '65999990000') $$,
  'irmão publica um anúncio (sem aprovação prévia)');
select throws_ok(
  $$ insert into public.classificados (titulo, categoria, cidade, fotos)
     values ('Foto alheia', 'moto', 'Cuiabá', array['f1000000-0000-0000-0000-0000000000a2/x.jpg']) $$,
  '42501', null, 'foto só da própria pasta');
select throws_ok(
  $$ insert into public.classificados (titulo, categoria, cidade, status) values ('Já removido', 'moto', 'Cuiabá', 'removido') $$,
  '42501', null, 'não nasce removido');
select throws_ok(
  $$ insert into public.classificados (titulo, categoria, cidade) values ('Carro novo', 'carro', 'Cuiabá') $$,
  '23514', null, 'categoria só da lista');
select throws_ok(
  $$ insert into public.classificados (titulo, categoria, cidade) values ('ab', 'moto', 'Cuiabá') $$,
  '23514', null, 'título curto demais');
select lives_ok(
  $$ do $b$ begin
       insert into public.classificados (titulo, categoria, cidade) values ('Anuncio B', 'pecas', 'Cuiabá');
       insert into public.classificados (titulo, categoria, cidade) values ('Anuncio C', 'moto', 'Cuiabá');
       insert into public.classificados (titulo, categoria, cidade) values ('Anuncio D', 'vestuario', 'Cuiabá');
       insert into public.classificados (titulo, categoria, cidade) values ('Anuncio E', 'outro', 'Cuiabá');
     end $b$ $$,
  'chega a 5 anúncios ativos');
select throws_ok(
  $$ insert into public.classificados (titulo, categoria, cidade) values ('Anuncio extra', 'moto', 'Cuiabá') $$,
  'P0001', 'limite_ativos', 'o sexto anúncio ativo é recusado');
update public.classificados set status = 'vendido' where titulo = 'Anuncio B';
select lives_ok(
  $$ insert into public.classificados (titulo, categoria, cidade) values ('Anuncio F', 'moto', 'Cuiabá') $$,
  'vendido libera uma vaga');
select throws_ok(
  $$ update public.classificados set status = 'ativo' where titulo = 'Anuncio B' $$,
  'P0001', 'limite_ativos', 'voltar a anunciar também respeita o limite');
select throws_ok(
  $$ update public.classificados set status = 'removido' where titulo = 'Anuncio E' $$,
  '42501', null, 'o autor não se dá o estado "removido"');
update public.classificados set expira_em = now() + interval '999 days' where titulo = 'Anuncio E';
select ok((select expira_em from public.classificados where titulo = 'Anuncio E') < now() + interval '61 days',
  'o autor não estica a validade');

select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-0000000000a2"}', true);
select is((select count(*) from public.classificados), 5::bigint, 'outro irmão lê só os ativos (o vendido some)');
update public.classificados set titulo = 'Invadido';
select is((select count(*) from public.classificados where titulo = 'Invadido'), 0::bigint,
  'outro irmão não edita anúncio alheio');
delete from public.classificados;
select is((select count(*) from public.classificados), 5::bigint,
  'nem apaga');
select lives_ok(
  $$ insert into public.denuncias (alvo_tipo, alvo_id, motivo)
     select 'classificado', id, 'Anúncio suspeito' from public.classificados where titulo = 'Anuncio C' $$,
  'irmão denuncia o anúncio');

select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-0000000000a5"}', true);
select is((select count(*) from public.classificados), 0::bigint, 'pendente de acesso não lê classificados');

select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-0000000000a3"}', true);
select is((select count(*) from public.classificados), 6::bigint, 'moderação lê todos, inclusive o vendido');
select lives_ok(
  $$ select public.moderar_denuncia((select id from public.denuncias limit 1), true, true) $$,
  'moderação decide a denúncia e remove o anúncio');
select is((select status from public.classificados where titulo = 'Anuncio C'), 'removido', 'o anúncio fica removido');

select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-0000000000a1"}', true);
select throws_ok(
  $$ update public.classificados set status = 'ativo' where titulo = 'Anuncio C' $$,
  '42501', null, 'o autor não reativa o que a moderação removeu');

select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-0000000000a2"}', true);
select is((select count(*) from public.classificados), 4::bigint, 'removido some para os outros irmãos');

reset role;
update public.classificados set expira_em = now() - interval '1 day' where titulo = 'Anuncio D';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-0000000000a2"}', true);
select is((select count(*) from public.classificados), 3::bigint, 'anúncio vencido some para os outros irmãos');

-- ------------------------------------------------ Eventos
select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-0000000000a1"}', true);
select lives_ok(
  $$ insert into public.eventos (titulo, descricao, tipo, inicio, local, cidade)
     values ('Sessão magna', 'Divulgação da Loja', 'loja', now() + interval '2 days', 'Templo central', 'Cuiabá') $$,
  'irmão cadastra evento (nasce pendente)');
select throws_ok(
  $$ insert into public.eventos (titulo, tipo, inicio, cidade) values ('Tipo ruim', 'festa', now() + interval '2 days', 'Cuiabá') $$,
  '23514', null, 'tipo só da lista');
select throws_ok(
  $$ insert into public.eventos (titulo, tipo, inicio, fim, cidade)
     values ('Fim antes', 'outro', now() + interval '2 days', now() + interval '1 day', 'Cuiabá') $$,
  '23514', null, 'o fim não vem antes do início');
select throws_ok(
  $$ insert into public.eventos (titulo, tipo, inicio, cidade, status)
     values ('Já aprovado', 'outro', now() + interval '2 days', 'Cuiabá', 'aprovado') $$,
  '42501', null, 'ninguém se aprova sozinho');
select lives_ok(
  $$ do $b$ begin
       insert into public.eventos (titulo, tipo, inicio, cidade) values ('Encontro B', 'motoclube', now() + interval '3 days', 'Cuiabá');
       insert into public.eventos (titulo, tipo, inicio, cidade) values ('Recusado C', 'maconico', now() + interval '4 days', 'Cuiabá');
     end $b$ $$,
  'chega a 3 eventos no dia');
select throws_ok(
  $$ insert into public.eventos (titulo, tipo, inicio, cidade) values ('Quarto', 'outro', now() + interval '5 days', 'Cuiabá') $$,
  'P0001', 'limite_diario', 'o quarto evento do dia é recusado');

select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-0000000000a2"}', true);
select is((select count(*) from public.eventos), 0::bigint, 'evento pendente não aparece para outro irmão');
select throws_ok($$ select public.decidir_evento((select id from public.eventos limit 1), true) $$,
  '42501', null, 'irmão comum não decide evento');
select throws_ok($$ select * from public.eventos_pendentes() $$, '42501', 'sem_permissao', 'nem lê a fila');

select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-0000000000a3"}', true);
select is((select count(*) from public.eventos_pendentes()), 3::bigint, 'moderação vê a fila de eventos');
select throws_ok(
  $$ select public.decidir_evento((select id from public.eventos where titulo = 'Recusado C'), false) $$,
  'P0001', 'motivo', 'recusar exige motivo');
select is(public.decidir_evento((select id from public.eventos where titulo = 'Recusado C'), false, 'Evento sem relação com o clube'),
  'recusado', 'moderação recusa com motivo');
select is(public.decidir_evento((select id from public.eventos where titulo = 'Sessão magna'), true), 'aprovado', 'aprova a Sessão magna');
select is(public.decidir_evento((select id from public.eventos where titulo = 'Encontro B'), true), 'aprovado', 'aprova o Encontro B');

reset role;
-- Sessão magna passa a estar em andamento; Encontro B já passou.
update public.eventos set inicio = now() - interval '2 hours', fim = now() + interval '2 hours' where titulo = 'Sessão magna';
update public.eventos set inicio = now() - interval '3 days', fim = now() - interval '2 days' where titulo = 'Encontro B';
set local role authenticated;

select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-0000000000a2"}', true);
select is((select titulo from public.eventos), 'Sessão magna', 'só aparece o aprovado em andamento (o passado e o recusado não)');
update public.eventos set titulo = 'Invadido';
select is((select count(*) from public.eventos where titulo = 'Invadido'), 0::bigint,
  'outro irmão não edita evento alheio');

select set_config('request.jwt.claims', '{"sub":"f1000000-0000-0000-0000-0000000000a1"}', true);
select is((select motivo_recusa from public.eventos where titulo = 'Recusado C'), 'Evento sem relação com o clube',
  'o autor lê o motivo da recusa');
update public.eventos set descricao = 'Nova descrição' where titulo = 'Sessão magna';
select is((select status from public.eventos where titulo = 'Sessão magna'), 'pendente', 'editar volta o evento para a revisão');

select * from finish();
rollback;
