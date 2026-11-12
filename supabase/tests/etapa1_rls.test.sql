-- PONTO DE TESTE 1 em SQL (pgTAP): quem vê o quê. Roda com `supabase test db`.
create extension if not exists pgtap with schema extensions;
begin;
select plan(21);

-- ---------- preparação (como postgres)
insert into public.capitulos (id, nome, cidade, uf, liberado) values
  ('10000000-0000-0000-0000-000000000001', 'Cap Sem Diretoria', 'Cuiabá', 'MT', true),
  ('10000000-0000-0000-0000-000000000002', 'Cap Com Diretoria', 'Sinop', 'MT', true);

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'admin@teste'),
  ('a0000000-0000-0000-0000-000000000002', 'moderador@teste'),
  ('a0000000-0000-0000-0000-000000000003', 'diretor@teste'),
  ('a0000000-0000-0000-0000-000000000004', 'membroA@teste'),
  ('a0000000-0000-0000-0000-000000000005', 'membroB@teste'),
  ('a0000000-0000-0000-0000-000000000006', 'candidato1@teste'),
  ('a0000000-0000-0000-0000-000000000007', 'candidato2@teste');

insert into public.perfis (id, nome, capitulo_id, papel) values
  ('a0000000-0000-0000-0000-000000000001', 'Admin', '10000000-0000-0000-0000-000000000001', 'admin'),
  ('a0000000-0000-0000-0000-000000000002', 'Moderador', '10000000-0000-0000-0000-000000000001', 'moderador'),
  ('a0000000-0000-0000-0000-000000000003', 'Diretor', '10000000-0000-0000-0000-000000000002', 'diretoria_capitulo'),
  ('a0000000-0000-0000-0000-000000000004', 'Membro A', '10000000-0000-0000-0000-000000000001', 'membro'),
  ('a0000000-0000-0000-0000-000000000005', 'Membro B', '10000000-0000-0000-0000-000000000001', 'membro');

insert into public.solicitacoes_entrada (id, usuario_id, nome, capitulo_id, cidade, telefone, foto_colete_path, foto_carteirinha_path)
values
  ('50000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000006', 'Candidato Um', '10000000-0000-0000-0000-000000000001', 'Cuiabá', '65999990000', 'c1.jpg', 'k1.jpg'),
  ('50000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000007', 'Candidato Dois', '10000000-0000-0000-0000-000000000002', 'Sinop', '66999990000', 'c2.jpg', 'k2.jpg');

-- ---------- 1. RLS ligado em todas as tabelas públicas
select is(
  (select count(*) from pg_tables where schemaname = 'public' and not rowsecurity),
  0::bigint,
  'todas as tabelas do schema public têm RLS'
);

-- ---------- 2. pendente não vê ninguém
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000006"}', true);
select is((select count(*) from public.perfis), 0::bigint, 'pendente não vê nenhum perfil');
select is((select count(*) from public.solicitacoes_entrada), 1::bigint, 'pendente vê só a própria solicitação');
select throws_ok(
  $$ select public.aprovar_solicitacao('50000000-0000-0000-0000-000000000001', true) $$,
  'sem permissão para decidir este capítulo',
  'pendente não aprova a si mesmo'
);

-- ---------- 3. capítulo sem diretoria: moderador aprova
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000002"}', true);
select lives_ok(
  $$ select public.aprovar_solicitacao('50000000-0000-0000-0000-000000000001', true) $$,
  'moderador aprova no capítulo sem diretoria'
);
-- ---------- 4. capítulo com diretoria: moderador não aprova; só a diretoria
select throws_ok(
  $$ select public.aprovar_solicitacao('50000000-0000-0000-0000-000000000002', true) $$,
  'sem permissão para decidir este capítulo',
  'moderador não aprova capítulo que já tem diretoria'
);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000003"}', true);
select is((select count(*) from public.solicitacoes_entrada where status = 'aberta'), 1::bigint, 'diretoria vê o pedido do seu capítulo');
select lives_ok(
  $$ select public.aprovar_solicitacao('50000000-0000-0000-0000-000000000002', true) $$,
  'diretoria aprova o próprio capítulo'
);
reset role;
select is(
  (select papel::text from public.perfis where id = 'a0000000-0000-0000-0000-000000000006'),
  'membro',
  'aprovado vira membro'
);

-- ---------- 5. membro vê membros; não muda o próprio papel
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000004"}', true);
select ok((select count(*) from public.perfis) >= 5, 'membro vê a lista de membros');
select throws_ok(
  $$ update public.perfis set papel = 'admin' where id = auth.uid() $$,
  'papel, capítulo e desativação só mudam pela diretoria ou moderação',
  'membro não se promove'
);
select lives_ok($$ update public.perfis set apelido = 'Coruja' where id = auth.uid() $$, 'membro edita o próprio apelido');

-- ---------- 6. contatos de emergência: só o dono
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000005"}', true);
insert into public.contatos_emergencia (nome, telefone) values ('Esposa', '65988887777');
select is((select count(*) from public.contatos_emergencia), 1::bigint, 'B vê o próprio contato');
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000004"}', true);
select is((select count(*) from public.contatos_emergencia), 0::bigint, 'A não vê o contato de B');
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000002"}', true);
select is((select count(*) from public.contatos_emergencia), 0::bigint, 'nem a moderação vê contatos de emergência');

-- ---------- 7. dados maçônicos: consentimento, visibilidade por campo, cifrado
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000005"}', true);
select throws_ok(
  $$ select public.definir_macom('Loja X', 'Cuiabá', 'GOB', 'ninguem', 'membros', 'membros') $$,
  'consentimento para dados maçônicos é obrigatório',
  'sem consentimento não grava dados maçônicos'
);
insert into public.consentimentos (finalidade, versao) values ('dados_macons', '1');
select public.definir_macom('Loja X', 'Cuiabá', '', 'ninguem', 'membros', 'membros');
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000004"}', true);
select results_eq(
  $$ select loja, oriente, potencia from public.ler_macom('a0000000-0000-0000-0000-000000000005') $$,
  $$ values (null::text, 'Cuiabá'::text, null::text) $$,
  'Loja marcada "ninguém" não aparece; Oriente marcado "membros" aparece'
);
select throws_ok($$ select * from public.perfil_macom $$, '42501', null, 'tabela cifrada não é lida direto pelo app');

-- ---------- 8. revogar o consentimento apaga os dados maçônicos
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000005"}', true);
update public.consentimentos set revogado_em = now() where finalidade = 'dados_macons';
reset role;
select is((select count(*) from public.perfil_macom where usuario_id = 'a0000000-0000-0000-0000-000000000005'), 0::bigint, 'revogar apaga os dados maçônicos');

-- ---------- 9. excluir a conta apaga tudo do irmão
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000005"}', true);
select public.excluir_minha_conta();
reset role;
select is((select count(*) from public.perfis where id = 'a0000000-0000-0000-0000-000000000005'), 0::bigint, 'excluir a conta apaga o perfil e os dados');

-- só o admin muda papéis (membro comum não consegue)
select throws_ok(
  $$ select public.definir_papel('00000000-0000-0000-0000-000000000099'::uuid, 'moderador'::public.papel) $$,
  'só o administrador muda papéis',
  'membro comum não nomeia moderador'
);

select * from finish();
rollback;
