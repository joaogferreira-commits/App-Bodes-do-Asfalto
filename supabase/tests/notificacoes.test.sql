-- pgTAP mínimo: tokens_push e config_notificacao protegidos. Roda com `supabase test db` (depois de aplicar a migration).
create extension if not exists pgtap with schema extensions;
begin;
select plan(5);

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-0000000000a1', 'a@teste'),
  ('a0000000-0000-0000-0000-0000000000a2', 'b@teste');
insert into public.perfis (id, nome, papel) values
  ('a0000000-0000-0000-0000-0000000000a1', 'Irmão A', 'membro'),
  ('a0000000-0000-0000-0000-0000000000a2', 'Irmão B', 'membro');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-0000000000a1', true);

select lives_ok(
  $$insert into public.tokens_push (usuario_id, token, plataforma) values ('a0000000-0000-0000-0000-0000000000a1', 'ExponentPushToken[aaaaaaaa]', 'android')$$,
  'o dono grava o próprio token');
select throws_ok(
  $$insert into public.tokens_push (usuario_id, token, plataforma) values ('a0000000-0000-0000-0000-0000000000a2', 'ExponentPushToken[bbbbbbbb]', 'android')$$,
  '42501', null, 'não grava token de outro irmão');

select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-0000000000a2', true);
select is((select count(*)::int from public.tokens_push), 0, 'outro irmão não lê o token alheio');

select throws_ok($$select * from public.config_notificacao$$, '42501', null, 'o app não lê a configuração privada');
select throws_ok($$select public.notificar_async(array[]::uuid[], 'aceno', 't', 'c')$$, '42501', null, 'o app não chama notificar_async');

select * from finish();
rollback;
