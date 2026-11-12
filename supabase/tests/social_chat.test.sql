-- pgTAP: feed, bloqueios, chat, acenos, mapa ao vivo. Roda com `supabase test db`.
create extension if not exists pgtap with schema extensions;
begin;
select plan(22);

-- ---------- preparação (como postgres)
insert into public.capitulos (id, nome, cidade, uf, liberado) values
  ('10000000-0000-0000-0000-000000000001', 'Cap Um', 'Cuiabá', 'MT', true),
  ('10000000-0000-0000-0000-000000000002', 'Cap Dois', 'Sinop', 'MT', true);

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000002', 'moderador@teste'),
  ('a0000000-0000-0000-0000-000000000003', 'diretor@teste'),
  ('a0000000-0000-0000-0000-000000000004', 'membroA@teste'),
  ('a0000000-0000-0000-0000-000000000005', 'membroB@teste'),
  ('a0000000-0000-0000-0000-000000000006', 'membroC@teste');

insert into public.perfis (id, nome, capitulo_id, papel) values
  ('a0000000-0000-0000-0000-000000000002', 'Moderador', '10000000-0000-0000-0000-000000000001', 'moderador'),
  ('a0000000-0000-0000-0000-000000000003', 'Diretor', '10000000-0000-0000-0000-000000000002', 'diretoria_capitulo'),
  ('a0000000-0000-0000-0000-000000000004', 'Membro A', '10000000-0000-0000-0000-000000000001', 'membro'),
  ('a0000000-0000-0000-0000-000000000005', 'Membro B', '10000000-0000-0000-0000-000000000001', 'membro'),
  ('a0000000-0000-0000-0000-000000000006', 'Membro C', '10000000-0000-0000-0000-000000000002', 'membro');

-- 11 destinatários de aceno (b...01 a b...11)
insert into auth.users (id, email)
  select ('b0000000-0000-0000-0000-0000000000' || lpad(i::text, 2, '0'))::uuid, 'dest' || i || '@teste'
  from generate_series(1, 11) i;
insert into public.perfis (id, nome, capitulo_id, papel)
  select ('b0000000-0000-0000-0000-0000000000' || lpad(i::text, 2, '0'))::uuid, 'Dest ' || i,
         '10000000-0000-0000-0000-000000000001', 'membro'
  from generate_series(1, 11) i;

-- posts: p1 (C, só capítulo 2), p2 (C, todos), p3 (B, todos), p4 (A, todos)
insert into public.posts (id, autor, texto, visibilidade) values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000006', 'só do capítulo dois', 'capitulo'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000006', 'para todos', 'todos'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000005', 'post do B', 'todos'),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'post do A', 'todos');

-- chat: grupo do capítulo 1 só com A; avisos do capítulo 2 com C e o diretor
insert into public.conversas (id, tipo, titulo, capitulo_id) values
  ('d0000000-0000-0000-0000-000000000001', 'capitulo', 'Grupo Cap Um', '10000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000002', 'avisos', 'Avisos Cap Dois', '10000000-0000-0000-0000-000000000002');
insert into public.participantes (conversa_id, usuario_id) values
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000006'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003');
insert into public.mensagens (conversa_id, autor, texto) values
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'bom dia, irmãos');

-- stories: um expirado e um válido (o gatilho fixa 24 h; o expirado é recuado depois)
insert into public.stories (id, autor, tipo, conteudo) values
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000006', 'texto', '{"texto":"velho"}'),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000006', 'texto', '{"texto":"novo"}');
update public.stories set expira_em = now() - interval '1 hour' where id = 'e0000000-0000-0000-0000-000000000001';

-- posição de C em Cuiabá, "aproximado"
insert into public.posicoes_ao_vivo (usuario_id, ponto, visibilidade)
values ('a0000000-0000-0000-0000-000000000006',
        extensions.st_setsrid(extensions.st_makepoint(-56.0974, -15.601), 4326)::extensions.geography,
        'aproximado');

-- ---------- 1. RLS ligado em todas as tabelas públicas
select is(
  (select count(*) from pg_tables where schemaname = 'public' and not rowsecurity),
  0::bigint,
  'todas as tabelas do schema public têm RLS'
);

-- ---------- feed: visibilidade
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000004"}', true);
select is((select count(*) from public.posts where id = 'c0000000-0000-0000-0000-000000000001'), 0::bigint,
  'membro não lê post "capitulo" de outro capítulo');
select is((select count(*) from public.posts where id = 'c0000000-0000-0000-0000-000000000002'), 1::bigint,
  'membro lê post "todos" de outro capítulo');
select throws_ok(
  $$ insert into public.posts (autor, texto) values ('a0000000-0000-0000-0000-000000000005', 'falso') $$,
  '42501', null, 'membro não publica em nome de outro');

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000003"}', true);
select is((select count(*) from public.posts where id = 'c0000000-0000-0000-0000-000000000001'), 1::bigint,
  'membro do mesmo capítulo lê post "capitulo"');

-- ---------- bloqueios
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000004"}', true);
select lives_ok($$ insert into public.bloqueios (bloqueado) values ('a0000000-0000-0000-0000-000000000005') $$,
  'A bloqueia B');
select is((select count(*) from public.posts where id = 'c0000000-0000-0000-0000-000000000003'), 0::bigint,
  'quem bloqueou não vê posts do bloqueado');
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000005"}', true);
select is((select count(*) from public.posts where id = 'c0000000-0000-0000-0000-000000000004'), 0::bigint,
  'o bloqueado não vê posts de quem o bloqueou');

-- ---------- chat
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000006"}', true);
select is((select count(*) from public.mensagens where conversa_id = 'd0000000-0000-0000-0000-000000000001'), 0::bigint,
  'não-participante não lê mensagens');
select throws_ok(
  $$ insert into public.mensagens (conversa_id, texto) values ('d0000000-0000-0000-0000-000000000002', 'oi') $$,
  '42501', null, 'membro comum não escreve em "avisos"');
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000003"}', true);
select lives_ok(
  $$ insert into public.mensagens (conversa_id, texto) values ('d0000000-0000-0000-0000-000000000002', 'reunião sábado') $$,
  'diretoria escreve em "avisos"');
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000004"}', true);
select is((select count(*) from public.mensagens where conversa_id = 'd0000000-0000-0000-0000-000000000001'), 1::bigint,
  'participante lê as mensagens');

-- ---------- acenos: limite de 10 por dia
select lives_ok(
  $$ do $b$ begin
       for i in 1..10 loop
         insert into public.acenos (para) values (('b0000000-0000-0000-0000-0000000000' || lpad(i::text, 2, '0'))::uuid);
       end loop;
     end $b$ $$,
  '10 acenos no dia passam');
select throws_ok(
  $$ insert into public.acenos (para) values ('b0000000-0000-0000-0000-000000000011') $$,
  'limite de 10 acenos por dia', '11º aceno do dia falha');

-- aceno aceito cria a conversa direta com os 2 participantes
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000006"}', true);
select lives_ok($$ insert into public.acenos (para) values ('a0000000-0000-0000-0000-000000000004') $$,
  'C acena para A');
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000004"}', true);
select lives_ok(
  $$ select public.aceitar_aceno((select id from public.acenos where de = 'a0000000-0000-0000-0000-000000000006' and para = auth.uid())) $$,
  'A aceita o aceno');
select is((select count(*) from public.conversas where tipo = 'direto'), 1::bigint,
  'aceitar cria a conversa direta (A a enxerga)');
select is((select count(*) from public.participantes p join public.conversas c on c.id = p.conversa_id where c.tipo = 'direto'),
  2::bigint, 'a conversa direta tem os 2 participantes');

-- ---------- stories: expirado não aparece
select is((select count(*) from public.stories), 1::bigint, 'story expirado some; o válido aparece');

-- ---------- mapa ao vivo
select is((select count(*) from public.posicoes_ao_vivo), 0::bigint, 'ninguém lê posicoes_ao_vivo de outro irmão');
select results_eq(
  $$ select usuario_id, round(lat::numeric, 3), round(lon::numeric, 3), precisao
       from public.posicoes_visiveis(-57, -16, -55, -15) $$,
  $$ values ('a0000000-0000-0000-0000-000000000006'::uuid, -15.625::numeric, -56.075::numeric, 'aproximado'::text) $$,
  'posicoes_visiveis arredonda "aproximado" para o centro da célula de ~5 km (nunca a coordenada exata)');

-- zona privada: a posição some do mapa
reset role;
insert into public.zonas_privadas (usuario_id, nome, centro, raio_m) values
  ('a0000000-0000-0000-0000-000000000006', 'casa',
   extensions.st_setsrid(extensions.st_makepoint(-56.0974, -15.601), 4326)::extensions.geography, 500);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000004"}', true);
select is((select count(*) from public.posicoes_visiveis(-57, -16, -55, -15)), 0::bigint,
  'quem está em zona privada não aparece no mapa');

select * from finish();
rollback;
